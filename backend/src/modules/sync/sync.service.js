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
          const updateAssigns = columns
            .filter(c => !['local_id', 'device_id', 'usu_id'].includes(c))
            .map((c, i) => `${c} = excluded.${c}`)
            .join(', ');

          const query = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (device_id, local_id, usu_id) 
            -- Note: We need a unique constraint for this to work. 
            -- I'll use a manual check for now or assume UPSERT pattern if constraint exists.
            -- Actually, for simplicity and idempotency without complex constraints:
            DO UPDATE SET ${updateAssigns}
            RETURNING *;
          `;

          // Check if constraint exists, if not, use a different strategy
          // For this MVP, I'll use the UPSERT pattern.
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
               WHERE device_id = $${columns.length + 1} AND local_id = $${columns.length + 2}
               RETURNING *`,
              [...values.filter((_, i) => !['local_id', 'device_id', 'usu_id'].includes(columns[i])), deviceId, localId]
            );
            finalRow = updateRes.rows[0];
          }

          results.push({ localId, serverId: finalRow[`${table.substring(0, 3)}_id`], status: 'success' });
        } else if (operation === 'DELETE') {
          await client.query(
            `UPDATE ${table} SET deleted_at = NOW(), updated_at = NOW() 
             WHERE (device_id = $1 AND local_id = $2) OR (${table.substring(0, 3)}_id = $3)`,
            [deviceId, localId, mutation.serverId]
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
  async pull(userId, lastSyncAt) {
    const tables = ['cliente', 'dia', 'intervalo', 'mes', 'feriado'];
    const changes = {};

    for (const table of tables) {
      const query = `
        SELECT * FROM ${table} 
        WHERE updated_at > $1
      `;
      const res = await pool.query(query, [lastSyncAt || new Date(0)]);
      changes[table] = res.rows;
    }

    return {
      changes,
      serverTime: new Date()
    };
  }
};
