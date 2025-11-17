// middleware/requestId.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

export interface RequestWithId extends Request {
  id?: string;
}

export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
) {
  // Generate request ID if not present in headers
  const requestId = req.headers['x-request-id'] as string || randomBytes(16).toString('hex');
  req.id = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

