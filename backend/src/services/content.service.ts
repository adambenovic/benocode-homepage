// services/content.service.ts
import { PrismaClient, ContentType, Locale } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateContentDto, UpdateContentDto, ContentResponse } from '../types/content.types';

export class ContentService {
  constructor(private prisma: PrismaClient) {}

  async getAll(locale?: string, skip?: number, take?: number): Promise<{ data: ContentResponse[]; total: number }> {
    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        skip,
        take,
        include: {
          translations: locale
            ? {
                where: {
                  locale: locale.toUpperCase() as Locale,
                },
              }
            : true,
        },
        orderBy: {
          key: 'asc',
        },
      }),
      this.prisma.content.count(),
    ]);

    return {
      data: contents.map(this.mapToResponse),
      total,
    };
  }

  async getByKey(key: string, locale?: string): Promise<ContentResponse | null> {
    const content = await this.prisma.content.findUnique({
      where: { key },
      include: {
        translations: locale
          ? {
              where: {
                locale: locale.toUpperCase() as Locale,
              },
            }
          : true,
      },
    });

    if (!content) {
      return null;
    }

    return this.mapToResponse(content);
  }

  async create(dto: CreateContentDto): Promise<ContentResponse> {
    // Check if key already exists
    const existing = await this.prisma.content.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ValidationError(`Content with key "${dto.key}" already exists`);
    }

    // Validate that at least one translation is provided
    if (!dto.translations || dto.translations.length === 0) {
      throw new ValidationError('At least one translation is required');
    }

    // Check for duplicate locales
    const locales = dto.translations.map((t) => t.locale);
    const uniqueLocales = new Set(locales);
    if (locales.length !== uniqueLocales.size) {
      throw new ValidationError('Duplicate locales are not allowed');
    }

    const content = await this.prisma.content.create({
      data: {
        key: dto.key,
        type: dto.type,
        translations: {
          create: dto.translations.map((t) => ({
            locale: t.locale,
            value: t.value,
          })),
        },
      },
      include: {
        translations: true,
      },
    });

    return this.mapToResponse(content);
  }

  async update(key: string, dto: UpdateContentDto): Promise<ContentResponse> {
    const existing = await this.prisma.content.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundError('Content');
    }

    const updateData: any = {};
    if (dto.type !== undefined) updateData.type = dto.type;

    // Update translations if provided
    if (dto.translations) {
      // Delete existing translations
      await this.prisma.contentTranslation.deleteMany({
        where: { contentId: existing.id },
      });

      // Create new translations
      updateData.translations = {
        create: dto.translations.map((t) => ({
          locale: t.locale,
          value: t.value,
        })),
      };
    }

    const content = await this.prisma.content.update({
      where: { key },
      data: updateData,
      include: {
        translations: true,
      },
    });

    return this.mapToResponse(content);
  }

  private mapToResponse(content: {
    id: string;
    key: string;
    type: ContentType;
    createdAt: Date;
    updatedAt: Date;
    translations: Array<{
      locale: Locale;
      value: string;
    }>;
  }): ContentResponse {
    return {
      id: content.id,
      key: content.key,
      type: content.type,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      translations: content.translations.map((t) => ({
        locale: t.locale,
        value: t.value,
      })),
    };
  }
}

