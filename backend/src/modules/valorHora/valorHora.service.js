import { query, getClient } from '../../config/database.js';

export const listByCliente = async (cli_id) => {
  const result = await query(
    'SELECT * FROM valor_hora_base WHERE vh_cli_id = $1 ORDER BY vh_mes_inicio DESC',
    [cli_id]
  );
  return result.rows;
};

export const create = async (vh_cli_id, vh_valor, vh_mes_inicio) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Deactivate current active value for this client
    await client.query(
      'UPDATE valor_hora_base SET vh_ativo = FALSE WHERE vh_cli_id = $1 AND vh_ativo = TRUE',
      [vh_cli_id]
    );
    
    // Insert new active value
    const result = await client.query(
      'INSERT INTO valor_hora_base (vh_cli_id, vh_valor, vh_mes_inicio, vh_ativo) VALUES ($1, $2, $3, TRUE) RETURNING *',
      [vh_cli_id, vh_valor, vh_mes_inicio]
    );

    // Retroactive update: Update intervals for this client that were registered on or after vh_mes_inicio
    // that have 0 or current value if we want to be aggressive. 
    // Here we update everything from that date forward for this client.
    await client.query(
      `UPDATE intervalo 
       SET int_valor_hora = $1, 
           int_valor_total = int_horas * $1
       WHERE int_cli_id = $2 AND int_id IN (
         SELECT i.int_id FROM intervalo i
         JOIN dia d ON i.int_dia_id = d.dia_id
         WHERE d.dia_data >= $3
       )`,
      [vh_valor, vh_cli_id, vh_mes_inicio]
    );

    // Recalculate all affected days
    const affectedDays = await client.query(
        `SELECT DISTINCT d.dia_id, d.dia_data FROM dia d
         JOIN intervalo i ON d.dia_id = i.int_dia_id
         WHERE i.int_cli_id = $1 AND d.dia_data >= $2`,
        [vh_cli_id, vh_mes_inicio]
    );

    for (const day of affectedDays.rows) {
        // Recalculate day
        await client.query(
            `UPDATE dia 
             SET dia_valor_total = (SELECT COALESCE(SUM(int_valor_total), 0) FROM intervalo WHERE int_dia_id = $1)
             WHERE dia_id = $1`,
            [day.dia_id]
        );
        
        // Recalculate month
        const anoMes = new Date(day.dia_data).toISOString().substring(0, 7);
        await mesService.recalculateMonthInternal(client, anoMes);
    }
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
