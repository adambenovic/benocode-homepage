// middleware/pagination.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface PaginatedRequest extends Request {
  pagination?: {
    page: number;
    limit: number;
    skip: number;
  };
}

const paginationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});

export function paginationMiddleware(
  req: PaginatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = paginationSchema.parse(req.query);
    const page = Math.max(1, result.page || 1);
    const limit = Math.min(100, Math.max(1, result.limit || 10)); // Max 100 items per page
    const skip = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      skip,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

