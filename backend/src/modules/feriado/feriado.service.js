import { query, getClient } from '../../config/database.js';
import * as mesService from '../mes/mes.service.js';

export const listAll = async () => {
  const result = await query('SELECT * FROM feriado ORDER BY fer_data');
  return result.rows;
};

export const create = async (fer_data, fer_nome, fer_tipo, fer_fixo = false) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO feriado (fer_data, fer_nome, fer_tipo, fer_fixo) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (fer_data) DO UPDATE SET fer_nome = EXCLUDED.fer_nome, fer_tipo = EXCLUDED.fer_tipo, fer_fixo = EXCLUDED.fer_fixo
       RETURNING *`,
      [fer_data, fer_nome, fer_tipo, fer_fixo]
    );
    
    // Retroactive update: check if DIA exists
    const monthDay = fer_data.substring(5, 10);
    const diaQuery = fer_fixo 
        ? 'SELECT * FROM dia WHERE to_char(dia_data, \'MM-DD\') = $1' 
        : 'SELECT * FROM dia WHERE dia_data = $1';
    const diaParams = fer_fixo ? [monthDay] : [fer_data];

    const diaResult = await client.query(diaQuery, diaParams);
    if (diaResult.rows.length > 0) {
      const affectedMonths = new Set();
      
      for (const dia of diaResult.rows) {
        // Update dia_tipo and flags
        await client.query(
          "UPDATE dia SET dia_tipo = 'FERIADO', dia_conta_util = FALSE, dia_pode_horas = TRUE WHERE dia_id = $1",
          [dia.dia_id]
        );
        
        const d = new Date(dia.dia_data);
        const anoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        affectedMonths.add(anoMes);
      }
      
      // Request month recalculation
      for (const anoMes of affectedMonths) {
        await mesService.recalculateMonthInternal(client, anoMes);
      }
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

export const remove = async (id) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Get feriado details before deleting
    const ferResult = await client.query('SELECT * FROM feriado WHERE fer_id = $1', [id]);
    if (ferResult.rows.length === 0) throw new Error('Feriado not found');
    const feriado = ferResult.rows[0];
    
    await client.query('DELETE FROM feriado WHERE fer_id = $1', [id]);
    
    // Retroactive update: check if DIA exists
    const ferDateObj = new Date(feriado.fer_data);
    const ferDateStr = `${ferDateObj.getFullYear()}-${String(ferDateObj.getMonth() + 1).padStart(2, '0')}-${String(ferDateObj.getDate()).padStart(2, '0')}`;
    const monthDay = ferDateStr.substring(5, 10);
    
    const diaQuery = feriado.fer_fixo 
        ? 'SELECT * FROM dia WHERE to_char(dia_data, \'MM-DD\') = $1' 
        : 'SELECT * FROM dia WHERE dia_data = $1';
    const diaParams = feriado.fer_fixo ? [monthDay] : [ferDateStr];
    
    const diaResult = await client.query(diaQuery, diaParams);
    if (diaResult.rows.length > 0) {
      const affectedMonths = new Set();
      
      for (const dia of diaResult.rows) {
        // Re-classify day
        const date = new Date(dia.dia_data);
        const dayOfWeek = date.getUTCDay();
        let tipo = 'UTIL';
        let contaUtil = true;
        
        if (dayOfWeek === 0) {
          tipo = 'DOMINGO';
          contaUtil = false;
        } else if (dayOfWeek === 6) {
          tipo = 'SABADO';
          contaUtil = false;
        }
        
        await client.query(
          "UPDATE dia SET dia_tipo = $1, dia_conta_util = $2 WHERE dia_id = $3",
          [tipo, contaUtil, dia.dia_id]
        );
        
        const anoMes = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        affectedMonths.add(anoMes);
      }
      
      for (const anoMes of affectedMonths) {
        await mesService.recalculateMonthInternal(client, anoMes);
      }
    }
    
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
