import { SSEError, SSEErrorCode } from '../types/streaming';

/**
 * Map of error codes to human-readable messages
 */
const ERROR_MESSAGES: Record<SSEErrorCode, string> = {
  [SSEErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Refreshing...',
  [SSEErrorCode.AUTH_FAILED]: 'Authentication failed. Please sign in again.',
  [SSEErrorCode.NETWORK_ERROR]: 'Network connection lost. Retrying...',
  [SSEErrorCode.SERVER_ERROR]: 'Server error. Retrying...',
  [SSEErrorCode.TIMEOUT]: 'Request timed out. Retrying...',
  [SSEErrorCode.STREAM_INTERRUPTED]: 'Connection interrupted. Retrying...',
  [SSEErrorCode.PARSE_ERROR]: 'Failed to process response. Retrying...',
};

/**
 * User-friendly error messages shown after all retries fail
 */
export const FINAL_ERROR_MESSAGES: Record<SSEErrorCode, string> = {
  [SSEErrorCode.TOKEN_EXPIRED]: 'Session expired. Please refresh the page and try again.',
  [SSEErrorCode.AUTH_FAILED]: 'Please sign in again to continue.',
  [SSEErrorCode.NETWORK_ERROR]: 'Unable to connect. Please check your internet connection.',
  [SSEErrorCode.SERVER_ERROR]: 'The server is experiencing issues. Please try again later.',
  [SSEErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
  [SSEErrorCode.STREAM_INTERRUPTED]: 'Connection was lost. Please try again.',
  [SSEErrorCode.PARSE_ERROR]: 'Something went wrong. Please try again.',
};

/**
 * Check if an error is retryable
 */
export function isRetryableError(code: SSEErrorCode): boolean {
  const nonRetryable = [SSEErrorCode.AUTH_FAILED];
  return !nonRetryable.includes(code);
}

/**
 * Check if an error requires token refresh before retry
 */
export function requiresTokenRefresh(code: SSEErrorCode): boolean {
  return code === SSEErrorCode.TOKEN_EXPIRED;
}

/**
 * Check if an error requires redirecting to login
 */
export function requiresLogin(code: SSEErrorCode): boolean {
  return code === SSEErrorCode.AUTH_FAILED;
}

/**
 * Classify an error into a structured SSEError.
 * Handles various error types including HTTP status codes, network errors,
 * and structured backend error responses.
 *
 * @param error - The caught error (unknown type)
 * @param httpStatus - Optional HTTP status code if available
 * @returns Classified SSEError with code, message, and retryable flag
 */
export function classifyError(
  error: unknown,
  httpStatus?: number
): SSEError {
  // Check for structured error from backend with error code
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;

    // Backend may send structured error with 'code' field
    if (typeof errObj.code === 'string') {
      if (errObj.code === 'token_expired' || errObj.code === 'TOKEN_EXPIRED') {
        return {
          code: SSEErrorCode.TOKEN_EXPIRED,
          message: ERROR_MESSAGES[SSEErrorCode.TOKEN_EXPIRED],
          retryable: true,
          httpStatus,
          originalError: error,
        };
      }
      if (errObj.code === 'auth_failed' || errObj.code === 'AUTH_FAILED') {
        return {
          code: SSEErrorCode.AUTH_FAILED,
          message: ERROR_MESSAGES[SSEErrorCode.AUTH_FAILED],
          retryable: false,
          httpStatus,
          originalError: error,
        };
      }
    }

    // Check for error message containing keywords
    const errorMessage = String(errObj.message || errObj.error || '').toLowerCase();
    if (errorMessage.includes('token') && errorMessage.includes('expired')) {
      return {
        code: SSEErrorCode.TOKEN_EXPIRED,
        message: ERROR_MESSAGES[SSEErrorCode.TOKEN_EXPIRED],
        retryable: true,
        httpStatus,
        originalError: error,
      };
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('not authenticated')) {
      return {
        code: SSEErrorCode.TOKEN_EXPIRED,
        message: ERROR_MESSAGES[SSEErrorCode.TOKEN_EXPIRED],
        retryable: true,
        httpStatus,
        originalError: error,
      };
    }
  }

  // Classify by HTTP status code
  if (httpStatus !== undefined) {
    if (httpStatus === 401) {
      return {
        code: SSEErrorCode.TOKEN_EXPIRED,
        message: ERROR_MESSAGES[SSEErrorCode.TOKEN_EXPIRED],
        retryable: true,
        httpStatus,
        originalError: error,
      };
    }
    if (httpStatus === 403) {
      return {
        code: SSEErrorCode.AUTH_FAILED,
        message: ERROR_MESSAGES[SSEErrorCode.AUTH_FAILED],
        retryable: false,
        httpStatus,
        originalError: error,
      };
    }
    // Check timeout codes before general 5xx (504 is a timeout, not server error)
    if (httpStatus === 408 || httpStatus === 504) {
      return {
        code: SSEErrorCode.TIMEOUT,
        message: ERROR_MESSAGES[SSEErrorCode.TIMEOUT],
        retryable: true,
        httpStatus,
        originalError: error,
      };
    }
    if (httpStatus >= 500 && httpStatus < 600) {
      return {
        code: SSEErrorCode.SERVER_ERROR,
        message: ERROR_MESSAGES[SSEErrorCode.SERVER_ERROR],
        retryable: true,
        httpStatus,
        originalError: error,
      };
    }
  }

  // Check for network errors (TypeError from fetch)
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('failed to fetch')
    ) {
      return {
        code: SSEErrorCode.NETWORK_ERROR,
        message: ERROR_MESSAGES[SSEErrorCode.NETWORK_ERROR],
        retryable: true,
        originalError: error,
      };
    }
  }

  // Check for AbortError (usually user-initiated or timeout)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: SSEErrorCode.TIMEOUT,
      message: ERROR_MESSAGES[SSEErrorCode.TIMEOUT],
      retryable: true,
      originalError: error,
    };
  }

  // Check for timeout errors by message content
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout')) {
      return {
        code: SSEErrorCode.TIMEOUT,
        message: ERROR_MESSAGES[SSEErrorCode.TIMEOUT],
        retryable: true,
        originalError: error,
      };
    }
  }

  // Default to stream interrupted (generic retryable error)
  return {
    code: SSEErrorCode.STREAM_INTERRUPTED,
    message: ERROR_MESSAGES[SSEErrorCode.STREAM_INTERRUPTED],
    retryable: true,
    originalError: error,
  };
}

/**
 * Get a user-friendly error message for display.
 *
 * @param error - The SSE error
 * @param isFinal - Whether this is after all retries have been exhausted
 * @returns Human-readable error message
 */
export function getErrorMessage(error: SSEError, isFinal = false): string {
  if (isFinal) {
    return FINAL_ERROR_MESSAGES[error.code];
  }
  return error.message;
}

/**
 * Parse an SSE error response from the backend.
 * The backend may send structured JSON errors in the stream.
 *
 * @param data - Raw data from SSE event
 * @returns Classified error, or null if not an error
 */
export function parseSSEErrorData(data: string): SSEError | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.error || parsed.code) {
      return classifyError(parsed, parsed.status);
    }
    return null;
  } catch {
    return null;
  }
}
