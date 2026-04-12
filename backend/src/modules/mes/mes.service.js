import { query, getClient } from '../../config/database.js';

export const getOrCreateMonth = async (anoMes) => {
  const result = await query('SELECT * FROM mes WHERE mes_ano_mes = $1', [anoMes]);
  if (result.rows.length > 0) return result.rows[0];

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Create Mes
    const mesResult = await client.query(
      'INSERT INTO mes (mes_ano_mes) VALUES ($1) RETURNING *',
      [anoMes]
    );
    const mes = mesResult.rows[0];

    // Generate Days
    const [year, month] = anoMes.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    for (let d = 1; d <= lastDay; d++) {
      const dayStr = `${anoMes}-${String(d).padStart(2, '0')}`;
      const date = new Date(dayStr);
      const dayOfWeek = date.getUTCDay(); // 0=Sun, 6=Sat

      // Check if Feriado
      const dateParts = dayStr.split('-');
      const monthDayStr = `${dateParts[1]}-${dateParts[2]}`;
      
      const ferResult = await client.query(
        `SELECT * FROM feriado WHERE fer_data = $1 OR (fer_fixo = TRUE AND to_char(fer_data, 'MM-DD') = $2)`,
        [dayStr, monthDayStr]
      );
      const isFeriado = ferResult.rows.length > 0;

      let tipo = 'UTIL';
      let contaUtil = true;

      if (isFeriado) {
        tipo = 'FERIADO';
        contaUtil = false;
      } else if (dayOfWeek === 0) {
        tipo = 'DOMINGO';
        contaUtil = false;
      } else if (dayOfWeek === 6) {
        tipo = 'SABADO';
        contaUtil = false;
      }

      await client.query(
        'INSERT INTO dia (dia_data, dia_mes_id, dia_tipo, dia_conta_util) VALUES ($1, $2, $3, $4)',
        [dayStr, mes.mes_id, tipo, contaUtil]
      );
    }

    // Initial recalculation
    const updatedMes = await recalculateMonthInternal(client, anoMes);

    await client.query('COMMIT');
    return updatedMes;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const recalculateMonthInternal = async (client, anoMes) => {
  // Update totals for the month
  const result = await client.query(
    `UPDATE mes 
     SET 
       mes_dias_uteis = (SELECT COUNT(*) FROM dia WHERE dia_mes_id = mes.mes_id AND dia_conta_util = TRUE),
       mes_dias_trabalhados = (SELECT COUNT(*) FROM dia WHERE dia_mes_id = mes.mes_id AND dia_horas_total > 0),
       mes_realizado = (SELECT COALESCE(SUM(dia_horas_total), 0) FROM dia WHERE dia_mes_id = mes.mes_id),
       mes_valor_total = (SELECT COALESCE(SUM(dia_valor_total), 0) FROM dia WHERE dia_mes_id = mes.mes_id)
     WHERE mes_ano_mes = $1
     RETURNING *`,
    [anoMes]
  );
  
  // Update estimativa if mes_horas_dia is set (default 8)
  const mes = result.rows[0];
  if (mes) {
      await client.query(
          'UPDATE mes SET mes_estimativa = mes_dias_uteis * mes_horas_dia WHERE mes_id = $1',
          [mes.mes_id]
      );
  }
  
  return result.rows[0];
};

export const listAll = async () => {
    const result = await query('SELECT * FROM mes ORDER BY mes_ano_mes DESC');
    return result.rows;
};
