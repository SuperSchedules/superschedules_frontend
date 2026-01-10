// SSE (Server-Sent Events) streaming types for chat

/**
 * Error codes for SSE stream errors
 * Used to classify errors and determine appropriate recovery actions
 */
export enum SSEErrorCode {
  // Auth errors - may require user action
  TOKEN_EXPIRED = 'token_expired',       // 401 - can attempt token refresh
  AUTH_FAILED = 'auth_failed',           // 403 - non-recoverable, redirect to login

  // Transient errors - can retry with backoff
  NETWORK_ERROR = 'network_error',       // Network connectivity issues
  SERVER_ERROR = 'server_error',         // 5xx server errors
  TIMEOUT = 'timeout',                   // Request or stream timeout

  // Stream-specific errors
  STREAM_INTERRUPTED = 'stream_interrupted',  // Stream ended unexpectedly
  PARSE_ERROR = 'parse_error',               // Failed to parse SSE data
}

/**
 * Structured error type for SSE streams
 */
export interface SSEError {
  code: SSEErrorCode;
  message: string;
  retryable: boolean;
  httpStatus?: number;
  originalError?: unknown;
}

/**
 * State for tracking reconnection attempts
 */
export interface ReconnectionState {
  attempt: number;           // Current attempt number (1-based)
  maxAttempts: number;       // Maximum attempts before giving up
  nextRetryMs: number;       // Milliseconds until next retry
  isReconnecting: boolean;   // Whether actively reconnecting
}

/**
 * Configuration for exponential backoff reconnection
 */
export interface ReconnectionConfig {
  initialDelayMs: number;    // First retry delay (default: 1000)
  maxDelayMs: number;        // Maximum delay cap (default: 30000)
  backoffMultiplier: number; // Multiplier per attempt (default: 2)
  maxAttempts: number;       // Max retries before giving up (default: 5)
  jitterPercent: number;     // Random jitter to add (default: 0.2 = 20%)
}

/**
 * Default reconnection configuration
 */
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  maxAttempts: 5,
  jitterPercent: 0.2,
};

/**
 * Options for streaming chat with reconnection support
 */
export interface StreamingChatOptions {
  /** Called when a reconnection attempt starts */
  onReconnecting?: (state: ReconnectionState) => void;
  /** Called when reconnection succeeds */
  onReconnected?: () => void;
  /** Called when authentication fails and user must log in again */
  onAuthRequired?: () => void;
  /** Custom reconnection configuration */
  reconnectionConfig?: Partial<ReconnectionConfig>;
}

/**
 * Calculate the next retry delay using exponential backoff with jitter
 */
export function calculateRetryDelay(
  attempt: number,
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG
): number {
  const baseDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelayMs
  );
  const jitter = baseDelay * config.jitterPercent * (Math.random() * 2 - 1);
  return Math.round(baseDelay + jitter);
}

/**
 * Create initial reconnection state
 */
export function createInitialReconnectionState(
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG
): ReconnectionState {
  return {
    attempt: 0,
    maxAttempts: config.maxAttempts,
    nextRetryMs: config.initialDelayMs,
    isReconnecting: false,
  };
}
