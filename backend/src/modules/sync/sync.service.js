import { pool } from '../../config/database.js';
import { keysToSnake, keysToCamel } from '../../utils/mapper.js';

const getPkName = (table) => {
  const map = {
    cliente: 'cli_id',
    dia: 'dia_id',
    intervalo: 'int_id',
    mes: 'mes_id',
    feriado: 'fer_id',
    valor_hora_base: 'vh_id'
  };
  return map[table] || `${table.substring(0, 3)}_id`;
};

export const syncService = {
  /**
   * Processes a batch of mutations from a device.
   * @param {number} userId 
   * @param {string} deviceId 
   * @param {Array} mutations 
   */
  async push(userId, deviceId, mutations) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];

      for (const mutation of mutations) {
        const { table, operation, localId, payload } = mutation;
        
        // Allowed tables for sync
        if (!['cliente', 'dia', 'intervalo', 'mes', 'feriado', 'valor_hora_base'].includes(table)) {
          console.warn(`Attempt to sync illegal table: ${table}`);
          continue;
        }

        if (operation === 'CREATE' || operation === 'UPDATE') {
          // Ensure payload is mapped to snake_case for the database
          const snakePayload = keysToSnake(payload);

          // Fix for dia_mes_id null issue
          if (table === 'dia' && !snakePayload.dia_mes_id && snakePayload.dia_data) {
             const [anoStr, mesStr] = snakePayload.dia_data.split('-');
             const mesAnoMes = `${anoStr}-${mesStr}`;
             
             let mesResult = await client.query(
               `SELECT mes_id FROM mes WHERE usu_id = $1 AND mes_ano_mes = $2`,
               [userId, mesAnoMes]
             );
             if (mesResult.rows.length > 0) {
               snakePayload.dia_mes_id = mesResult.rows[0].mes_id;
             } else {
               const insertMes = await client.query(
                 `INSERT INTO mes (usu_id, mes_ano_mes, updated_at) VALUES ($1, $2, NOW()) RETURNING mes_id`,
                 [userId, mesAnoMes]
               );
               snakePayload.dia_mes_id = insertMes.rows[0].mes_id;
             }
          }

          const columns = Object.keys(snakePayload);
          const values = Object.values(snakePayload);
          
          // Add technical metadata
          columns.push('usu_id', 'device_id', 'local_id', 'updated_at');
          values.push(userId, deviceId, localId, new Date());

          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          // With the unique constraint (usu_id, device_id, local_id) in place, 
          // we can safely use ON CONFLICT to avoid duplicate rows for retries.
          const res = await client.query(
            `INSERT INTO ${table} (${columns.join(', ')}) 
             VALUES (${placeholders}) 
             ON CONFLICT DO NOTHING 
             RETURNING *`, 
            values
          );

          // If no row inserted (conflict), update exactly that row
          let finalRow = res.rows[0];
          if (!finalRow) {
            const updateCols = columns.filter(c => !['local_id', 'device_id', 'usu_id', 'updated_at'].includes(c));
            const updateVals = columns
              .map((c, i) => ({ c, v: values[i] }))
              .filter(item => !['local_id', 'device_id', 'usu_id', 'updated_at'].includes(item.c))
              .map(item => item.v);
            
            const setClause = updateCols.map((c, i) => `${c} = $${i + 1}`).join(', ');
            
            const updateRes = await client.query(
              `UPDATE ${table} SET ${setClause}, updated_at = NOW() 
               WHERE usu_id = $${updateCols.length + 1} AND device_id = $${updateCols.length + 2} AND local_id = $${updateCols.length + 3}
               RETURNING *`,
              [...updateVals, userId, deviceId, localId]
            );
            finalRow = updateRes.rows[0];
          }

          // Fallback: If still no row, it means a conflict happened on a BUSINESS unique key (like dia_data)
          // instead of the technical key (device_id + local_id).
          // We try to find that record and "claim" it for this device if it belongs to the same user.
          if (!finalRow) {
            let businessKey = null;
            if (table === 'dia') businessKey = 'dia_data';
            if (table === 'feriado') businessKey = 'fer_data';
            if (table === 'mes') businessKey = 'mes_ano_mes';
            if (table === 'valor_hora_base') businessKey = 'vh_data_inicio'; // Assuming this exists based on pattern

            if (businessKey && snakePayload[businessKey]) {
              const businessRes = await client.query(
                `SELECT * FROM ${table} WHERE usu_id = $1 AND ${businessKey} = $2`,
                [userId, snakePayload[businessKey]]
              );
              
              if (businessRes.rows.length > 0) {
                const existingRow = businessRes.rows[0];
                // Update technical IDs to match this device for future syncs
                const updateRes = await client.query(
                  `UPDATE ${table} SET device_id = $1, local_id = $2, updated_at = NOW() 
                   WHERE ${getPkName(table)} = $3 RETURNING *`,
                  [deviceId, localId, existingRow[getPkName(table)]]
                );
                finalRow = updateRes.rows[0];
              }
            }
          }

          if (finalRow) {
            results.push({ localId, serverId: finalRow[getPkName(table)], status: 'success' });
          } else {
            // Still no row? This is a genuine error or conflict with another user's data
            results.push({ localId, status: 'error', message: 'Record exists and could not be claimed' });
          }
        } else if (operation === 'DELETE') {
          await client.query(
            `UPDATE ${table} SET deleted_at = NOW(), updated_at = NOW() 
             WHERE usu_id = $1 AND ((device_id = $2 AND local_id = $3) OR (${getPkName(table)} = $4))`,
            [userId, deviceId, localId, mutation.serverId]
          );
          results.push({ localId, status: 'deleted' });
        }
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Fetches changes from the server for the user.
   */
  async pull(userId, deviceId, isLeitor = false, force = false) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let syncControl = await client.query(
        `SELECT dis_ultima_sincronizacao, dis_max_ids FROM dispositivo_sincronizacao 
         WHERE usu_id = $1 AND dis_device_id = $2 FOR UPDATE`,
        [userId, deviceId]
      );
      
      let lastSyncAt = new Date(0);
      let maxIds = {};
      
      if (syncControl.rows.length === 0) {
        await client.query(
          `INSERT INTO dispositivo_sincronizacao (usu_id, dis_device_id, dis_ultima_sincronizacao, dis_max_ids)
           VALUES ($1, $2, $3, $4)`,
          [userId, deviceId, lastSyncAt, JSON.stringify(maxIds)]
        );
      } else {
        lastSyncAt = syncControl.rows[0].dis_ultima_sincronizacao;
        maxIds = syncControl.rows[0].dis_max_ids || {};
      }

      if (force) {
        lastSyncAt = new Date(0);
        maxIds = {};
      }
      
      const tables = ['cliente', 'dia', 'intervalo', 'mes', 'feriado', 'valor_hora_base'];
      const changes = {};
      const newMaxIds = { ...maxIds };
      const currentSyncTime = new Date();
      
      for (const table of tables) {
        const pk = getPkName(table);
        const lastMaxId = maxIds[table] || 0;
        
        const params = isLeitor ? [lastMaxId, lastSyncAt] : [userId, lastMaxId, lastSyncAt];
        const query = isLeitor ? `
          SELECT * FROM ${table} 
          WHERE (
            ${pk} > $1 OR 
            updated_at > $2
          )
          ORDER BY ${pk} ASC
        ` : `
          SELECT * FROM ${table} 
          WHERE usu_id = $1 AND (
            ${pk} > $2 OR 
            updated_at > $3
          )
          ORDER BY ${pk} ASC
        `;
        const res = await client.query(query, params);
        // Convert to camelCase before sending back to mobile
        changes[table] = keysToCamel(res.rows);
        
        if (res.rows.length > 0) {
          const tableMaxId = Math.max(...res.rows.map(r => r[pk]));
          if (tableMaxId > lastMaxId) {
            newMaxIds[table] = tableMaxId;
          }
        }
      }
      
      await client.query(
        `UPDATE dispositivo_sincronizacao 
         SET dis_ultima_sincronizacao = $1, dis_max_ids = $2 
         WHERE usu_id = $3 AND dis_device_id = $4`,
        [currentSyncTime, JSON.stringify(newMaxIds), userId, deviceId]
      );
      
      await client.query('COMMIT');
      
      return {
        changes,
        serverTime: currentSyncTime
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};
