// services/testimonials.service.ts
import { PrismaClient, Locale } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateTestimonialDto, UpdateTestimonialDto, TestimonialResponse } from '../types/testimonials.types';

export class TestimonialsService {
  constructor(private prisma: PrismaClient) {}

  async getAll(locale?: string): Promise<TestimonialResponse[]> {
    const testimonials = await this.prisma.testimonial.findMany({
      where: {
        isActive: true,
      },
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
        order: 'asc',
      },
    });

    return testimonials.map(this.mapToResponse);
  }

  async getAllAdmin(skip?: number, take?: number): Promise<{ data: TestimonialResponse[]; total: number }> {
    const [testimonials, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        skip,
        take,
        include: {
          translations: true,
        },
        orderBy: {
          order: 'asc',
        },
      }),
      this.prisma.testimonial.count(),
    ]);

    return {
      data: testimonials.map(this.mapToResponse),
      total,
    };
  }

  async getById(id: string): Promise<TestimonialResponse> {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!testimonial) {
      throw new NotFoundError('Testimonial');
    }

    return this.mapToResponse(testimonial);
  }

  async create(dto: CreateTestimonialDto): Promise<TestimonialResponse> {
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

    const testimonial = await this.prisma.testimonial.create({
      data: {
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
        translations: {
          create: dto.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
            role: t.role,
            company: t.company,
            content: t.content,
          })),
        },
      },
      include: {
        translations: true,
      },
    });

    return this.mapToResponse(testimonial);
  }

  async update(id: string, dto: UpdateTestimonialDto): Promise<TestimonialResponse> {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Testimonial');
    }

    // Update main testimonial fields
    const updateData: any = {};
    if (dto.order !== undefined) updateData.order = dto.order;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    // Update translations if provided
    if (dto.translations) {
      // Delete existing translations
      await this.prisma.testimonialTranslation.deleteMany({
        where: { testimonialId: id },
      });

      // Create new translations
      updateData.translations = {
        create: dto.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          role: t.role,
          company: t.company,
          content: t.content,
        })),
      };
    }

    const testimonial = await this.prisma.testimonial.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
      },
    });

    return this.mapToResponse(testimonial);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Testimonial');
    }

    await this.prisma.testimonial.delete({
      where: { id },
    });
  }

  async updateOrder(id: string, order: number): Promise<TestimonialResponse> {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Testimonial');
    }

    const testimonial = await this.prisma.testimonial.update({
      where: { id },
      data: { order },
      include: {
        translations: true,
      },
    });

    return this.mapToResponse(testimonial);
  }

  private mapToResponse(testimonial: {
    id: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    translations: Array<{
      locale: Locale;
      name: string;
      role: string | null;
      company: string | null;
      content: string;
    }>;
  }): TestimonialResponse {
    return {
      id: testimonial.id,
      order: testimonial.order,
      isActive: testimonial.isActive,
      createdAt: testimonial.createdAt,
      updatedAt: testimonial.updatedAt,
      translations: testimonial.translations.map((t: any) => ({
        locale: t.locale,
        name: t.name,
        role: t.role ?? undefined,
        company: t.company ?? undefined,
        content: t.content,
      })),
    };
  }
}

