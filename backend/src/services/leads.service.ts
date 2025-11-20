// services/leads.service.ts
import { PrismaClient, LeadStatus, Locale } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { CreateLeadDto, UpdateLeadDto, LeadResponse } from '../types/leads.types';
import { EmailService } from './email.service';

export class LeadsService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService
  ) { }

  async create(dto: CreateLeadDto): Promise<LeadResponse> {
    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        source: dto.source ?? 'contact_form',
        status: 'NEW',
        locale: (dto.locale as any) || 'EN', // Store user's language preference
        metadata: dto.metadata,
      },
    });

    // Send notification email (async, don't wait for it)
    this.emailService.sendContactFormNotification(lead).catch((error) => {
      // Error is logged in email service, just prevent unhandled rejection
    });

    return this.mapToResponse(lead);
  }

  async getAll(skip?: number, take?: number): Promise<{ data: LeadResponse[]; total: number }> {
    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.lead.count(),
    ]);

    return {
      data: leads.map(this.mapToResponse),
      total,
    };
  }

  async getById(id: string): Promise<LeadResponse> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    return this.mapToResponse(lead);
  }

  async update(id: string, dto: UpdateLeadDto): Promise<LeadResponse> {
    const existing = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Lead');
    }

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });

    return this.mapToResponse(lead);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Lead');
    }

    await this.prisma.lead.delete({
      where: { id },
    });
  }

  async exportToCSV(): Promise<string> {
    const leads = await this.prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const csvData = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      message: lead.message,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }));

    const { convertToCSV } = await import('../utils/csv');
    return convertToCSV(csvData);
  }

  private mapToResponse(lead: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    status: LeadStatus;
    source: string;
    locale: Locale;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
  }): LeadResponse {
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? undefined,
      message: lead.message,
      status: lead.status,
      source: lead.source,
      locale: lead.locale,
      metadata: lead.metadata as Record<string, any> | undefined,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }
}

