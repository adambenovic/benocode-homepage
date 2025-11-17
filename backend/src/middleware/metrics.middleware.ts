// middleware/metrics.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface Metrics {
  requestCount: number;
  errorCount: number;
  responseTimeSum: number;
  responseTimeCount: number;
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimeSum: 0,
  responseTimeCount: 0,
};

/**
 * Metrics middleware to track request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Increment request count
  metrics.requestCount++;

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.responseTimeSum += duration;
    metrics.responseTimeCount++;

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        path: req.path,
        method: req.method,
        duration,
      });
    }

    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
  });

  next();
}

/**
 * Get current metrics
 */
export function getMetrics(): Metrics & {
  averageResponseTime: number;
  errorRate: number;
} {
  return {
    ...metrics,
    averageResponseTime: metrics.responseTimeCount > 0
      ? metrics.responseTimeSum / metrics.responseTimeCount
      : 0,
    errorRate: metrics.requestCount > 0
      ? metrics.errorCount / metrics.requestCount
      : 0,
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics(): void {
  metrics.requestCount = 0;
  metrics.errorCount = 0;
  metrics.responseTimeSum = 0;
  metrics.responseTimeCount = 0;
}

