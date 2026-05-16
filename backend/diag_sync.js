
import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDb() {
  console.log('--- Verificando Banco de Dados ---');
  try {
    const users = await pool.query('SELECT usu_id, usu_login, usu_leitor FROM usuario');
    console.log('Usuários:', users.rows);

    const tables = ['cliente', 'dia', 'intervalo', 'mes', 'feriado', 'valor_hora_base'];
    for (const table of tables) {
      const count = await pool.query(`SELECT count(*) FROM ${table}`);
      const userCounts = await pool.query(`SELECT usu_id, count(*) FROM ${table} GROUP BY usu_id`);
      console.log(`Tabela ${table}: Total ${count.rows[0].count} registros`);
      console.log(`  Por usuário:`, userCounts.rows);
    }

    console.log('\n--- Últimos Logs de Sincronização (Jucemara id:3) ---');
    const logs = await pool.query(
      "SELECT * FROM logs WHERE dados LIKE '%\"userId\":3%' ORDER BY datahora DESC LIMIT 10"
    );
    logs.rows.forEach(log => {
      console.log(`[${log.datahora}] ${log.origem}: ${log.dados}`);
    });

  } catch (err) {
    console.error('Erro ao consultar banco:', err);
  } finally {
    await pool.end();
  }
}

checkDb();
