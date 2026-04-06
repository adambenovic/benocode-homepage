// controllers/users.controller.ts
import { Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateUserDto, UpdateUserDto } from '../types/users.types';
import { createPaginationMeta } from '../middleware/pagination.middleware';

export class UsersController {
  constructor(private usersService: UsersService) {}

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pagination = (req as any).pagination;
      const [result, stats] = await Promise.all([
        this.usersService.getAll(pagination?.skip, pagination?.limit),
        this.usersService.getStats(),
      ]);

      if (pagination) {
        res.json({
          data: result.data,
          stats,
          meta: createPaginationMeta(pagination.page, pagination.limit, result.total),
        });
      } else {
        res.json({ data: result.data, stats });
      }
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await this.usersService.getById(id as string);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto: CreateUserDto = req.body;
      const user = await this.usersService.create(dto);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateUserDto = req.body;
      const user = await this.usersService.update(id as string, dto, req.user!.userId);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await this.usersService.deactivate(id as string, req.user!.userId);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async resendInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.usersService.resendInvite(id as string);
      res.json({ data: { message: 'Invite sent successfully' } });
    } catch (error) {
      next(error);
    }
  }
}
