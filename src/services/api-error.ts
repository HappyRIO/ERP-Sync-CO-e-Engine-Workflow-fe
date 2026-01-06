// API Error Types and Utilities

export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  BAD_REQUEST = 'BAD_REQUEST',
}

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    message: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error simulation configuration
export interface ErrorSimulationConfig {
  enabled: boolean;
  errorRate: number; // 0-1, probability of error
  errorType?: ApiErrorType;
  delay?: number; // Additional delay before error
}

// Get error simulation config from localStorage or defaults
export function getErrorSimulationConfig(serviceName: string): ErrorSimulationConfig {
  // Only read from localStorage in development
  if (process.env.NODE_ENV !== 'development') {
    return {
      enabled: false,
      errorRate: 0,
    };
  }
  
  const stored = localStorage.getItem(`error_sim_${serviceName}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid JSON, use defaults
    }
  }
  return {
    enabled: false,
    errorRate: 0,
  };
}

// Simulate errors based on configuration
export async function simulateError(
  serviceName: string,
  operation: string,
  defaultDelay: number = 0
): Promise<never> {
  const config = getErrorSimulationConfig(serviceName);
  
  if (!config.enabled) {
    // Still apply delay if configured
    if (config.delay) {
      await delay(config.delay);
    }
    // No error simulation, but we still throw to simulate
    // This should not be reached if enabled is false
    throw new ApiError(
      ApiErrorType.NETWORK_ERROR,
      'Network request failed. Please check your connection.',
      0
    );
  }

  // Apply delay if configured
  const delayMs = config.delay ?? defaultDelay;
  if (delayMs > 0) {
    await delay(delayMs);
  }

  // Random chance based on error rate
  if (Math.random() > config.errorRate) {
    // No error this time, but we still need to throw to simulate
    // This is handled by the caller
    return;
  }

  // Determine error type
  const errorType = config.errorType || getRandomErrorType();
  const error = createError(errorType, operation);
  throw error;
}

// Create appropriate error based on type
function createError(type: ApiErrorType, operation: string): ApiError {
  switch (type) {
    case ApiErrorType.NETWORK_ERROR:
      return new ApiError(
        type,
        'Network request failed. Please check your connection and try again.',
        0,
        { operation }
      );
    
    case ApiErrorType.VALIDATION_ERROR:
      return new ApiError(
        type,
        'Invalid input data. Please check your form and try again.',
        400,
        { operation }
      );
    
    case ApiErrorType.NOT_FOUND:
      return new ApiError(
        type,
        'The requested resource was not found.',
        404,
        { operation }
      );
    
    case ApiErrorType.UNAUTHORIZED:
      return new ApiError(
        type,
        'You are not authorized to perform this action. Please log in.',
        401,
        { operation }
      );
    
    case ApiErrorType.FORBIDDEN:
      return new ApiError(
        type,
        'You do not have permission to access this resource.',
        403,
        { operation }
      );
    
    case ApiErrorType.RATE_LIMIT:
      return new ApiError(
        type,
        'Too many requests. Please wait a moment and try again.',
        429,
        { operation, retryAfter: 60 }
      );
    
    case ApiErrorType.SERVER_ERROR:
      return new ApiError(
        type,
        'Server error occurred. Please try again later.',
        500,
        { operation }
      );
    
    case ApiErrorType.TIMEOUT:
      return new ApiError(
        type,
        'Request timed out. Please try again.',
        408,
        { operation }
      );
    
    case ApiErrorType.BAD_REQUEST:
      return new ApiError(
        type,
        'Invalid request. Please check your input and try again.',
        400,
        { operation }
      );
    
    default:
      return new ApiError(
        ApiErrorType.SERVER_ERROR,
        'An unexpected error occurred.',
        500,
        { operation }
      );
  }
}

// Get random error type for variety
function getRandomErrorType(): ApiErrorType {
  const types = [
    ApiErrorType.NETWORK_ERROR,
    ApiErrorType.SERVER_ERROR,
    ApiErrorType.VALIDATION_ERROR,
    ApiErrorType.TIMEOUT,
  ];
  return types[Math.floor(Math.random() * types.length)];
}

// Delay utility
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error should be simulated (for conditional error throwing)
export function shouldSimulateError(serviceName: string): boolean {
  // Only enable error simulation in development
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  const config = getErrorSimulationConfig(serviceName);
  if (!config.enabled) return false;
  return Math.random() <= config.errorRate;
}

