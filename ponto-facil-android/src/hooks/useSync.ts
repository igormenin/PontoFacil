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

  const performSync = useCallback(async (forceFullSync: boolean = false) => {
    setSyncing(true);
    setError(null);
    const db = await getDatabase();

    try {
      // 1. PUSH PHASE - Skip if reader
      if (!isLeitor) {
        try {
          const tableOrder = ['clientes', 'dias', 'intervalos', 'meses', 'feriados', 'valor_hora_historico'];
          
          for (const table_name of tableOrder) {
            const pendingMutations = await db.getAllAsync<any>(
              'SELECT * FROM sync_queue WHERE table_name = ? ORDER BY created_at ASC',
              [table_name]
            );

            if (pendingMutations.length > 0) {
              const mutations = [];
              
              for (const m of pendingMutations) {
                let singularTable = m.table_name;
                if (singularTable === 'clientes') singularTable = 'cliente';
                else if (singularTable === 'dias') singularTable = 'dia';
                else if (singularTable === 'intervalos') singularTable = 'intervalo';
                else if (singularTable === 'meses') singularTable = 'mes';
                else if (singularTable === 'feriados') singularTable = 'feriado';

                const rawPayload = JSON.parse(m.payload || '{}');
                let mappedPayload: any = {};

                // Map local fields to backend fields
                if (singularTable === 'cliente') {
                  mappedPayload = {
                    cli_nome: rawPayload.nome,
                    cli_ativo: rawPayload.ativo !== undefined ? !!rawPayload.ativo : true
                  };
                } else if (singularTable === 'dia') {
                  mappedPayload = {
                    dia_data: rawPayload.data,
                    dia_tipo: rawPayload.tipo,
                    dia_horas_meta: rawPayload.horas_meta,
                    dia_observacao: rawPayload.observacao
                  };
                } else if (singularTable === 'intervalo') {
                  // Resolve foreign keys
                  const dia = await db.getFirstAsync<any>('SELECT server_id FROM dias WHERE id = ?', [rawPayload.dia_id]);
                  const cli = await db.getFirstAsync<any>('SELECT server_id FROM clientes WHERE id = ?', [rawPayload.cliente_id]);
                  
                  if (!dia?.server_id) {
                    console.warn(`[Sync] Skipping interval push - parent day not synced yet: local_id ${rawPayload.dia_id}`);
                    continue; // Skip this mutation for now, it will be retried next sync
                  }

                  mappedPayload = {
                    int_dia_id: dia.server_id,
                    int_cli_id: cli?.server_id || null,
                    int_ordem: rawPayload.ordem,
                    int_inicio: rawPayload.inicio,
                    int_fim: rawPayload.fim,
                    int_anotacoes: rawPayload.anotacoes,
                    int_valor_hora: rawPayload.valor_hora,
                    int_valor_total: rawPayload.valor_total
                  };
                } else if (singularTable === 'mes') {
                  mappedPayload = {
                    mes_ano_mes: rawPayload.ano_mes,
                    mes_valor_hora: rawPayload.valor_hora,
                    mes_horas_meta: rawPayload.horas_meta,
                    mes_horas_dia: rawPayload.horas_dia,
                    mes_dias_uteis: rawPayload.dias_uteis,
                    mes_estimativa: rawPayload.estimativa,
                    mes_realizado: rawPayload.realizado
                  };
                } else if (singularTable === 'feriado') {
                  mappedPayload = {
                    fer_data: rawPayload.data,
                    fer_nome: rawPayload.nome,
                    fer_tipo: rawPayload.tipo
                  };
                } else if (table_name === 'valor_hora_historico') {
                  const cli = await db.getFirstAsync<any>('SELECT server_id FROM clientes WHERE id = ?', [rawPayload.cliente_id]);
                  mappedPayload = {
                    vhb_cli_id: cli?.server_id,
                    vhb_valor: rawPayload.valor,
                    vhb_data_inicio: rawPayload.mes_inicio + '-01'
                  };
                  singularTable = 'valor_hora_base';
                } else {
                  mappedPayload = rawPayload;
                }

                mutations.push({
                  table: singularTable,
                  operation: m.operation,
                  localId: m.local_id,
                  serverId: m.server_id,
                  payload: mappedPayload
                });
              }

              if (mutations.length === 0) continue;

              const { results } = await pushSync(mutations);

              for (const res of results) {
                if (res.status === 'success' && res.serverId) {
                  await db.runAsync(
                    `UPDATE ${table_name} SET server_id = ?, sync_status = 'synced' WHERE id = ?`,
                    [res.serverId, res.localId]
                  );
                }
                const matchQueueRecord = pendingMutations.find(m => m.local_id === res.localId);
                if (matchQueueRecord && (res.status === 'success' || res.message?.includes('Conflict'))) {
                   await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [matchQueueRecord.id]);
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
      
      const { changes, serverTime } = await pullSync(forceFullSync);
      console.log(`[Sync] Data received. ServerTime: ${serverTime}. Entities: ${Object.keys(changes || {}).join(', ')}`);

      // Reconcile each table
      const tableMap: Record<string, string> = {
        'cliente': 'clientes',
        'dia': 'dias',
        'intervalo': 'intervalos',
        'mes': 'meses',
        'feriado': 'feriados',
        'valor_hora_base': 'valor_hora_historico'
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
          let idPrefix = remoteTable.substring(0, 3);
          if (remoteTable === 'valor_hora_base') idPrefix = 'vhb';
          const serverId = remote[`${idPrefix}_id`] ?? null;
          
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
            } else if (remoteTable === 'valor_hora_base') {
              const localCli = await db.getFirstAsync<any>('SELECT id FROM clientes WHERE server_id = ?', [remote.vhb_cli_id ?? null]);
              if (localCli) {
                const data = sanitize([localCli.id, remote.vhb_valor ?? 0, remote.vhb_data_inicio?.substring(0, 7) ?? '', 1, 'synced', serverId]);
                if (existing) {
                  await db.runAsync(`UPDATE valor_hora_historico SET cliente_id = ?, valor = ?, mes_inicio = ?, ativo = ?, sync_status = ? WHERE server_id = ?`, data);
                } else {
                  await db.runAsync(`INSERT INTO valor_hora_historico (cliente_id, valor, mes_inicio, ativo, sync_status, server_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, sanitize([...data, Date.now()]));
                }
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
