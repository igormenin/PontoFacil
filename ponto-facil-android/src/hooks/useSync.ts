import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/db';
import { pushSync, pullSync } from '../api/syncApi';
import { useAuthStore } from '../store/useAuthStore';

const LAST_SYNC_KEY = '@PontoFacil:lastSyncAt';
const LAST_SYNC_SUMMARY = '@PontoFacil:lastSyncSummary';

// Normalization map to handle plural from server or old names
const TABLE_MAP: Record<string, string> = {
  'clientes': 'cliente',
  'dias': 'dia',
  'intervalos': 'intervalo',
  'meses': 'mes',
  'feriados': 'feriado',
  'valor_hora_historico': 'valor_hora',
  'valores_hora_base': 'valor_hora',
  'valor_hora_base': 'valor_hora'
};

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const isLeitor = user?.leitor === true;

  const performSync = useCallback(async (forceFullSync: boolean = false) => {
    setSyncing(true);
    setError(null);
    const db = await getDatabase();

    try {
      // Determina se precisa de sincronização forçada (primeira vez ou pedido manual)
      const lastSyncAt = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const shouldForce = forceFullSync || !lastSyncAt;
      
      console.log(`[Sync] Iniciando sincronização. Force: ${shouldForce}`);

      // 1. PUSH PHASE - Skip if reader
      if (!isLeitor) {
        try {
          const pushTables = ['cliente', 'dia', 'intervalo', 'mes', 'feriado', 'valor_hora'];
          
          for (const table of pushTables) {
            const pendingMutations = await db.getAllAsync<any>(
              'SELECT * FROM sync_queue WHERE table_name = ? ORDER BY created_at ASC',
              [table]
            );

            if (pendingMutations.length > 0) {
              const mutations = [];
              for (const m of pendingMutations) {
                const payload = JSON.parse(m.payload || '{}');
                
                // Final adjustment for push (resolve foreign keys and map names)
                if (table === 'intervalo') {
                  const dia = await db.getFirstAsync<any>('SELECT diaId FROM dia WHERE id = ?', [payload.intDiaId]);
                  const cli = await db.getFirstAsync<any>('SELECT id FROM cliente WHERE cliId = ?', [payload.intCliId]);
                  if (!dia?.diaId) continue;
                  payload.intDiaId = dia.diaId;
                  payload.intCliId = cli?.cliId || null;
                } else if (table === 'valor_hora') {
                  const cli = await db.getFirstAsync<any>('SELECT cliId FROM cliente WHERE id = ?', [payload.vhCliId]);
                  if (!cli?.cliId) continue;
                  payload.vhCliId = cli.cliId;
                  
                  // Map Mobile -> Server
                  payload.vhDataInicio = payload.vhMesInicio;
                  if (payload.vhDataInicio && payload.vhDataInicio.length === 7) {
                    payload.vhDataInicio += '-01';
                  }
                  delete payload.vhMesInicio;
                  delete payload.vhAtivo; // Server doesn't have this
                } else if (table === 'mes') {
                  // Server only has mes_ano_mes and usu_id
                  // Remove all local calculation columns before push
                  const mesAnoMes = payload.mesAnoMes;
                  Object.keys(payload).forEach(key => delete payload[key]);
                  payload.mesAnoMes = mesAnoMes;
                } else if (table === 'dia') {
                  // Server doesn't have dia_horas_meta
                  delete payload.diaHorasMeta;
                }

                mutations.push({
                  table: table === 'valor_hora' ? 'valor_hora_base' : table,
                  operation: m.operation,
                  localId: m.local_id,
                  serverId: m.server_id,
                  payload
                });
              }

              if (mutations.length > 0) {
                console.log(`[Sync] Enviando requisição de PUSH para a tabela: ${table}`);
                const { results } = await pushSync(mutations);
                console.log(`[Sync] Resposta do PUSH recebida para a tabela ${table}:`, JSON.stringify(results, null, 2));
                for (const res of results) {
                  if (res.status === 'success' && res.serverId) {
                    const idPrefix = table === 'valor_hora' ? 'vh' : table.substring(0, 3);
                    const serverIdField = `${idPrefix}Id`;
                    
                    await db.runAsync(
                      `UPDATE ${table} SET ${serverIdField} = ?, sync_status = 'synced' WHERE id = ?`,
                      [res.serverId, res.localId]
                    );
                  }
                  const match = pendingMutations.find(m => m.local_id === res.localId);
                  if (match && (res.status === 'success' || res.message?.includes('Conflict'))) {
                    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [match.id]);
                  }
                }
              }
            }
          }
        } catch (pushErr: any) {
          console.error('[Sync] Erro crasso durante o PUSH:', pushErr.response?.data || pushErr.message);
          console.warn('[Sync] Push failed, proceeding to pull:', pushErr);
        }
      }

      // 2. PULL PHASE
      console.log(`[Sync] Iniciando requisição de PULL (force=${shouldForce})...`);
      const { changes, serverTime } = await pullSync(shouldForce);

      console.log(`[Sync] Resposta do PULL recebida. ServerTime:`, serverTime);
      console.log(`[Sync] Tabelas com alterações no PULL:`, Object.keys(changes));
      const sanitize = (arr: any[]) => arr.map(v => v === undefined ? null : v);
      
      let pullCount = 0;

      for (const [rawTable, records] of Object.entries(changes)) {
        const table = TABLE_MAP[rawTable] || rawTable;
        const items = records as any[];
        if (items.length === 0) continue;
        
        pullCount += items.length;
        const idPrefix = table === 'valor_hora' ? 'vh' : table.substring(0, 3);
        const serverIdField = `${idPrefix}Id`;

        for (const remote of items) {
          const serverId = remote[serverIdField] || remote.id;
          if (remote.deletedAt) {
            await db.runAsync(`DELETE FROM ${table} WHERE ${serverIdField} = ?`, [serverId]);
            continue;
          }

          // Map Server -> Mobile names e limpeza de datas
          if (remote.vhDataInicio) {
            remote.vhMesInicio = remote.vhDataInicio.substring(0, 7);
            delete remote.vhDataInicio;
          }
          if (table === 'dia' && remote.diaData) {
            remote.diaData = remote.diaData.split('T')[0];
          }
          if (table === 'feriado' && remote.ferData) {
            remote.ferData = remote.ferData.split('T')[0];
          }

          let existing = await db.getFirstAsync<any>(`SELECT id FROM ${table} WHERE ${serverIdField} = ?`, [serverId]);
          
          // Se não encontrou pelo ID do servidor, procura por chave de negócio (data/mês) para evitar erro de UNIQUE
          if (!existing) {
            if (table === 'dia' && remote.diaData) {
              existing = await db.getFirstAsync<any>('SELECT id FROM dia WHERE diaData = ?', [remote.diaData]);
            } else if (table === 'mes' && remote.mesAnoMes) {
              existing = await db.getFirstAsync<any>('SELECT id FROM mes WHERE mesAnoMes = ?', [remote.mesAnoMes]);
            } else if (table === 'feriado' && remote.ferData) {
              existing = await db.getFirstAsync<any>('SELECT id FROM feriado WHERE ferData = ?', [remote.ferData]);
            }
          }

          // Generic column mapper - filter out server-only technical columns
          const columns = Object.keys(remote).filter(k => 
            k !== 'id' && 
            k !== 'createdAt' && 
            k !== 'updatedAt' && 
            k !== 'deletedAt' && 
            k !== 'intervalos' &&
            k !== 'usuId' &&
            k !== 'deviceId' &&
            k !== 'localId' &&
            k !== 'diaMesId' &&
            k !== 'diaContaUtil' &&
            k !== 'diaPodeHoras' &&
            k !== 'diaHorasTotal' &&
            k !== 'diaValorTotal' &&
            k !== 'intHoras' &&
            k !== 'intPago' &&
            k !== 'mesDiasTrabalhados' &&
            k !== 'mesValorTotal'
          );
          
          // Resolve Foreign Keys on Pull
          if (table === 'intervalo') {
            const localDia = await db.getFirstAsync<any>('SELECT id FROM dia WHERE diaId = ?', [remote.intDiaId]);
            const localCli = await db.getFirstAsync<any>('SELECT id FROM cliente WHERE cliId = ?', [remote.intCliId]);
            if (localDia) remote.intDiaId = localDia.id;
            if (localCli) remote.intCliId = localCli.id;
          } else if (table === 'valor_hora') {
            const localCli = await db.getFirstAsync<any>('SELECT id FROM cliente WHERE cliId = ?', [remote.vhCliId]);
            if (localCli) remote.vhCliId = localCli.id;
            if (remote.vhMesInicio) remote.vhMesInicio = remote.vhMesInicio.substring(0, 7);
          }

          const values = columns.map(k => remote[k]);
          if (existing) {
            const setClause = columns.map(k => `${k} = ?`).join(', ');
            await db.runAsync(`UPDATE ${table} SET ${setClause}, sync_status = 'synced' WHERE id = ?`, sanitize([...values, existing.id]));
          } else {
            const colList = columns.join(', ');
            const placeholders = columns.map(() => '?').join(', ');
            await db.runAsync(`INSERT INTO ${table} (${colList}, sync_status, updated_at) VALUES (${placeholders}, 'synced', ?)`, sanitize([...values, Date.now()]));
          }
        }
      }

      const summary = `Sincronizado com sucesso! Recebidos ${pullCount} registros.`;
      await AsyncStorage.multiSet([
        [LAST_SYNC_KEY, serverTime],
        [LAST_SYNC_SUMMARY, summary]
      ]);
      return true;
    } catch (e: any) {
      console.error('[Sync] ERRO FATAL NA SINCRONIZAÇÃO:', e.response?.data || e.message);
      console.error('Stack trace completo:', e);
      const errorMsg = e.response?.data?.error || e.message || 'Erro na sincronização';
      setError(errorMsg);
      await AsyncStorage.setItem(LAST_SYNC_SUMMARY, `ERRO: ${errorMsg}`);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [isLeitor]);

  return { performSync, syncing, error };
}
