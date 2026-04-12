import { query } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function run() {
  const hash = bcrypt.hashSync('admin123', 10);
  await query('UPDATE usuario SET usu_senha = $1 WHERE usu_login = $2', [hash, 'admin']);
  console.log('Senha do admin atualizada com sucesso para: admin123');
  process.exit(0);
}
run();
