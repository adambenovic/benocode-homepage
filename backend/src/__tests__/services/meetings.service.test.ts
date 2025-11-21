// __tests__/services/meetings.service.test.ts
import { MeetingsService } from '../../services/meetings.service';
import { EmailService } from '../../services/email.service';
import { ValidationError } from '../../utils/errors';

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

  describe('create', () => {
    it('should throw ValidationError if time is in the past', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      await expect(
        meetingsService.create({
          email: 'test@example.com',
          name: 'Test User',
          scheduledAt: pastDate.toISOString(),
          duration: 30,
          timezone: 'UTC',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getAvailability', () => {
    it('should return available slots', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      mockPrisma.meetingAvailability.findMany.mockResolvedValue([
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
      ]);
      mockPrisma.meeting.findMany.mockResolvedValue([]);

      const result = await meetingsService.getAvailability(
        startDate,
        endDate
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
