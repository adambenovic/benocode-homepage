// app.ts
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import apiRoutes from './routes/api.routes';
import { publicRateLimit } from './middleware/rateLimit.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { sanitizeMiddleware } from './middleware/sanitize.middleware';
import { csrfMiddleware } from './middleware/csrf.middleware';
import { csrfTokenMiddleware } from './middleware/csrfToken.middleware';
import cookieParser from 'cookie-parser';
import { getSentry } from './config/sentry';
import { metricsMiddleware } from './middleware/metrics.middleware';

export function createApp(): Express {
  const app = express();

  // Sentry request handler (must be first) - only if Sentry is initialized
  const Sentry = getSentry();
  if (Sentry && process.env.SENTRY_DSN) {
    try {
      app.use(Sentry.Handlers.requestHandler());
      app.use(Sentry.Handlers.tracingHandler());
    } catch (error) {
      logger.warn('Sentry handlers not available', { error });
    }
  }

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      exposedHeaders: ['X-CSRF-Token'], // Expose CSRF token header so frontend can read it
    })
  );

  // Request ID middleware (must be early)
  app.use(requestIdMiddleware);

  // Cookie parser (needed for CSRF tokens)
  app.use(cookieParser());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Input sanitization
  app.use(sanitizeMiddleware);

  // CSRF token generation (for GET requests)
  app.use(csrfTokenMiddleware);

  // CSRF protection (after body parsing, before routes)
  app.use(csrfMiddleware);

  // Metrics middleware
  app.use(metricsMiddleware);

  // Request logging
  app.use((req, res, next) => {
    const requestId = (req as any).id || 'unknown';
    logger.info(`${req.method} ${req.path}`, { requestId });
    next();
  });

  // Health check endpoint with database verification
  app.get('/health', async (req, res) => {
    try {
      const { prisma } = await import('./config/database');
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Metrics endpoint (admin only) - must be after API routes for auth middleware
  // This will be added after API routes are mounted

  // API routes with rate limiting
  app.use('/api/v1', publicRateLimit, apiRoutes);

  // Sentry error handler (before custom error handler) - only if Sentry is initialized
  if (Sentry && process.env.SENTRY_DSN) {
    try {
      app.use(Sentry.Handlers.errorHandler());
    } catch (error) {
      logger.warn('Sentry error handler not available', { error });
    }
  }

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

