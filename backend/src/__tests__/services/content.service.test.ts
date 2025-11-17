// __tests__/services/content.service.test.ts
import { ContentService } from '../../services/content.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors';

describe('ContentService', () => {
  let contentService: ContentService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      content: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      contentTranslation: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    contentService = new ContentService(mockPrisma as any);
  });

  describe('getAll', () => {
    it('should return content list with pagination', async () => {
      const mockContents = [
        {
          id: '1',
          key: 'test.key',
          type: 'TEXT',
          translations: [{ locale: 'EN', value: 'Test' }],
        },
      ];

      mockPrisma.content.findMany.mockResolvedValue(mockContents);
      mockPrisma.content.count.mockResolvedValue(1);

      const result = await contentService.getAll('EN', 0, 10);

      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBe(1);
    });
  });

  describe('getByKey', () => {
    it('should return content if found', async () => {
      const mockContent = {
        id: '1',
        key: 'test.key',
        type: 'TEXT',
        translations: [{ locale: 'EN', value: 'Test' }],
      };

      mockPrisma.content.findUnique.mockResolvedValue(mockContent);

      const result = await contentService.getByKey('test.key', 'EN');

      expect(result).toHaveProperty('key', 'test.key');
    });

    it('should return null if not found', async () => {
      mockPrisma.content.findUnique.mockResolvedValue(null);

      const result = await contentService.getByKey('nonexistent.key', 'EN');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create content with translations', async () => {
      const mockContent = {
        id: '1',
        key: 'new.key',
        type: 'TEXT',
      };

      mockPrisma.content.create.mockResolvedValue(mockContent);
      mockPrisma.contentTranslation.createMany.mockResolvedValue({});

      await contentService.create({
        key: 'new.key',
        type: 'TEXT',
        translations: [{ locale: 'EN', value: 'New content' }],
      });

      expect(mockPrisma.content.create).toHaveBeenCalled();
      expect(mockPrisma.contentTranslation.createMany).toHaveBeenCalled();
    });
  });
});

