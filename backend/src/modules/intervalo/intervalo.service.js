import { getClient } from '../../config/database.js';
import { calculateDuration } from '../../utils/calcHoras.js';
import * as mesService from '../mes/mes.service.js';

export const create = async (intervaloData) => {
  const { dia_id, cli_id, ordem, inicio, fim, anotacoes } = intervaloData;
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Get Day Info and Client's Valor Hora (Snapshot)
    const diaRes = await client.query('SELECT dia_data FROM dia WHERE dia_id = $1', [dia_id]);
    const diaData = diaRes.rows[0].dia_data;

    const vhRes = await client.query(
      `SELECT vh_valor FROM valor_hora_base 
       WHERE vh_cli_id = $1 AND vh_mes_inicio <= $2 
       ORDER BY vh_mes_inicio DESC LIMIT 1`,
      [cli_id, diaData]
    );
    const valorHora = vhRes.rows[0]?.vh_valor || 0;

    // 2. Calculate Hours and Totals
    const horas = fim ? calculateDuration(inicio, fim) : 0;
    const valorTotal = horas * valorHora;

    // 3. Insert Intervalo
    const result = await client.query(
      `INSERT INTO intervalo (int_dia_id, int_cli_id, int_ordem, int_inicio, int_fim, int_horas, int_valor_hora, int_valor_total, int_anotacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [dia_id, cli_id, ordem, inicio, fim, horas, valorHora, valorTotal, anotacoes]
    );

    // 4. Recalculate Dia Totals
    await recalculateDiaInternal(client, dia_id);

    // 5. Recalculate Mes Totals
    const anoMes = new Date(diaData).toISOString().substring(0, 7);
    await mesService.recalculateMonthInternal(client, anoMes);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const update = async (id, data) => {
    const { cli_id, ordem, inicio, fim, anotacoes } = data;
    const client = await getClient();
    try {
        await client.query('BEGIN');
        
        // 1. Get existing interval to find dia_id
        const currentRes = await client.query('SELECT int_dia_id, int_cli_id FROM intervalo WHERE int_id = $1', [id]);
        if (currentRes.rows.length === 0) throw new Error('Intervalo not found');
        const { int_dia_id, int_cli_id: oldCliId } = currentRes.rows[0];
        
        // 2. Get Day Data and Valor Hora if client or date changed (date can't change via interval update, but client can)
        const diaRes = await client.query('SELECT dia_data FROM dia WHERE dia_id = $1', [int_dia_id]);
        const diaData = diaRes.rows[0].dia_data;
        
        const targetCliId = cli_id || oldCliId;
        const vhRes = await client.query(
            `SELECT vh_valor FROM valor_hora_base 
             WHERE vh_cli_id = $1 AND vh_mes_inicio <= $2 
             ORDER BY vh_mes_inicio DESC LIMIT 1`,
            [targetCliId, diaData]
        );
        const valorHora = vhRes.rows[0]?.vh_valor || 0;
        
        // 3. Recalculate duration and total
        const finalInicio = inicio || (await client.query('SELECT int_inicio FROM intervalo WHERE int_id = $1', [id])).rows[0].int_inicio;
        const finalFim = fim !== undefined ? fim : (await client.query('SELECT int_fim FROM intervalo WHERE int_id = $1', [id])).rows[0].int_fim;
        
        const horas = finalFim ? calculateDuration(finalInicio, finalFim) : 0;
        const valorTotal = horas * valorHora;
        
        // 4. Update
        const fields = [];
        const values = [];
        let idx = 1;
        
        if (cli_id) { fields.push(`int_cli_id = $${idx++}`); values.push(cli_id); }
        if (ordem) { fields.push(`int_ordem = $${idx++}`); values.push(ordem); }
        if (inicio) { fields.push(`int_inicio = $${idx++}`); values.push(inicio); }
        if (fim !== undefined) { fields.push(`int_fim = $${idx++}`); values.push(fim); }
        if (anotacoes !== undefined) { fields.push(`int_anotacoes = $${idx++}`); values.push(anotacoes); }
        
        fields.push(`int_horas = $${idx++}`); values.push(horas);
        fields.push(`int_valor_hora = $${idx++}`); values.push(valorHora);
        fields.push(`int_valor_total = $${idx++}`); values.push(valorTotal);
        
        values.push(id);
        const result = await client.query(
            `UPDATE intervalo SET ${fields.join(', ')} WHERE int_id = $${idx} RETURNING *`,
            values
        );
        
        // 5. Recalculate Dia Totals
        await recalculateDiaInternal(client, int_dia_id);
        
        // 6. Recalculate Mes Totals
        const anoMes = new Date(diaData).toISOString().substring(0, 7);
        await mesService.recalculateMonthInternal(client, anoMes);
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const recalculateDiaInternal = async (client, dia_id) => {
  await client.query(
    `UPDATE dia 
     SET 
       dia_horas_total = (SELECT COALESCE(SUM(int_horas), 0) FROM intervalo WHERE int_dia_id = dia.dia_id),
       dia_valor_total = (SELECT COALESCE(SUM(int_valor_total), 0) FROM intervalo WHERE int_dia_id = dia.dia_id)
     WHERE dia_id = $1`,
    [dia_id]
  );
};

export const remove = async (id) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        
        const intRes = await client.query('SELECT int_dia_id FROM intervalo WHERE int_id = $1', [id]);
        if (intRes.rows.length === 0) throw new Error('Intervalo not found');
        const { int_dia_id } = intRes.rows[0];
        
        await client.query('DELETE FROM intervalo WHERE int_id = $1', [id]);
        
        await recalculateDiaInternal(client, int_dia_id);
        
        const diaRes = await client.query('SELECT dia_data FROM dia WHERE dia_id = $1', [int_dia_id]);
        const anoMes = new Date(diaRes.rows[0].dia_data).toISOString().substring(0, 7);
        await mesService.recalculateMonthInternal(client, anoMes);
        
        await client.query('COMMIT');
        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
