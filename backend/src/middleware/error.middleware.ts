// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { RequestWithId } from './requestId.middleware';
import { getSentry } from '../config/sentry';

export function errorHandler(
  err: Error,
  req: RequestWithId,
  res: Response,
  next: NextFunction
) {
  const requestId = req.id || 'unknown';

  if (err instanceof AppError) {
    const errorResponse: any = {
      error: {
        message: err.message,
        statusCode: err.statusCode,
        requestId,
      },
    };

    // Add validation details if present
    if ((err as any).details) {
      errorResponse.error.details = (err as any).details;
    }

    logger.warn(`Error ${err.statusCode}: ${err.message}`, { requestId, path: req.path });
    return res.status(err.statusCode).json(errorResponse);
  }

  // Log unexpected errors
  logger.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    requestId,
    path: req.path,
  });

  // Send to Sentry in production
  const Sentry = getSentry();
  if (Sentry && process.env.NODE_ENV === 'production') {
    try {
      Sentry.captureException(err, {
        tags: {
          requestId,
          path: req.path,
        },
        extra: {
          method: req.method,
          body: req.body,
          query: req.query,
        },
      });
    } catch (sentryError) {
      logger.warn('Failed to send error to Sentry', { sentryError });
    }
  }

  return res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500,
      requestId,
    },
  });
}

