// services/links.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import {
  CreateSocialLinkDto,
  UpdateSocialLinkDto,
  SocialLinkResponse,
  CreateExternalLinkDto,
  UpdateExternalLinkDto,
  ExternalLinkResponse,
} from '../types/links.types';

export class LinksService {
  constructor(private prisma: PrismaClient) {}

  // Social Links
  async getAllSocialLinks(): Promise<SocialLinkResponse[]> {
    const links = await this.prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return links.map(this.mapSocialLinkToResponse);
  }

  async getAllSocialLinksAdmin(): Promise<SocialLinkResponse[]> {
    const links = await this.prisma.socialLink.findMany({
      orderBy: { order: 'asc' },
    });

    return links.map(this.mapSocialLinkToResponse);
  }

  async createSocialLink(dto: CreateSocialLinkDto): Promise<SocialLinkResponse> {
    const link = await this.prisma.socialLink.create({
      data: {
        platform: dto.platform,
        url: dto.url,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapSocialLinkToResponse(link);
  }

  async updateSocialLink(id: string, dto: UpdateSocialLinkDto): Promise<SocialLinkResponse> {
    const existing = await this.prisma.socialLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Social link');
    }

    const link = await this.prisma.socialLink.update({
      where: { id },
      data: {
        platform: dto.platform,
        url: dto.url,
        order: dto.order,
        isActive: dto.isActive,
      },
    });

    return this.mapSocialLinkToResponse(link);
  }

  async deleteSocialLink(id: string): Promise<void> {
    const existing = await this.prisma.socialLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Social link');
    }

    await this.prisma.socialLink.delete({
      where: { id },
    });
  }

  // External Links
  async getAllExternalLinks(): Promise<ExternalLinkResponse[]> {
    const links = await this.prisma.externalLink.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return links.map(this.mapExternalLinkToResponse);
  }

  async getAllExternalLinksAdmin(): Promise<ExternalLinkResponse[]> {
    const links = await this.prisma.externalLink.findMany({
      orderBy: { order: 'asc' },
    });

    return links.map(this.mapExternalLinkToResponse);
  }

  async createExternalLink(dto: CreateExternalLinkDto): Promise<ExternalLinkResponse> {
    const link = await this.prisma.externalLink.create({
      data: {
        label: dto.label,
        url: dto.url,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapExternalLinkToResponse(link);
  }

  async updateExternalLink(id: string, dto: UpdateExternalLinkDto): Promise<ExternalLinkResponse> {
    const existing = await this.prisma.externalLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('External link');
    }

    const link = await this.prisma.externalLink.update({
      where: { id },
      data: {
        label: dto.label,
        url: dto.url,
        order: dto.order,
        isActive: dto.isActive,
      },
    });

    return this.mapExternalLinkToResponse(link);
  }

  async deleteExternalLink(id: string): Promise<void> {
    const existing = await this.prisma.externalLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('External link');
    }

    await this.prisma.externalLink.delete({
      where: { id },
    });
  }

  private mapSocialLinkToResponse(link: any): SocialLinkResponse {
    return {
      id: link.id,
      platform: link.platform,
      url: link.url,
      order: link.order,
      isActive: link.isActive,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };
  }

  private mapExternalLinkToResponse(link: any): ExternalLinkResponse {
    return {
      id: link.id,
      label: link.label,
      url: link.url,
      order: link.order,
      isActive: link.isActive,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };
  }
}

