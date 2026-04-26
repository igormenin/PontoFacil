import { query } from './src/config/database.js';

async function check() {
  try {
    const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuario'");
    console.log('Columns in usuario:', res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('Error checking columns:', err);
  }
  process.exit(0);
}

check();
