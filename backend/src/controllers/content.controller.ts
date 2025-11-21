// controllers/content.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { CreateContentDto, UpdateContentDto } from '../types/content.types';
import { invalidateCache } from '../middleware/cache.middleware';

export class ContentController {
  constructor(private contentService: ContentService) { }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { locale } = req.query;
      const pagination = (req as any).pagination;
      const result = await this.contentService.getAll(
        locale as string | undefined,
        pagination?.skip,
        pagination?.limit
      );

      if (pagination) {
        const { createPaginationMeta } = await import('../middleware/pagination.middleware');
        res.json({
          data: result.data,
          meta: createPaginationMeta(pagination.page, pagination.limit, result.total),
        });
      } else {
        res.json({ data: result.data });
      }
    } catch (error) {
      return next(error);
    }
  }

  async getByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { locale } = req.query;
      const content = await this.contentService.getByKey(key, locale as string | undefined);

      if (!content) {
        return res.status(404).json({
          error: {
            message: 'Content not found',
            statusCode: 404,
          },
        });
      }

      res.json({ data: content });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateContentDto = req.body;
      const content = await this.contentService.create(dto);
      await invalidateCache('/api/v1/content*');
      res.status(201).json({ data: content });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const dto: UpdateContentDto = req.body;
      const content = await this.contentService.update(key, dto);
      await invalidateCache('/api/v1/content*');
      res.json({ data: content });
    } catch (error) {
      return next(error);
    }
  }
}

