// controllers/testimonials.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TestimonialsService } from '../services/testimonials.service';
import { PrismaClient } from '@prisma/client';
import { CreateTestimonialDto, UpdateTestimonialDto } from '../types/testimonials.types';
import { invalidateCache } from '../middleware/cache.middleware';

export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { locale } = req.query;
      const testimonials = await this.testimonialsService.getAll(locale as string | undefined);
      res.json({ data: testimonials });
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = (req as any).pagination;
      const result = await this.testimonialsService.getAllAdmin(
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
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const testimonial = await this.testimonialsService.getById(id);
      res.json({ data: testimonial });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateTestimonialDto = req.body;
      const testimonial = await this.testimonialsService.create(dto);
      await invalidateCache('/api/v1/testimonials*');
      res.status(201).json({ data: testimonial });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateTestimonialDto = req.body;
      const testimonial = await this.testimonialsService.update(id, dto);
      await invalidateCache('/api/v1/testimonials*');
      res.json({ data: testimonial });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.testimonialsService.delete(id);
      await invalidateCache('/api/v1/testimonials*');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { order } = req.body;
      const testimonial = await this.testimonialsService.updateOrder(id, order);
      await invalidateCache('/api/v1/testimonials*');
      res.json({ data: testimonial });
    } catch (error) {
      next(error);
    }
  }
}

// Factory function to create controller with service
export function createTestimonialsController(prisma: PrismaClient): TestimonialsController {
  const service = new TestimonialsService(prisma);
  return new TestimonialsController(service);
}

