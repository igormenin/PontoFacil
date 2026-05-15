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
  'valores_hora_base': 'valor_hora'
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
                
                // Final adjustment for push (resolve foreign keys)
                if (table === 'intervalo') {
                  const dia = await db.getFirstAsync<any>('SELECT diaId FROM dia WHERE id = ?', [payload.intDiaId]);
                  const cli = await db.getFirstAsync<any>('SELECT cliId FROM cliente WHERE id = ?', [payload.intCliId]);
                  if (!dia?.diaId) continue; // Wait for parent to sync
                  payload.intDiaId = dia.diaId;
                  payload.intCliId = cli?.cliId || null;
                } else if (table === 'valor_hora') {
                  const cli = await db.getFirstAsync<any>('SELECT cliId FROM cliente WHERE id = ?', [payload.vhCliId]);
                  if (!cli?.cliId) continue;
                  payload.vhCliId = cli.cliId;
                  if (payload.vhMesInicio && payload.vhMesInicio.length === 7) {
                    payload.vhMesInicio += '-01';
                  }
                }

                mutations.push({
                  table: table === 'valor_hora' ? 'valor-hora' : table, // Match backend singular endpoint
                  operation: m.operation,
                  localId: m.local_id,
                  serverId: m.server_id,
                  payload
                });
              }

              if (mutations.length > 0) {
                const { results } = await pushSync(mutations);
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
        } catch (pushErr) {
          console.warn('[Sync] Push failed, proceeding to pull:', pushErr);
        }
      }

      // 2. PULL PHASE
      const { changes, serverTime } = await pullSync(forceFullSync);
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

          const existing = await db.getFirstAsync<any>(`SELECT id FROM ${table} WHERE ${serverIdField} = ?`, [serverId]);
          
          // Generic column mapper
          const columns = Object.keys(remote).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt' && k !== 'deletedAt' && k !== 'intervalos');
          
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
          } else if (table === 'dia' && remote.diaData) {
            remote.diaData = remote.diaData.split('T')[0];
          } else if (table === 'feriado' && remote.ferData) {
            remote.ferData = remote.ferData.split('T')[0];
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
      console.error('Sync failed:', e);
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
