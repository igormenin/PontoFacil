import { query } from './src/config/database.js';

async function check() {
  try {
    const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'dia' AND column_name = 'usu_id'");
    if (res.rows.length > 0) {
      console.log('Column usu_id exists in table dia');
    } else {
      console.log('Column usu_id MISSING in table dia');
    }
  } catch (err) {
    console.error('Error checking columns:', err);
  }
  process.exit(0);
}

check();
