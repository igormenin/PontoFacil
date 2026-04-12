import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';
import { env } from '../../config/env.js';

export const login = async (login, senha) => {
  const result = await query(
    'SELECT * FROM usuario WHERE usu_login = $1',
    [login]
  );
  
  const user = result.rows[0];
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isMatch = await bcrypt.compare(senha, user.usu_senha);
  
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  const token = jwt.sign(
    { id: user.usu_id, login: user.usu_login },
    env.JWT.SECRET,
    { expiresIn: env.JWT.EXPIRES_IN }
  );
  
  return {
    token,
    user: {
      id: user.usu_id,
      login: user.usu_login,
      nome: user.usu_nome,
      email: user.usu_email,
      avatar: user.usu_avatar,
      cargo: user.usu_cargo,
    },
  };
};

export const forgotPassword = async (email) => {
  const result = await query('SELECT * FROM usuario WHERE usu_email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new Error('Usuário não encontrado com este e-mail.');
  }

  const token = Math.random().toString(36).substring(2, 12).toUpperCase(); // Simple token for small app
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await query(
    'UPDATE usuario SET usu_reset_token = $1, usu_reset_expires = $2 WHERE usu_id = $3',
    [token, expires, user.usu_id]
  );

  const { sendEmail } = await import('../../utils/emailService.js');
  await sendEmail({
    to: user.usu_email,
    subject: 'Recuperação de Senha - Ponto Fácil',
    html: `
      <h1>Recuperação de Senha</h1>
      <p>Olá ${user.usu_nome || user.usu_login},</p>
      <p>Você solicitou a recuperação de senha. Use o código abaixo para redefinir sua senha:</p>
      <h2 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${token}</h2>
      <p>Este código expira em 1 hora.</p>
    `,
  });

  return true;
};

export const resetPassword = async (email, token, newPassword) => {
  const result = await query(
    'SELECT * FROM usuario WHERE usu_email = $1 AND usu_reset_token = $2 AND usu_reset_expires > NOW()',
    [email, token]
  );
  
  const user = result.rows[0];

  if (!user) {
    throw new Error('Código de recuperação inválido ou expirado.');
  }

  const hashedSenha = await bcrypt.hash(newPassword, 10);
  
  await query(
    'UPDATE usuario SET usu_senha = $1, usu_reset_token = NULL, usu_reset_expires = NULL WHERE usu_id = $2',
    [hashedSenha, user.usu_id]
  );

  return true;
};
