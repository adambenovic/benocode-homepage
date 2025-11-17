// middleware/csrf.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHmac } from 'crypto';
import { env } from '../config/env';

const CSRF_SECRET = env.JWT_SECRET; // Reuse JWT secret for CSRF token signing

interface RequestWithCsrf extends Request {
  csrfToken?: () => string;
  csrfSecret?: string;
}

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing requests
 * Note: Simplified implementation - in production, use a library like csurf
 */
export function csrfMiddleware(req: RequestWithCsrf, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for public endpoints that use rate limiting
  if (req.path.startsWith('/api/v1/auth/login') || req.path.startsWith('/api/v1/leads')) {
    return next();
  }

  // Generate CSRF token function for admin endpoints
  req.csrfToken = () => {
    const secret = req.csrfSecret || generateSecret();
    req.csrfSecret = secret;
    return generateToken(secret);
  };

  // For admin endpoints, validate CSRF token
  // Check both lowercase and uppercase header names (Express normalizes to lowercase)
  const token = (req.headers['x-csrf-token'] || req.headers['X-CSRF-Token']) as string;
  const cookieSecret = req.cookies?.['csrf-token'];

  if (req.path.startsWith('/api/v1/admin')) {
    if (!token || !cookieSecret) {
      // Log for debugging
      console.log('CSRF validation failed:', {
        path: req.path,
        method: req.method,
        hasToken: !!token,
        hasCookieSecret: !!cookieSecret,
        cookies: Object.keys(req.cookies || {}),
        headers: Object.keys(req.headers).filter(h => h.toLowerCase().includes('csrf')),
      });
      
      return res.status(403).json({
        error: {
          message: 'CSRF token missing',
          statusCode: 403,
        },
      });
    }

    if (!validateToken(token, cookieSecret)) {
      console.log('CSRF token validation failed:', {
        path: req.path,
        method: req.method,
        tokenLength: token?.length,
        cookieSecretLength: cookieSecret?.length,
      });
      
      return res.status(403).json({
        error: {
          message: 'Invalid CSRF token',
          statusCode: 403,
        },
      });
    }
  }

  next();
}

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

function generateToken(secret: string): string {
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(secret);
  return hmac.digest('hex');
}

function validateToken(token: string, secret: string): boolean {
  const expectedToken = generateToken(secret);
  return token === expectedToken;
}
