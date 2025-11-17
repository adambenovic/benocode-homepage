// types/legal.types.ts
import { Locale } from '@prisma/client';
import { z } from 'zod';

export interface CreateLegalPageDto {
  slug: string;
  translations: LegalPageTranslationDto[];
}

export interface UpdateLegalPageDto {
  translations?: LegalPageTranslationDto[];
}

export interface LegalPageTranslationDto {
  locale: Locale;
  title: string;
  content: string;
}

export interface LegalPageResponse {
  id: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  translations: {
    locale: Locale;
    title: string;
    content: string;
  }[];
}

// Validation schemas
export const legalPageTranslationSchema = z.object({
  locale: z.nativeEnum(Locale),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export const createLegalPageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  translations: z.array(legalPageTranslationSchema).min(1, 'At least one translation is required'),
});

export const updateLegalPageSchema = z.object({
  translations: z.array(legalPageTranslationSchema).optional(),
});

