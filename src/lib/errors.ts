/**
 * Custom error classes for structured error handling
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, true, { resource, identifier });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, true, context);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', context?: Record<string, unknown>) {
    super(message, 500, false, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, unknown>) {
    super(`External service error (${service}): ${message}`, 502, true, { service, ...context });
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  context?: Record<string, unknown>;
  stack?: string;
}

export function formatErrorResponse(error: Error, includeStack: boolean = false): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
      ...(includeStack && { stack: error.stack }),
    };
  }

  return {
    error: 'InternalError',
    message: error.message || 'An unexpected error occurred',
    statusCode: 500,
    ...(includeStack && { stack: error.stack }),
  };
}

/**
 * Type guard for operational errors
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
