// __tests__/controllers/content.controller.test.ts
import { Request, Response, NextFunction } from 'express';
import { ContentController } from '../../controllers/content.controller';
import { ContentService } from '../../services/content.service';
import { NotFoundError } from '../../utils/errors';

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
    } as any;

    contentController = new ContentController(mockContentService);

    mockRequest = {
      query: {},
      params: {},
      body: {},
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getAll', () => {
    it('should return content list', async () => {
      mockContentService.getAll.mockResolvedValue({
        data: [{ id: '1', key: 'test.key' }],
        total: 1,
      });

      await contentController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('getByKey', () => {
    it('should return content if found', async () => {
      mockRequest.params = { key: 'test.key' };
      mockContentService.getByKey.mockResolvedValue({
        id: '1',
        key: 'test.key',
        type: 'TEXT',
        translations: [],
      });

      await contentController.getByKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 404 if not found', async () => {
      mockRequest.params = { key: 'nonexistent.key' };
      mockContentService.getByKey.mockResolvedValue(null);

      await contentController.getByKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});

