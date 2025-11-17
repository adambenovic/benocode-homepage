// controllers/legal.controller.ts
import { Request, Response, NextFunction } from 'express';
import { LegalService } from '../services/legal.service';

export class LegalController {
  constructor(private legalService: LegalService) {}

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { locale } = req.query;
      const legalPage = await this.legalService.getBySlug(slug, locale as string | undefined);

      if (!legalPage) {
        return res.status(404).json({
          error: {
            message: 'Legal page not found',
            statusCode: 404,
          },
        });
      }

      res.json({ data: legalPage });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const legalPages = await this.legalService.getAll();
      res.json({ data: legalPages });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const legalPage = await this.legalService.update(slug, req.body);
      res.json({ data: legalPage });
    } catch (error) {
      next(error);
    }
  }
}

