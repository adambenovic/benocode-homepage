// __tests__/services/leads.service.test.ts
import { LeadsService } from '../../services/leads.service';
import { EmailService } from '../../services/email.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

jest.mock('../../services/email.service');

describe('LeadsService', () => {
  let leadsService: LeadsService;
  let mockPrisma: any;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockPrisma = {
      lead: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    mockEmailService = {
      sendContactFormNotification: jest.fn().mockResolvedValue(undefined),
    } as any;

    leadsService = new LeadsService(mockPrisma as any, mockEmailService);
  });

  describe('create', () => {
    it('should create a lead successfully', async () => {
      const mockLead = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.lead.create.mockResolvedValue(mockLead);

      const result = await leadsService.create({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      });

      expect(result).toHaveProperty('id');
      expect(mockEmailService.sendContactFormNotification).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return lead if found', async () => {
      const mockLead = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);

      const result = await leadsService.getById('1');

      expect(result).toHaveProperty('id', '1');
    });

    it('should throw NotFoundError if lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(leadsService.getById('1')).rejects.toThrow(NotFoundError);
    });
  });
});

