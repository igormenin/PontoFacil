import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/db';
import { pushSync, pullSync } from '../api/syncApi';
import { useAuthStore } from '../store/useAuthStore';

const LAST_SYNC_KEY = '@PontoFacil:lastSyncAt';

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const isLeitor = user?.leitor === true;

  const performSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    const db = await getDatabase();

    try {
      // 1. PUSH PHASE - Skip if reader
      if (!isLeitor) {
        try {
          // Fetch all unique table names in queue
          const tablesInQueue = await db.getAllAsync<{ table_name: string }>('SELECT DISTINCT table_name FROM sync_queue');
          
          for (const { table_name } of tablesInQueue) {
            const pendingMutations = await db.getAllAsync<any>(
              'SELECT * FROM sync_queue WHERE table_name = ? ORDER BY created_at ASC',
              [table_name]
            );

            if (pendingMutations.length > 0) {
              const mutations = pendingMutations.map(m => {
                let singularTable = m.table_name;
                if (singularTable === 'clientes') singularTable = 'cliente';
                else if (singularTable === 'dias') singularTable = 'dia';
                else if (singularTable === 'intervalos') singularTable = 'intervalo';
                else if (singularTable === 'meses') singularTable = 'mes';
                else if (singularTable === 'feriados') singularTable = 'feriado';
                
                return {
                  table: singularTable,
                  operation: m.operation,
                  localId: m.local_id,
                  serverId: m.server_id,
                  payload: JSON.parse(m.payload || '{}')
                };
              });

              const { results } = await pushSync(mutations);

              for (const res of results) {
                if (res.status === 'success' && res.serverId) {
                  const localTable = table_name === 'cliente' ? 'clientes' : 
                                    table_name === 'dia' ? 'dias' : 
                                    table_name === 'intervalo' ? 'intervalos' : table_name;
                  
                  await db.runAsync(
                    `UPDATE ${localTable} SET server_id = ?, sync_status = 'synced' WHERE id = ?`,
                    [res.serverId, res.localId]
                  );
                }
                const matchId = pendingMutations.find(m => m.local_id === res.localId)?.id;
                if (matchId) {
                  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [matchId]);
                }
              }
            }
          }
        } catch (pushErr) {
          console.warn('[Sync] Push failed, but proceeding to pull:', pushErr);
        }
      }

      // 2. PULL PHASE
      console.log(`[Sync] Pulling started.`);
      
      const { changes, serverTime } = await pullSync();
      console.log(`[Sync] Data received. ServerTime: ${serverTime}. Entities: ${Object.keys(changes || {}).join(', ')}`);

      // Reconcile each table
      const tableMap: Record<string, string> = {
        'cliente': 'clientes',
        'dia': 'dias',
        'intervalo': 'intervalos',
        'mes': 'meses',
        'feriado': 'feriados'
      };

      const sanitize = (arr: any[]) => arr.map(v => v === undefined ? null : v);

      for (const [remoteTable, records] of Object.entries(changes)) {
        const localTable = tableMap[remoteTable];
        if (!localTable) {
          console.log(`[Sync] Skipping unknown table: ${remoteTable}`);
          continue;
        }

        const items = records as any[];
        console.log(`[Sync] Processing ${items.length} records for ${remoteTable}`);
        for (const remote of items) {
          const serverId = remote[`${remoteTable.substring(0, 3)}_id`] ?? null;
          
          if (remote.deleted_at) {
            try {
              await db.runAsync(`DELETE FROM ${localTable} WHERE server_id = ?`, [serverId]);
            } catch (e: any) { throw new Error(`DELETE ${localTable} failed: ${e.message}`); }
            continue;
          }

          let existing;
          try {
            existing = await db.getFirstAsync<any>(
              `SELECT id FROM ${localTable} WHERE server_id = ?`,
              [serverId]
            );
          } catch (e: any) { throw new Error(`SELECT ${localTable} failed: ${e.message}`); }

          try {
            if (remoteTable === 'cliente') {
              const data = sanitize([remote.cli_nome ?? '', remote.cli_cnpj ?? null, remote.cli_ativo ? 1 : 0, 'synced', serverId]);
              if (existing) {
                await db.runAsync(`UPDATE clientes SET nome = ?, cnpj = ?, ativo = ?, sync_status = ? WHERE server_id = ?`, data);
              } else {
                await db.runAsync(`INSERT INTO clientes (nome, cnpj, ativo, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [...data, Date.now()]);
              }
            } else if (remoteTable === 'dia') {
               const data = sanitize([remote.dia_data ? remote.dia_data.split('T')[0] : null, remote.dia_tipo ?? 'UTIL', remote.dia_horas_meta ?? 8, remote.dia_observacao ?? null, 'synced', serverId]);
               
               let existingDia = existing;
               if (!existingDia) {
                 existingDia = await db.getFirstAsync<any>('SELECT id FROM dias WHERE data = ?', [data[0]]);
               }

               if (existingDia) {
                 await db.runAsync(`UPDATE dias SET data = ?, tipo = ?, horas_meta = ?, observacao = ?, sync_status = ?, server_id = ? WHERE id = ?`, sanitize([...data, existingDia.id]));
               } else {
                 await db.runAsync(`INSERT INTO dias (data, tipo, horas_meta, observacao, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, sanitize([...data, Date.now()]));
               }
            } else if (remoteTable === 'intervalo') {
              const localDia = await db.getFirstAsync<any>('SELECT id FROM dias WHERE server_id = ?', [remote.int_dia_id ?? null]);
              const localCli = await db.getFirstAsync<any>('SELECT id FROM clientes WHERE server_id = ?', [remote.int_cli_id ?? null]);

              if (localDia && localCli) {
                const data = sanitize([localDia.id, localCli.id, remote.int_ordem ?? 1, remote.int_inicio ?? null, remote.int_fim ?? null, remote.int_anotacoes ?? null, remote.int_valor_hora ?? null, remote.int_valor_total ?? null, 'synced', serverId]);
                if (existing) {
                  await db.runAsync(`UPDATE intervalos SET dia_id = ?, cliente_id = ?, ordem = ?, inicio = ?, fim = ?, anotacoes = ?, valor_hora = ?, valor_total = ?, sync_status = ? WHERE server_id = ?`, data);
                } else {
                  await db.runAsync(`INSERT INTO intervalos (dia_id, cliente_id, ordem, inicio, fim, anotacoes, valor_hora, valor_total, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, sanitize([...data, Date.now()]));
                }
              }
            } else if (remoteTable === 'mes') {
              const data = sanitize([remote.mes_ano_mes ?? null, remote.mes_valor_hora ?? null, remote.mes_horas_meta ?? 0, remote.mes_horas_dia ?? 8, remote.mes_dias_uteis ?? 0, remote.mes_estimativa ?? 0, remote.mes_realizado ?? 0, 'synced', serverId]);
              if (existing) {
                await db.runAsync(`UPDATE meses SET ano_mes = ?, valor_hora = ?, horas_meta = ?, horas_dia = ?, dias_uteis = ?, estimativa = ?, realizado = ?, sync_status = ? WHERE server_id = ?`, data);
              } else {
                await db.runAsync(`INSERT INTO meses (ano_mes, valor_hora, horas_meta, horas_dia, dias_uteis, estimativa, realizado, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, sanitize([...data, Date.now()]));
              }
            } else if (remoteTable === 'feriado') {
              const data = sanitize([remote.fer_data ? remote.fer_data.split('T')[0] : null, remote.fer_nome ?? '', remote.fer_tipo ?? null, 'synced', serverId]);
              if (existing) {
                await db.runAsync(`UPDATE feriados SET data = ?, nome = ?, tipo = ?, sync_status = ? WHERE server_id = ?`, data);
              } else {
                await db.runAsync(`INSERT INTO feriados (data, nome, tipo, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, sanitize([...data, Date.now()]));
              }
            }
          } catch (e: any) {
            throw new Error(`Tabela ${remoteTable}: ${e.message}`);
          }
        }
      }

      await AsyncStorage.setItem(LAST_SYNC_KEY, serverTime);
      const summary = Object.entries(changes).map(([k, v]: [string, any]) => `${k}: ${v.length}`).join(', ');
      await AsyncStorage.setItem('@PontoFacil:lastSyncSummary', summary);
      console.log(`[Sync] Successful at ${serverTime}. Summary: ${summary}`);
      return true;
    } catch (e: any) {
      console.error('Sync failed:', e);
      if (e.response) {
        console.error('  Status:', e.response.status);
        console.error('  Data:', JSON.stringify(e.response.data));
      }
      setError(e.message || 'Erro desconhecido na sincronização');
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { performSync, syncing, error };
}
