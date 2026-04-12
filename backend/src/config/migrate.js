import { runner } from 'node-pg-migrate';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  const databaseUrl = env.DB.URL || {
    user: env.DB.USER,
    password: env.DB.PASSWORD,
    host: env.DB.HOST,
    port: env.DB.PORT,
    database: env.DB.NAME,
    ssl: env.DB.SSL ? { rejectUnauthorized: false } : false,
  };

  try {
    logger.info('Running database migrations...');
    await runner({
      databaseUrl,
      dir: path.join(__dirname, '../../migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
    });
    logger.info('Migrations completed successfully.');
  } catch (error) {
    logger.error('Migration failed:', error);
    // In production, we might want to exit, but in dev we can just log
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
