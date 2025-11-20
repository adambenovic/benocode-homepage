// types/meetings.types.ts
import { MeetingStatus, Locale } from '@prisma/client';
import { z } from 'zod';

export interface CreateMeetingDto {
  email: string;
  name: string;
  phone?: string;
  scheduledAt: string; // ISO 8601 datetime string
  duration?: number; // minutes
  timezone?: string;
  locale?: string; // User's language preference (EN, SK, DE, CZ)
  notes?: string;
}

export interface UpdateMeetingDto {
  status?: MeetingStatus;
  notes?: string;
}

export interface MeetingAvailabilityDto {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive?: boolean;
}

export interface UpdateAvailabilityDto {
  availability: MeetingAvailabilityDto[];
}

export interface MeetingResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  scheduledAt: Date;
  duration: number;
  timezone: string;
  locale: Locale;
  status: MeetingStatus;
  notes?: string;
  confirmationToken: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityResponse {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableTimeSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  available: boolean;
}

// Validation schemas
export const createMeetingSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  scheduledAt: z.string().datetime('Invalid datetime format'),
  duration: z.number().int().min(15).max(120).default(30),
  timezone: z.string().default('UTC'),
  locale: z.enum(['EN', 'SK', 'DE', 'CZ']).optional(),
  notes: z.string().optional(),
});

export const updateMeetingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  notes: z.string().optional(),
});

export const meetingAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  isActive: z.boolean().optional(),
});

export const updateAvailabilitySchema = z.object({
  availability: z.array(meetingAvailabilitySchema).min(1, 'At least one availability slot is required'),
});

