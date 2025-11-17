// controllers/links.controller.ts
import { Request, Response, NextFunction } from 'express';
import { LinksService } from '../services/links.service';
import {
  CreateSocialLinkDto,
  UpdateSocialLinkDto,
  CreateExternalLinkDto,
  UpdateExternalLinkDto,
} from '../types/links.types';

export class LinksController {
  constructor(private linksService: LinksService) {}

  // Social Links - Public
  async getAllSocialLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await this.linksService.getAllSocialLinks();
      res.json({ data: links });
    } catch (error) {
      next(error);
    }
  }

  // Social Links - Admin
  async getAllSocialLinksAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await this.linksService.getAllSocialLinksAdmin();
      res.json({ data: links });
    } catch (error) {
      next(error);
    }
  }

  async createSocialLink(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateSocialLinkDto = req.body;
      const link = await this.linksService.createSocialLink(dto);
      res.status(201).json({ data: link });
    } catch (error) {
      next(error);
    }
  }

  async updateSocialLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateSocialLinkDto = req.body;
      const link = await this.linksService.updateSocialLink(id, dto);
      res.json({ data: link });
    } catch (error) {
      next(error);
    }
  }

  async deleteSocialLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.linksService.deleteSocialLink(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // External Links - Public
  async getAllExternalLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await this.linksService.getAllExternalLinks();
      res.json({ data: links });
    } catch (error) {
      next(error);
    }
  }

  // External Links - Admin
  async getAllExternalLinksAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await this.linksService.getAllExternalLinksAdmin();
      res.json({ data: links });
    } catch (error) {
      next(error);
    }
  }

  async createExternalLink(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateExternalLinkDto = req.body;
      const link = await this.linksService.createExternalLink(dto);
      res.status(201).json({ data: link });
    } catch (error) {
      next(error);
    }
  }

  async updateExternalLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateExternalLinkDto = req.body;
      const link = await this.linksService.updateExternalLink(id, dto);
      res.json({ data: link });
    } catch (error) {
      next(error);
    }
  }

  async deleteExternalLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.linksService.deleteExternalLink(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

