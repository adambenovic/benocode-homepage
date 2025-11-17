// controllers/meetings.controller.ts
import { Request, Response, NextFunction } from 'express';
import { MeetingsService } from '../services/meetings.service';
import { CreateMeetingDto, UpdateMeetingDto, UpdateAvailabilityDto } from '../types/meetings.types';

export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateMeetingDto = req.body;
      const meeting = await this.meetingsService.create(dto);
      res.status(201).json({ data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            message: 'startDate and endDate query parameters are required',
            statusCode: 400,
          },
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: {
            message: 'Invalid date format. Use ISO 8601 format.',
            statusCode: 400,
          },
        });
      }

      const slots = await this.meetingsService.getAvailability(start, end);
      res.json({ data: slots });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = (req as any).pagination;
      const result = await this.meetingsService.getAll(
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
      const meeting = await this.meetingsService.getById(id);
      res.json({ data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateMeetingDto = req.body;
      const meeting = await this.meetingsService.update(id, dto);
      res.json({ data: meeting });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.meetingsService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getAvailabilityConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const availability = await this.meetingsService.getAvailabilityConfig();
      res.json({ data: availability });
    } catch (error) {
      next(error);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: UpdateAvailabilityDto = req.body;
      await this.meetingsService.updateAvailability(dto);
      res.json({ data: { message: 'Availability updated successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

