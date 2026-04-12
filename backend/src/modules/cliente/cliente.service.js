import { query } from '../../config/database.js';

export const listAll = async () => {
  const result = await query('SELECT * FROM cliente ORDER BY cli_nome');
  return result.rows;
};

export const findById = async (id) => {
  const result = await query('SELECT * FROM cliente WHERE cli_id = $1', [id]);
  return result.rows[0];
};

export const create = async (cli_nome, cli_ativo = true) => {
  const result = await query(
    'INSERT INTO cliente (cli_nome, cli_ativo) VALUES ($1, $2) RETURNING *',
    [cli_nome, cli_ativo]
  );
  return result.rows[0];
};

export const update = async (id, { cli_nome, cli_ativo }) => {
  const fields = [];
  const values = [];
  let index = 1;
  
  if (cli_nome !== undefined) {
    fields.push(`cli_nome = $${index++}`);
    values.push(cli_nome);
  }
  
  if (cli_ativo !== undefined) {
    fields.push(`cli_ativo = $${index++}`);
    values.push(cli_ativo);
  }
  
  if (fields.length === 0) return await findById(id);
  
  values.push(id);
  const result = await query(
    `UPDATE cliente SET ${fields.join(', ')} WHERE cli_id = $${index} RETURNING *`,
    values
  );
  
  return result.rows[0];
};

export const remove = async (id) => {
  await query('DELETE FROM cliente WHERE cli_id = $1', [id]);
  return true;
};
