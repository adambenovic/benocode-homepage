// types/leads.types.ts
import { LeadStatus } from '@prisma/client';

export interface CreateLeadDto {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLeadDto {
  status?: LeadStatus;
}

export interface LeadResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: LeadStatus;
  source: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

