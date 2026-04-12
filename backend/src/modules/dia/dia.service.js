import { query } from '../../config/database.js';

export const listByMonth = async (anoMes) => {
  const result = await query(
    `SELECT d.*, 
     (SELECT json_agg(i.* ORDER BY i.int_ordem) FROM intervalo i WHERE i.int_dia_id = d.dia_id) as intervalos
     FROM dia d 
     JOIN mes m ON d.dia_mes_id = m.mes_id 
     WHERE m.mes_ano_mes = $1
     ORDER BY d.dia_data`,
    [anoMes]
  );
  return result.rows;
};

export const update = async (data, { dia_observacao }) => {
  const result = await query(
    'UPDATE dia SET dia_observacao = $1 WHERE dia_data = $2 RETURNING *',
    [dia_observacao, data]
  );
  return result.rows[0];
};

export const clearIntervalos = async (data) => {
    // Logic to delete all intervals for a specific date
    const result = await query('SELECT dia_id FROM dia WHERE dia_data = $1', [data]);
    if (result.rows.length === 0) return false;
    const dia_id = result.rows[0].dia_id;
    
    // This is a complex delete because it needs to trigger recalculation
    // For simplicity, we can use the service but we'd need to loop
    // Better to do it in a transaction here or in the controller
    return dia_id;
};
