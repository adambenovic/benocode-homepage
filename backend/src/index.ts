// index.ts
import 'dotenv/config';
import { initSentry } from './config/sentry';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

// Initialize Sentry before anything else
initSentry();

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(async () => {
    logger.info('HTTP server closed');
    await closeRedisClient();
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

