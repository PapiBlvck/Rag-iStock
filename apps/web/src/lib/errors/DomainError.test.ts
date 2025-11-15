import { describe, it, expect } from 'vitest';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './DomainError';

describe('DomainError', () => {
  describe('DomainError', () => {
    it('should create DomainError with message and code', () => {
      const error = new DomainError('Test error', 'TEST_ERROR', 400);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('DomainError');
    });

    it('should have default statusCode of 500', () => {
      const error = new DomainError('Test error', 'TEST_ERROR');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with resource name', () => {
      const error = new NotFoundError('Resource');

      expect(error.message).toContain('Resource');
      expect(error.message).toContain('not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create NotFoundError with resource name and id', () => {
      const error = new NotFoundError('Resource', 'id123');

      expect(error.message).toContain('Resource');
      expect(error.message).toContain('id123');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with message', () => {
      const error = new ValidationError('Validation failed');

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with fields', () => {
      const fields = { email: 'Invalid email', password: 'Too short' };
      const error = new ValidationError('Validation failed', fields);

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.fields).toEqual(fields);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized access');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Not authorized');

      expect(error.message).toBe('Not authorized');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access forbidden');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Custom forbidden message');

      expect(error.message).toBe('Custom forbidden message');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with message', () => {
      const error = new ConflictError('Resource conflict');

      expect(error.message).toBe('Resource conflict');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });
});

