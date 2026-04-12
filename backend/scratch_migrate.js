import { runMigrations } from './src/config/migrate.js';
import { logger } from './src/utils/logger.js';

async function run() {
  try {
    await runMigrations();
    console.log('Migrations finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
