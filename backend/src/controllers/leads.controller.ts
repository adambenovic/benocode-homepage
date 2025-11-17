// controllers/leads.controller.ts
import { Request, Response, NextFunction } from 'express';
import { LeadsService } from '../services/leads.service';
import { CreateLeadDto, UpdateLeadDto } from '../types/leads.types';

export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateLeadDto = req.body;
      const lead = await this.leadsService.create(dto);
      res.status(201).json({ data: lead });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = (req as any).pagination;
      const result = await this.leadsService.getAll(
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
      const lead = await this.leadsService.getById(id);
      res.json({ data: lead });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateLeadDto = req.body;
      const lead = await this.leadsService.update(id, dto);
      res.json({ data: lead });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.leadsService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await this.leadsService.exportToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

