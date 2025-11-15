/**
 * Base domain error class
 */
export class DomainError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id "${id}" not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
  readonly fields?: Record<string, string>;

  constructor(
    message: string,
    fields?: Record<string, string>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when user is not authorized
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error thrown when user doesn't have permission
 */
export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error thrown when a conflict occurs (e.g., duplicate resource)
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

