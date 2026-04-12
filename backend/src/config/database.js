import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DB.URL,
  host: env.DB.URL ? undefined : env.DB.HOST,
  port: env.DB.URL ? undefined : env.DB.PORT,
  user: env.DB.URL ? undefined : env.DB.USER,
  password: env.DB.URL ? undefined : env.DB.PASSWORD,
  database: env.DB.URL ? undefined : env.DB.NAME,
  ssl: env.DB.SSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

export { pool };
