import { query } from '../config/database.js';

export const logToDb = async (origem, dados) => {
  try {
    const dadosStr = typeof dados === 'object' ? JSON.stringify(dados) : String(dados);
    await query(
      'INSERT INTO logs (datahora, origem, dados) VALUES (CURRENT_TIMESTAMP, $1, $2)',
      [origem, dadosStr.substring(0, 10000)]
    );
  } catch (error) {
    console.error('Error writing to logs table:', error);
  }
};

export const initLogTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        datahora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        origem VARCHAR(255) NOT NULL,
        dados TEXT
      );
    `);
    console.log('Logs table checked/created successfully');
  } catch (error) {
    console.error('Error creating logs table:', error);
  }
};
