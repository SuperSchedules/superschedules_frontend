import { describe, it, expect } from 'vitest';
import {
  classifyError,
  getErrorMessage,
  isRetryableError,
  requiresTokenRefresh,
  requiresLogin,
  parseSSEErrorData,
  FINAL_ERROR_MESSAGES,
} from '../../utils/sseErrorClassifier';
import { SSEErrorCode } from '../../types/streaming';

describe('sseErrorClassifier', () => {
  describe('classifyError', () => {
    describe('backend structured errors', () => {
      it('identifies token_expired from backend code', () => {
        const error = { code: 'token_expired', message: 'Token has expired' };
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.TOKEN_EXPIRED);
        expect(result.retryable).toBe(true);
      });

      it('identifies TOKEN_EXPIRED (uppercase)', () => {
        const error = { code: 'TOKEN_EXPIRED' };
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.TOKEN_EXPIRED);
      });

      it('identifies auth_failed from backend code', () => {
        const error = { code: 'auth_failed' };
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.AUTH_FAILED);
        expect(result.retryable).toBe(false);
      });

      it('identifies token expired from message content', () => {
        const error = { message: 'Token has expired' };
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.TOKEN_EXPIRED);
      });

      it('identifies unauthorized from message', () => {
        const error = { message: 'User is not authenticated' };
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.TOKEN_EXPIRED);
      });
    });

    describe('HTTP status code classification', () => {
      it('classifies 401 as token_expired', () => {
        const result = classifyError({}, 401);

        expect(result.code).toBe(SSEErrorCode.TOKEN_EXPIRED);
        expect(result.httpStatus).toBe(401);
        expect(result.retryable).toBe(true);
      });

      it('classifies 403 as auth_failed', () => {
        const result = classifyError({}, 403);

        expect(result.code).toBe(SSEErrorCode.AUTH_FAILED);
        expect(result.httpStatus).toBe(403);
        expect(result.retryable).toBe(false);
      });

      it('classifies 500 as server_error', () => {
        const result = classifyError({}, 500);

        expect(result.code).toBe(SSEErrorCode.SERVER_ERROR);
        expect(result.retryable).toBe(true);
      });

      it('classifies 502 as server_error', () => {
        const result = classifyError({}, 502);

        expect(result.code).toBe(SSEErrorCode.SERVER_ERROR);
      });

      it('classifies 504 as timeout', () => {
        const result = classifyError({}, 504);

        expect(result.code).toBe(SSEErrorCode.TIMEOUT);
        expect(result.retryable).toBe(true);
      });

      it('classifies 408 as timeout', () => {
        const result = classifyError({}, 408);

        expect(result.code).toBe(SSEErrorCode.TIMEOUT);
      });
    });

    describe('network errors', () => {
      it('identifies fetch TypeError as network error', () => {
        const error = new TypeError('Failed to fetch');
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.NETWORK_ERROR);
        expect(result.retryable).toBe(true);
      });

      it('identifies network TypeError as network error', () => {
        const error = new TypeError('Network request failed');
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.NETWORK_ERROR);
      });
    });

    describe('timeout errors', () => {
      it('identifies AbortError as timeout', () => {
        const error = new DOMException('Aborted', 'AbortError');
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.TIMEOUT);
        expect(result.retryable).toBe(true);
      });

      it('identifies timeout in error message', () => {
        const error = new Error('Request timeout exceeded');
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.TIMEOUT);
      });
    });

    describe('default classification', () => {
      it('defaults to stream_interrupted for unknown errors', () => {
        const error = new Error('Something went wrong');
        const result = classifyError(error);

        expect(result.code).toBe(SSEErrorCode.STREAM_INTERRUPTED);
        expect(result.retryable).toBe(true);
      });

      it('preserves original error', () => {
        const originalError = new Error('Original');
        const result = classifyError(originalError);

        expect(result.originalError).toBe(originalError);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('returns standard message for non-final errors', () => {
      const error = {
        code: SSEErrorCode.NETWORK_ERROR,
        message: 'Network connection lost. Retrying...',
        retryable: true,
      };

      const message = getErrorMessage(error, false);
      expect(message).toBe('Network connection lost. Retrying...');
    });

    it('returns final message when isFinal is true', () => {
      const error = {
        code: SSEErrorCode.NETWORK_ERROR,
        message: 'Network connection lost. Retrying...',
        retryable: true,
      };

      const message = getErrorMessage(error, true);
      expect(message).toBe(FINAL_ERROR_MESSAGES[SSEErrorCode.NETWORK_ERROR]);
    });
  });

  describe('isRetryableError', () => {
    it('returns true for network errors', () => {
      expect(isRetryableError(SSEErrorCode.NETWORK_ERROR)).toBe(true);
    });

    it('returns true for server errors', () => {
      expect(isRetryableError(SSEErrorCode.SERVER_ERROR)).toBe(true);
    });

    it('returns true for token_expired', () => {
      expect(isRetryableError(SSEErrorCode.TOKEN_EXPIRED)).toBe(true);
    });

    it('returns false for auth_failed', () => {
      expect(isRetryableError(SSEErrorCode.AUTH_FAILED)).toBe(false);
    });
  });

  describe('requiresTokenRefresh', () => {
    it('returns true for token_expired', () => {
      expect(requiresTokenRefresh(SSEErrorCode.TOKEN_EXPIRED)).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(requiresTokenRefresh(SSEErrorCode.AUTH_FAILED)).toBe(false);
      expect(requiresTokenRefresh(SSEErrorCode.NETWORK_ERROR)).toBe(false);
    });
  });

  describe('requiresLogin', () => {
    it('returns true for auth_failed', () => {
      expect(requiresLogin(SSEErrorCode.AUTH_FAILED)).toBe(true);
    });

    it('returns false for token_expired', () => {
      expect(requiresLogin(SSEErrorCode.TOKEN_EXPIRED)).toBe(false);
    });

    it('returns false for other errors', () => {
      expect(requiresLogin(SSEErrorCode.NETWORK_ERROR)).toBe(false);
    });
  });

  describe('parseSSEErrorData', () => {
    it('parses JSON error with code', () => {
      const data = JSON.stringify({ code: 'token_expired', error: 'Session expired' });
      const result = parseSSEErrorData(data);

      expect(result).not.toBeNull();
      expect(result?.code).toBe(SSEErrorCode.TOKEN_EXPIRED);
    });

    it('parses JSON error with error field', () => {
      const data = JSON.stringify({ error: 'Something went wrong' });
      const result = parseSSEErrorData(data);

      expect(result).not.toBeNull();
    });

    it('returns null for non-error JSON', () => {
      const data = JSON.stringify({ token: 'hello', done: false });
      const result = parseSSEErrorData(data);

      expect(result).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      const data = 'not valid json';
      const result = parseSSEErrorData(data);

      expect(result).toBeNull();
    });
  });
});
