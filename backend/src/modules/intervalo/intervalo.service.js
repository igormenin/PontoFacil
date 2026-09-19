import { getClient } from '../../config/database.js';
import { calculateDuration } from '../../utils/calcHoras.js';
import * as mesService from '../mes/mes.service.js';
import { sendNotification } from '../../utils/notificationService.js';

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  return new Date(dateVal).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
};

const formatDecimalHours = (decimalHours) => {
  const num = parseFloat(decimalHours || 0);
  const hours = Math.floor(num);
  const minutes = Math.round((num - hours) * 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

export const create = async (intervaloData, userId) => {
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
      `INSERT INTO intervalo (int_dia_id, int_cli_id, int_ordem, int_inicio, int_fim, int_horas, int_valor_hora, int_valor_total, int_anotacoes, usu_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [dia_id, cli_id, ordem, inicio, fim, horas, valorHora, valorTotal, anotacoes, userId]
    );

    // 4. Recalculate Dia Totals
    await recalculateDiaInternal(client, dia_id);

    // 5. Recalculate Mes Totals
    const anoMes = new Date(diaData).toISOString().substring(0, 7);
    await mesService.recalculateMonthInternal(client, anoMes, userId);

    // Fetch updated monthly total
    const mesRes = await client.query('SELECT mes_realizado FROM mes WHERE mes_ano_mes = $1', [anoMes]);
    const totalMes = mesRes.rows[0]?.mes_realizado || 0;

    await client.query('COMMIT');

    // Trigger push notification (await + timeout:1000 garante que o container serverless não congele antes do envio)
    await sendNotification({
      toAll: true,
      title: 'Novo Lançamento ⏰',
      message: fim 
        ? `Registrado: ${formatDate(diaData)} das ${formatTime(inicio)} às ${formatTime(fim)} (${formatDecimalHours(horas)}).\nTotal do mês: ${formatDecimalHours(totalMes)}.`
        : `Registrado: Entrada em ${formatDate(diaData)} às ${formatTime(inicio)}.\nTotal do mês: ${formatDecimalHours(totalMes)}.`
    }).catch(err => console.error('[Notification Error]', err));

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const update = async (id, data, userId) => {
    const { cli_id, ordem, inicio, fim, anotacoes } = data;
    const client = await getClient();
    try {
        await client.query('BEGIN');
        
        // 1. Get existing interval to find dia_id and verify ownership
        const currentRes = await client.query('SELECT int_dia_id, int_cli_id FROM intervalo WHERE int_id = $1 AND usu_id = $2', [id, userId]);
        if (currentRes.rows.length === 0) throw new Error('Intervalo not found or access denied');
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
        const finalInicio = inicio || (await client.query('SELECT int_inicio FROM intervalo WHERE int_id = $1 AND usu_id = $2', [id, userId])).rows[0].int_inicio;
        const finalFim = fim !== undefined ? fim : (await client.query('SELECT int_fim FROM intervalo WHERE int_id = $1 AND usu_id = $2', [id, userId])).rows[0].int_fim;
        
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
        values.push(userId);
        const result = await client.query(
            `UPDATE intervalo SET ${fields.join(', ')} WHERE int_id = $${idx} AND usu_id = $${idx + 1} RETURNING *`,
            values
        );
        
        // 5. Recalculate Dia Totals
        await recalculateDiaInternal(client, int_dia_id);
        
        // 6. Recalculate Mes Totals
        const anoMes = new Date(diaData).toISOString().substring(0, 7);
        await mesService.recalculateMonthInternal(client, anoMes, userId);
        
        // Fetch updated monthly total
        const mesRes = await client.query('SELECT mes_realizado FROM mes WHERE mes_ano_mes = $1 AND usu_id = $2', [anoMes, userId]);
        const totalMes = mesRes.rows[0]?.mes_realizado || 0;

        await client.query('COMMIT');

        // Trigger push notification (await + timeout:1000 garante que o container serverless não congele antes do envio)
        await sendNotification({
          toAll: true,
          title: 'Lançamento Alterado 📝',
          message: finalFim 
            ? `Alterado: ${formatDate(diaData)} das ${formatTime(finalInicio)} às ${formatTime(finalFim)} (${formatDecimalHours(horas)}).\nTotal do mês: ${formatDecimalHours(totalMes)}.`
            : `Alterado: Entrada em ${formatDate(diaData)} às ${formatTime(finalInicio)}.\nTotal do mês: ${formatDecimalHours(totalMes)}.`
        }).catch(err => console.error('[Notification Error]', err));

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
       dia_valor_total = (
           SELECT COALESCE(SUM(horas_por_taxa * taxa), 0)
           FROM (
               SELECT int_valor_hora as taxa, SUM(int_horas) as horas_por_taxa 
               FROM intervalo 
               WHERE int_dia_id = dia.dia_id
               GROUP BY int_valor_hora
           ) t
       )
     WHERE dia_id = $1`,
    [dia_id]
  );
};

export const remove = async (id, userId) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        
        // Fetch interval details and corresponding day date before deletion (verify ownership)
        const intRes = await client.query(
            `SELECT i.int_dia_id, i.int_inicio, i.int_fim, i.int_horas, d.dia_data 
             FROM intervalo i 
             JOIN dia d ON d.dia_id = i.int_dia_id 
             WHERE i.int_id = $1 AND i.usu_id = $2`, 
            [id, userId]
        );
        if (intRes.rows.length === 0) throw new Error('Intervalo not found or access denied');
        const { int_dia_id, int_inicio, int_fim, int_horas, dia_data } = intRes.rows[0];
        
        await client.query('DELETE FROM intervalo WHERE int_id = $1 AND usu_id = $2', [id, userId]);
        
        await recalculateDiaInternal(client, int_dia_id);
        
        const anoMes = new Date(dia_data).toISOString().substring(0, 7);
        await mesService.recalculateMonthInternal(client, anoMes, userId);
        
        // Fetch updated monthly total
        const mesRes = await client.query('SELECT mes_realizado FROM mes WHERE mes_ano_mes = $1 AND usu_id = $2', [anoMes, userId]);
        const totalMes = mesRes.rows[0]?.mes_realizado || 0;
 
        await client.query('COMMIT');

        // Trigger push notification (await + timeout:1000 garante que o container serverless não congele antes do envio)
        await sendNotification({
          toAll: true,
          title: 'Lançamento Excluído 🗑️',
          message: int_fim 
            ? `Excluído: ${formatDate(dia_data)} das ${formatTime(int_inicio)} às ${formatTime(int_fim)} (${formatDecimalHours(int_horas)}).\nTotal do mês: ${formatDecimalHours(totalMes)}.`
            : `Excluído: Entrada em ${formatDate(dia_data)} às ${formatTime(int_inicio)}.\nTotal do mês: ${formatDecimalHours(totalMes)}.`
        }).catch(err => console.error('[Notification Error]', err));

        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
