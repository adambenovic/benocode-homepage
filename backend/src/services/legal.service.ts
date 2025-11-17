// services/legal.service.ts
import { PrismaClient, Locale } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateLegalPageDto, UpdateLegalPageDto, LegalPageResponse } from '../types/legal.types';

export class LegalService {
  constructor(private prisma: PrismaClient) {}

  async getBySlug(slug: string, locale?: string): Promise<LegalPageResponse | null> {
    const legalPage = await this.prisma.legalPage.findUnique({
      where: { slug },
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

    if (!legalPage) {
      return null;
    }

    return this.mapToResponse(legalPage);
  }

  async getAll(): Promise<LegalPageResponse[]> {
    const legalPages = await this.prisma.legalPage.findMany({
      include: {
        translations: true,
      },
      orderBy: {
        slug: 'asc',
      },
    });

    return legalPages.map(this.mapToResponse);
  }

  async update(slug: string, dto: UpdateLegalPageDto): Promise<LegalPageResponse> {
    const existing = await this.prisma.legalPage.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw new NotFoundError('Legal page');
    }

    if (!dto.translations || dto.translations.length === 0) {
      throw new ValidationError('At least one translation is required');
    }

    // Check for duplicate locales
    const locales = dto.translations.map((t) => t.locale);
    const uniqueLocales = new Set(locales);
    if (locales.length !== uniqueLocales.size) {
      throw new ValidationError('Duplicate locales are not allowed');
    }

    // Delete existing translations
    await this.prisma.legalPageTranslation.deleteMany({
      where: { legalPageId: existing.id },
    });

    // Create new translations
    const legalPage = await this.prisma.legalPage.update({
      where: { slug },
      data: {
        translations: {
          create: dto.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            content: t.content,
          })),
        },
      },
      include: {
        translations: true,
      },
    });

    return this.mapToResponse(legalPage);
  }

  private mapToResponse(legalPage: {
    id: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    translations: Array<{
      locale: Locale;
      title: string;
      content: string;
    }>;
  }): LegalPageResponse {
    return {
      id: legalPage.id,
      slug: legalPage.slug,
      createdAt: legalPage.createdAt,
      updatedAt: legalPage.updatedAt,
      translations: legalPage.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        content: t.content,
      })),
    };
  }
}

