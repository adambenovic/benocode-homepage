// __tests__/controllers/auth.controller.test.ts
import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { UnauthorizedError } from '../../utils/errors';

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockAuthService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
      getCurrentUser: jest.fn(),
    } as any;

    authController = new AuthController(mockAuthService as any);

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
      };

      mockAuthService.login.mockResolvedValue(mockTokens);
      mockRequest.body = { email: 'test@example.com', password: 'password' };

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: mockTokens });
    });

    it('should call next with error on failure', async () => {
      const error = new UnauthorizedError();
      mockAuthService.login.mockRejectedValue(error);
      mockRequest.body = { email: 'test@example.com', password: 'wrong' };

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

