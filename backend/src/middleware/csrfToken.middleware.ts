// middleware/csrfToken.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHmac } from 'crypto';
import { env } from '../config/env';

const CSRF_SECRET = env.JWT_SECRET;

/**
 * Middleware to generate and set CSRF token cookie
 * Should be called before routes that need CSRF protection
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only set CSRF token for GET requests (to provide token for subsequent POST/PUT/DELETE)
  if (req.method === 'GET') {
    let secret = req.cookies?.['csrf-token'];
    
    // Generate new secret if cookie doesn't exist
    if (!secret) {
      secret = randomBytes(32).toString('hex');
      
      // Set cookie with httpOnly flag for security
      // Use 'lax' in development to allow cross-port requests (localhost:3000 -> localhost:3001)
      res.cookie('csrf-token', secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }
    
    // Always set token in response header for frontend to read (even if cookie exists)
    const token = generateToken(secret);
    res.setHeader('X-CSRF-Token', token);
  }
  
  next();
}

function generateToken(secret: string): string {
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(secret);
  return hmac.digest('hex');
}

