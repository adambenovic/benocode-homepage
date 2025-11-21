// __tests__/services/content.service.test.ts
import { ContentService } from '../../services/content.service';
import { PrismaClient } from '@prisma/client';

describe('ContentService', () => {
  let contentService: ContentService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      content: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      contentTranslation: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    contentService = new ContentService(mockPrisma as any);
  });

  describe('create', () => {
    it('should create content with translations', async () => {
      const mockContent = {
        id: '1',
        key: 'test.key',
        type: 'TEXT',
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [
          {
            id: '1',
            contentId: '1',
            locale: 'EN',
            value: 'Test value',
          },
        ],
      };

      mockPrisma.content.create.mockResolvedValue(mockContent);

      const result = await contentService.create({
        key: 'test.key',
        type: 'TEXT',
        translations: [
          { locale: 'EN', value: 'Test value' },
        ],
      });

      expect(result).toHaveProperty('id');
      expect(result.key).toBe('test.key');
    });
  });

  describe('getAll', () => {
    it('should return all content items', async () => {
      const mockContent = [
        {
          id: '1',
          key: 'test.key',
          type: 'TEXT',
          createdAt: new Date(),
          updatedAt: new Date(),
          translations: [],
        },
      ];

      mockPrisma.content.findMany.mockResolvedValue(mockContent);
      mockPrisma.content.count.mockResolvedValue(1);

      const result = await contentService.getAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
