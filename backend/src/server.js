import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './config/migrate.js';

const PORT = env.PORT;

const startServer = async () => {
  try {
    await runMigrations();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server LIVE on port ${PORT}`);
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ CRITICAL STARTUP ERROR:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
