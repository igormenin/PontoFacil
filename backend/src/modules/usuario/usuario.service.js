import bcrypt from 'bcryptjs';
import axios from 'axios';
import { query } from '../../config/database.js';
import { keysToCamel } from '../../utils/mapper.js';

const downloadAndStoreImage = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'];
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error downloading avatar:', error);
    return null;
  }
};

export const getAll = async () => {
  const result = await query('SELECT usu_id, usu_login, usu_nome, usu_email, usu_cargo, usu_status, usu_avatar FROM usuario ORDER BY usu_nome ASC');
  return keysToCamel(result.rows);
};

export const getById = async (id) => {
  const result = await query('SELECT * FROM usuario WHERE usu_id = $1', [id]);
  return keysToCamel(result.rows[0]);
};

export const create = async (data) => {
  let { usuLogin, usuSenha, usuNome, usuEmail, usuAvatar, usuCargo, usuStatus } = data;
  
  if (usuAvatar && usuAvatar.startsWith('http')) {
    const downloaded = await downloadAndStoreImage(usuAvatar);
    if (downloaded) usuAvatar = downloaded;
  }

  if (!usuSenha || usuSenha.trim() === '') {
    throw new Error('Senha é obrigatória para novos usuários');
  }

  const hashedSenha = await bcrypt.hash(usuSenha, 10);
  
  const result = await query(
    `INSERT INTO usuario (usu_login, usu_senha, usu_nome, usu_email, usu_avatar, usu_cargo, usu_status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING usu_id`,
    [usuLogin, hashedSenha, usuNome, usuEmail, usuAvatar, usuCargo, usuStatus ?? true]
  );
  
  return result.rows[0].usu_id;
};

export const update = async (id, data) => {
  let { usuNome, usuEmail, usuAvatar, usuCargo, usuStatus, usuLogin, usuSenha } = data;

  if (usuAvatar && usuAvatar.startsWith('http')) {
    const downloaded = await downloadAndStoreImage(usuAvatar);
    if (downloaded) usuAvatar = downloaded;
  }

  await query(
    `UPDATE usuario 
     SET usu_nome = $1, usu_email = $2, usu_avatar = $3, usu_cargo = $4, usu_status = $5, usu_login = $6, updated_at = NOW()
     WHERE usu_id = $7`,
    [usuNome, usuEmail, usuAvatar, usuCargo, usuStatus, usuLogin, id]
  );

  // Update password ONLY if it's provided (not empty)
  if (usuSenha && usuSenha.trim() !== '') {
    const hashedSenha = await bcrypt.hash(usuSenha, 10);
    await query('UPDATE usuario SET usu_senha = $1 WHERE usu_id = $2', [hashedSenha, id]);
  }
  
  return true;
};

export const remove = async (id) => {
  await query('DELETE FROM usuario WHERE usu_id = $1', [id]);
  return true;
};

export const resetPassword = async (id) => {
  const defaultPassword = 'Ponto@123';
  const hashedSenha = await bcrypt.hash(defaultPassword, 10);
  
  await query(
    'UPDATE usuario SET usu_senha = $1, updated_at = NOW() WHERE usu_id = $2',
    [hashedSenha, id]
  );
  
  return true;
};
