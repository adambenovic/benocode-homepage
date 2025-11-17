// types/links.types.ts
import { z } from 'zod';

export interface CreateSocialLinkDto {
  platform: string;
  url: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateSocialLinkDto {
  platform?: string;
  url?: string;
  order?: number;
  isActive?: boolean;
}

export interface SocialLinkResponse {
  id: string;
  platform: string;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExternalLinkDto {
  label: string;
  url: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateExternalLinkDto {
  label?: string;
  url?: string;
  order?: number;
  isActive?: boolean;
}

export interface ExternalLinkResponse {
  id: string;
  label: string;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Validation schemas
export const createSocialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Invalid URL'),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateSocialLinkSchema = z.object({
  platform: z.string().min(1).optional(),
  url: z.string().url('Invalid URL').optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createExternalLinkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  url: z.string().url('Invalid URL'),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateExternalLinkSchema = z.object({
  label: z.string().min(1).optional(),
  url: z.string().url('Invalid URL').optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

