// __tests__/services/meetings.service.test.ts
import { MeetingsService } from '../../services/meetings.service';
import { EmailService } from '../../services/email.service';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../../utils/errors';

jest.mock('../../services/email.service');

describe('MeetingsService', () => {
  let meetingsService: MeetingsService;
  let mockPrisma: any;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockPrisma = {
      meeting: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      meetingAvailability: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    mockEmailService = {
      sendMeetingConfirmation: jest.fn().mockResolvedValue(undefined),
    } as any;

    meetingsService = new MeetingsService(mockPrisma as any, mockEmailService);
  });

  describe('bookMeeting', () => {
    it('should book meeting if slot is available', async () => {
      const mockMeeting = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        scheduledAt: new Date('2024-12-01T10:00:00Z'),
        duration: 30,
        status: 'CONFIRMED',
      };

      mockPrisma.meetingAvailability.findFirst.mockResolvedValue({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      });
      mockPrisma.meeting.findFirst.mockResolvedValue(null); // No conflicts
      mockPrisma.meeting.create.mockResolvedValue(mockMeeting);

      const result = await meetingsService.bookMeeting({
        email: 'test@example.com',
        name: 'Test User',
        scheduledAt: '2024-12-01T10:00:00Z',
        duration: 30,
        timezone: 'UTC',
      });

      expect(result).toHaveProperty('id');
      expect(mockEmailService.sendMeetingConfirmation).toHaveBeenCalled();
    });

    it('should throw ValidationError if slot not available', async () => {
      mockPrisma.meetingAvailability.findFirst.mockResolvedValue(null);

      await expect(
        meetingsService.bookMeeting({
          email: 'test@example.com',
          name: 'Test User',
          scheduledAt: '2024-12-01T10:00:00Z',
          duration: 30,
          timezone: 'UTC',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots', async () => {
      mockPrisma.meetingAvailability.findMany.mockResolvedValue([
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
      ]);
      mockPrisma.meeting.findMany.mockResolvedValue([]);

      const result = await meetingsService.getAvailableSlots(
        '2024-12-01',
        '2024-12-07'
      );

      expect(result).toBeInstanceOf(Array);
    });
  });
});

