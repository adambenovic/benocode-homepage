// services/consent.service.ts
import { PrismaClient } from '@prisma/client';

export interface ConsentData {
  userId?: string;
  email?: string;
  consent: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export class ConsentService {
  constructor(private prisma: PrismaClient) {}

  async recordConsent(data: ConsentData): Promise<void> {
    await this.prisma.cookieConsent.create({
      data: {
        userId: data.userId || null,
        email: data.email || null,
        consent: data.consent,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  }

  async getConsentHistory(userId?: string, email?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    } else if (email) {
      where.email = email;
    }

    return this.prisma.cookieConsent.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}

