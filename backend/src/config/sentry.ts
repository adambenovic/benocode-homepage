// config/sentry.ts
import { env } from './env';

let Sentry: any = null;

try {
  Sentry = require('@sentry/node');
} catch (error) {
  console.log('@sentry/node not installed, Sentry features disabled');
}

export function initSentry() {
  if (!Sentry) {
    console.log('Sentry not available (module not installed)');
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    console.log('Sentry initialized');
  } catch (error) {
    console.warn('Failed to initialize Sentry', error);
  }
}

export function getSentry() {
  return Sentry;
}
