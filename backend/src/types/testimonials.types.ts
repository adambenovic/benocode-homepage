// types/testimonials.types.ts
import { Locale } from '@prisma/client';
import { z } from 'zod';

export interface CreateTestimonialDto {
  order?: number;
  isActive?: boolean;
  translations: TestimonialTranslationDto[];
}

export interface UpdateTestimonialDto {
  order?: number;
  isActive?: boolean;
  translations?: TestimonialTranslationDto[];
}

export interface TestimonialTranslationDto {
  locale: Locale;
  name: string;
  role?: string;
  company?: string;
  content: string;
}

export interface TestimonialResponse {
  id: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations: {
    locale: Locale;
    name: string;
    role?: string;
    company?: string;
    content: string;
  }[];
}

// Validation schemas
export const testimonialTranslationSchema = z.object({
  locale: z.nativeEnum(Locale),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().optional(),
  company: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

export const createTestimonialSchema = z.object({
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  translations: z.array(testimonialTranslationSchema).min(1, 'At least one translation is required'),
});

export const updateTestimonialSchema = z.object({
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  translations: z.array(testimonialTranslationSchema).optional(),
});

export const updateOrderSchema = z.object({
  order: z.number().int().min(0),
});
