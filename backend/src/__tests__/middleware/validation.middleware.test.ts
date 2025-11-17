// __tests__/middleware/validation.middleware.test.ts
import { Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { z } from 'zod';
import { ValidationError } from '../../utils/errors';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should pass validation for valid data', () => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });

    mockRequest.body = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body).toEqual({
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should throw ValidationError for invalid data', () => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });

    mockRequest.body = {
      email: 'invalid-email',
      name: 'A', // Too short
    };

    const middleware = validate(schema);
    
    expect(() => {
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(ValidationError);
  });
});

