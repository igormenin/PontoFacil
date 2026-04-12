import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './config/migrate.js';

const PORT = env.PORT;

const startServer = async () => {
  await runMigrations();
  
  app.listen(PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
