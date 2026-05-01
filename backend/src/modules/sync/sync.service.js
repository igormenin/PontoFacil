import { pool } from '../../config/database.js';

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
        if (!['cliente', 'dia', 'intervalo', 'mes', 'feriado'].includes(table)) {
          console.warn(`Attempt to sync illegal table: ${table}`);
          continue;
        }

        if (operation === 'CREATE' || operation === 'UPDATE') {
          const columns = Object.keys(payload);
          const values = Object.values(payload);
          
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
            const setClause = columns
              .filter(c => !['local_id', 'device_id', 'usu_id'].includes(c))
              .map((c, i) => `${c} = $${i + 1}`)
              .join(', ');
            
            const updateRes = await client.query(
              `UPDATE ${table} SET ${setClause}, updated_at = NOW() 
               WHERE usu_id = $${columns.length + 1} AND device_id = $${columns.length + 2} AND local_id = $${columns.length + 3}
               RETURNING *`,
              [...values.filter((_, i) => !['local_id', 'device_id', 'usu_id'].includes(columns[i])), userId, deviceId, localId]
            );
            finalRow = updateRes.rows[0];
          }

          if (finalRow) {
            results.push({ localId, serverId: finalRow[`${table.substring(0, 3)}_id`], status: 'success' });
          } else {
            // This happens if the unique constraint hit was on a DIFFERENT constraint (e.g. dia_data)
            // It means this device tried to insert a day that already exists from another device/user.
            // For now, mark as error so the client knows it failed.
            results.push({ localId, status: 'error', message: 'Conflict with existing unique record' });
          }
        } else if (operation === 'DELETE') {
          await client.query(
            `UPDATE ${table} SET deleted_at = NOW(), updated_at = NOW() 
             WHERE usu_id = $1 AND ((device_id = $2 AND local_id = $3) OR (${table.substring(0, 3)}_id = $4))`,
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
      
      const tables = ['cliente', 'dia', 'intervalo', 'mes', 'feriado'];
      const changes = {};
      const newMaxIds = { ...maxIds };
      const currentSyncTime = new Date();
      
      for (const table of tables) {
        const pk = `${table.substring(0, 3)}_id`;
        const lastMaxId = maxIds[table] || 0;
        
        const query = isLeitor ? `
          SELECT * FROM ${table} 
          WHERE (
            ${pk} > $2 OR 
            updated_at > $3
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
        const res = await client.query(query, [userId, lastMaxId, lastSyncAt]);
        changes[table] = res.rows;
        
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
