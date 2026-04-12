import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/db';
import { pushSync, pullSync } from '../api/syncApi';

const LAST_SYNC_KEY = '@PontoFacil:lastSyncAt';

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    const db = await getDatabase();

    try {
      // 1. PUSH PHASE
      // Fetch all unique table names in queue
      const tablesInQueue = await db.getAllAsync<{ table_name: string }>('SELECT DISTINCT table_name FROM sync_queue');
      
      for (const { table_name } of tablesInQueue) {
        const pendingMutations = await db.getAllAsync<any>(
          'SELECT * FROM sync_queue WHERE table_name = ? ORDER BY created_at ASC',
          [table_name]
        );

        if (pendingMutations.length > 0) {
          const mutations = pendingMutations.map(m => ({
            table: m.table_name,
            operation: m.operation,
            localId: m.local_id,
            serverId: m.server_id,
            payload: JSON.parse(m.payload || '{}')
          }));

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
            await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [pendingMutations.find(m => m.local_id === res.localId)?.id]);
          }
        }
      }

      // 2. PULL PHASE
      const lastSyncAt = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const { changes, serverTime } = await pullSync(lastSyncAt);

      // Reconcile each table
      const tableMap: Record<string, string> = {
        'cliente': 'clientes',
        'dia': 'dias',
        'intervalo': 'intervalos'
      };

      for (const [remoteTable, records] of Object.entries(changes)) {
        const localTable = tableMap[remoteTable];
        if (!localTable) continue;

        const items = records as any[];
        for (const remote of items) {
          const serverId = remote[`${remoteTable.substring(0, 3)}_id`];
          
          if (remote.deleted_at) {
            await db.runAsync(`DELETE FROM ${localTable} WHERE server_id = ?`, [serverId]);
            continue;
          }

          const existing = await db.getFirstAsync<any>(
            `SELECT id FROM ${localTable} WHERE server_id = ?`,
            [serverId]
          );

          if (remoteTable === 'cliente') {
            const data = [remote.cli_nome, remote.cli_cnpj, remote.cli_ativo ? 1 : 0, 'synced', serverId];
            if (existing) {
              await db.runAsync(`UPDATE clientes SET nome = ?, cnpj = ?, ativo = ?, sync_status = ? WHERE server_id = ?`, data);
            } else {
              await db.runAsync(`INSERT INTO clientes (nome, cnpj, ativo, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [...data, Date.now()]);
            }
          } else if (remoteTable === 'dia') {
             const data = [remote.dia_data, remote.dia_tipo, remote.dia_horas_meta, remote.dia_observacao, 'synced', serverId];
             if (existing) {
               await db.runAsync(`UPDATE dias SET data = ?, tipo = ?, horas_meta = ?, observacao = ?, sync_status = ? WHERE server_id = ?`, data);
             } else {
               await db.runAsync(`INSERT INTO dias (data, tipo, horas_meta, observacao, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [...data, Date.now()]);
             }
          } else if (remoteTable === 'intervalo') {
            // Need to map remote.int_dia_id and remote.int_cli_id to LOCAL ids or use server_ids?
            // SQLite schema uses local IDs for relations. We need to find local IDs.
            const localDia = await db.getFirstAsync<any>('SELECT id FROM dias WHERE server_id = ?', [remote.int_dia_id]);
            const localCli = await db.getFirstAsync<any>('SELECT id FROM clientes WHERE server_id = ?', [remote.int_cli_id]);

            if (localDia && localCli) {
              const data = [localDia.id, localCli.id, remote.int_ordem, remote.int_inicio, remote.int_fim, remote.int_anotacoes, remote.int_valor_hora, remote.int_valor_total, 'synced', serverId];
              if (existing) {
                await db.runAsync(`UPDATE intervalos SET dia_id = ?, cliente_id = ?, ordem = ?, inicio = ?, fim = ?, anotacoes = ?, valor_hora = ?, valor_total = ?, sync_status = ? WHERE server_id = ?`, data);
              } else {
                await db.runAsync(`INSERT INTO intervalos (dia_id, cliente_id, ordem, inicio, fim, anotacoes, valor_hora, valor_total, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [...data, Date.now()]);
              }
            }
          }
        }
      }

      await AsyncStorage.setItem(LAST_SYNC_KEY, serverTime);
      return true;
    } catch (e: any) {
      console.error('Sync failed:', e);
      setError(e.message || 'Erro desconhecido na sincronização');
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { performSync, syncing, error };
}
