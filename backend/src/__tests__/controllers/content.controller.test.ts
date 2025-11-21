// __tests__/controllers/content.controller.test.ts
import { Request, Response, NextFunction } from 'express';
import { ContentController } from '../../controllers/content.controller';
import { ContentService } from '../../services/content.service';

describe('ContentController', () => {
  let contentController: ContentController;
  let mockContentService: jest.Mocked<ContentService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockContentService = {
      getAll: jest.fn(),
      getByKey: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    contentController = new ContentController(mockContentService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getAll', () => {
    it('should return all content items', async () => {
      const mockContentData = [
        {
          id: '1',
          key: 'test.key',
          type: 'TEXT' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          translations: [
            {
              id: '1',
              contentId: '1',
              locale: 'EN' as const,
              value: 'Test',
            },
          ],
        },
      ];

      mockContentService.getAll.mockResolvedValue({ data: mockContentData, total: 1 });

      await contentController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContentService.getAll).toHaveBeenCalled();
    });
  });

  describe('getByKey', () => {
    it('should return content by key', async () => {
      const mockContent = {
        id: '1',
        key: 'test.key',
        type: 'TEXT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
      };

      mockRequest.params = { key: 'test.key' };
      mockContentService.getByKey.mockResolvedValue(mockContent);

      await contentController.getByKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContentService.getByKey).toHaveBeenCalledWith('test.key', undefined);
    });
  });
});
