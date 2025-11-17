// types/content.types.ts
import { ContentType, Locale } from '@prisma/client';
import { z } from 'zod';

export interface CreateContentDto {
  key: string;
  type: ContentType;
  translations: ContentTranslationDto[];
}

export interface UpdateContentDto {
  type?: ContentType;
  translations?: ContentTranslationDto[];
}

export interface ContentTranslationDto {
  locale: Locale;
  value: string;
}

export interface ContentResponse {
  id: string;
  key: string;
  type: ContentType;
  createdAt: Date;
  updatedAt: Date;
  translations: {
    locale: Locale;
    value: string;
  }[];
}

// Validation schemas
export const contentTranslationSchema = z.object({
  locale: z.nativeEnum(Locale),
  value: z.string().min(1, 'Value is required'),
});

export const createContentSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9._-]+$/, 'Key must contain only lowercase letters, numbers, dots, underscores, and hyphens'),
  type: z.nativeEnum(ContentType),
  translations: z.array(contentTranslationSchema).min(1, 'At least one translation is required'),
});

export const updateContentSchema = z.object({
  type: z.nativeEnum(ContentType).optional(),
  translations: z.array(contentTranslationSchema).optional(),
});

