import { AuthFetch, ChatContext } from '../types/index';
import { EVENTS_ENDPOINTS, STREAMING_API_BASE_URL } from '../constants/api';
import {
  SSEError,
  SSEErrorCode,
  ReconnectionState,
  StreamingChatOptions,
  DEFAULT_RECONNECTION_CONFIG,
  calculateRetryDelay,
  createInitialReconnectionState,
} from '../types/streaming';
import {
  classifyError,
  getErrorMessage,
  requiresTokenRefresh,
  requiresLogin,
} from '../utils/sseErrorClassifier';

export interface StreamingChatService {
  startChatStream(
    message: string,
    onModelAToken: (token: string, done: boolean, metadata?: any) => void,
    onModelBToken: (token: string, done: boolean, metadata?: any) => void,
    onError: (error: string) => void,
    context?: Partial<ChatContext>,
    singleModelMode?: boolean,
    options?: StreamingChatOptions
  ): () => void; // Returns cleanup function
}

export class FastAPIStreamingChatService implements StreamingChatService {
  private authFetch: AuthFetch;
  private baseURL: string;

  constructor(authFetch: AuthFetch, baseURL = STREAMING_API_BASE_URL) {
    this.authFetch = authFetch;
    this.baseURL = baseURL;
  }

    startChatStream(
      message: string,
      onModelAToken: (token: string, done: boolean, metadata?: any) => void,
      onModelBToken: (token: string, done: boolean, metadata?: any) => void,
      onError: (error: string) => void,
      context: Partial<ChatContext> = {},
      singleModelMode: boolean = true,
      options: StreamingChatOptions = {}
    ): () => void {
      let isActive = true;
      let controller = new AbortController();
      const config = { ...DEFAULT_RECONNECTION_CONFIG, ...options.reconnectionConfig };
      let reconnectionState = createInitialReconnectionState(config);

    const attemptStream = async (): Promise<boolean> => {
      try {
        // Get the auth token
        const token = await this.getAuthToken();
        if (import.meta.env.DEV) {
          console.log('Starting chat stream with token:', token ? 'Token present' : 'No token');
        }

        // Use fetch with streaming (Server-Sent Events)
        const response = await fetch(`${this.baseURL}/api/v1/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
          },
          signal: controller.signal,
          body: JSON.stringify({
            message,
            context,
            single_model_mode: singleModelMode,
            preferred_model: 'llama3.2:3b', // Use 3B model for single mode
            chat_history: context.chat_history || [],
            debug: context.debug || false,
            // location_id must be at top level (not in context) per backend schema
            location_id: context.location_id || null,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Chat stream error:', response.status, response.statusText, errorText);
          // Classify the HTTP error
          let errorData: unknown = errorText;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            // Keep as string
          }
          const sseError = classifyError(errorData, response.status);
          throw sseError;
        }

        if (import.meta.env.DEV) {
          console.log('Chat stream response received, status:', response.status);
        }

        if (!response.body) {
          throw classifyError(new Error('No response body for streaming'));
        }

        // Reset reconnection state on successful connection
        if (reconnectionState.isReconnecting) {
          reconnectionState = createInitialReconnectionState(config);
          options.onReconnected?.();
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let eventBuffer: string[] = [];

        while (isActive) {
          const { done, value } = await reader.read();

          if (done) {
            // Flush any pending event data before exiting
            if (eventBuffer.length) {
              const payload = eventBuffer.join('\n');
              eventBuffer = [];
              try {
                const data = JSON.parse(payload);
                this.handleStreamChunk(data, onModelAToken, onModelBToken, onError);
              } catch (e) {
                if (import.meta.env.DEV) console.error('Error parsing final stream data:', e);
              }
            }
            return true; // Stream completed successfully
          }

          buffer += decoder.decode(value, { stream: true });
          // SSE parsing: events are separated by blank lines; join multiple data: lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const raw of lines) {
            const line = raw.trimEnd();
            if (line === '') {
              if (eventBuffer.length) {
                const payload = eventBuffer.join('\n');
                eventBuffer = [];
                try {
                  const data = JSON.parse(payload);
                  this.handleStreamChunk(data, onModelAToken, onModelBToken, onError);
                } catch (e) {
                  if (import.meta.env.DEV) console.error('Error parsing stream data:', e);
                }
              }
              continue;
            }
            if (line.startsWith('data:')) {
              eventBuffer.push(line.slice(5).trimStart());
            }
          }
        }
        return true; // Stream was cancelled by user
      } catch (error) {
        if (!isActive) return true; // Cancelled by user, don't retry

        // Classify the error if not already an SSEError
        const sseError: SSEError = (error as SSEError).code
          ? (error as SSEError)
          : classifyError(error);

        // Handle auth_failed - non-recoverable, redirect to login
        if (requiresLogin(sseError.code)) {
          options.onAuthRequired?.();
          onError(getErrorMessage(sseError, true));
          return true; // Don't retry
        }

        // Handle token_expired - attempt refresh and retry
        if (requiresTokenRefresh(sseError.code)) {
          if (import.meta.env.DEV) console.log('Token expired, attempting refresh before retry');
          try {
            // Force token refresh by making an authenticated request
            await this.authFetch.get(EVENTS_ENDPOINTS.list, { params: { limit: 1 } });
          } catch (refreshError) {
            // If refresh fails with auth error, redirect to login
            const refreshSseError = classifyError(refreshError);
            if (requiresLogin(refreshSseError.code)) {
              options.onAuthRequired?.();
              onError(getErrorMessage(refreshSseError, true));
              return true; // Don't retry
            }
          }
        }

        // Check if we should retry
        if (!sseError.retryable || reconnectionState.attempt >= config.maxAttempts) {
          onError(getErrorMessage(sseError, true));
          return true; // Don't retry - give up
        }

        // Prepare for retry
        reconnectionState.attempt += 1;
        reconnectionState.isReconnecting = true;
        reconnectionState.nextRetryMs = calculateRetryDelay(reconnectionState.attempt, config);

        if (import.meta.env.DEV) {
          console.log(`Reconnecting (attempt ${reconnectionState.attempt}/${config.maxAttempts}) in ${reconnectionState.nextRetryMs}ms`);
        }

        // Notify about reconnection attempt
        options.onReconnecting?.({
          attempt: reconnectionState.attempt,
          maxAttempts: config.maxAttempts,
          nextRetryMs: reconnectionState.nextRetryMs,
          isReconnecting: true,
        });

        return false; // Will retry
      }
    };

    const startStreamWithRetry = async () => {
      while (isActive) {
        const completed = await attemptStream();
        if (completed || !isActive) break;

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, reconnectionState.nextRetryMs));

        // Create new abort controller for retry
        controller = new AbortController();
      }
    };

    startStreamWithRetry();

    // Return cleanup function
      return () => {
        isActive = false;
        try {
          controller.abort();
        } catch (_error) {
          // Ignore abort errors during cleanup
        }
      };
    }

  private handleStreamChunk(
    chunk: any,
    onModelAToken: (token: string, done: boolean, metadata?: any) => void,
    onModelBToken: (token: string, done: boolean, metadata?: any) => void,
    onError: (error: string) => void
  ) {
    if (chunk.error) {
      onError(chunk.error);
      return;
    }

    const metadata = chunk.done ? {
      suggested_event_ids: chunk.suggested_event_ids || [],
      follow_up_questions: chunk.follow_up_questions || [],
      response_time_ms: chunk.response_time_ms,
      debug_run_id: chunk.debug_run_id || null,
    } : undefined;

    if (chunk.model === 'A') {
      onModelAToken(chunk.token || '', chunk.done, metadata);
    } else if (chunk.model === 'B') {
      onModelBToken(chunk.token || '', chunk.done, metadata);
    } else if (chunk.model === 'SYSTEM' && chunk.done) {
      // Stream completed - may contain debug_run_id
      if (import.meta.env.DEV) {
        console.log('Stream completed', chunk.debug_run_id ? `debug_run_id: ${chunk.debug_run_id}` : '');
      }
      // Pass debug_run_id to Model A handler for display
      if (chunk.debug_run_id) {
        onModelAToken('', true, { debug_run_id: chunk.debug_run_id });
      }
    }
  }

  private parseJwt(token: string): { exp?: number } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
    const payload = this.parseJwt(token);
    if (!payload?.exp) return false; // Can't determine, assume valid
    // Add buffer to catch tokens about to expire
    return payload.exp * 1000 < Date.now() + bufferSeconds * 1000;
  }

  private async getAuthToken(): Promise<string> {
    // First, check if we have a token in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not logged in - please log in to use chat');
    }

    // Check if token is expired or about to expire (within 30 seconds)
    const needsRefresh = this.isTokenExpired(token, 30);

    if (!needsRefresh) {
      // Token is still valid with buffer, use it directly
      if (import.meta.env.DEV) console.log('Token still valid, using directly');
      return token;
    }

    // Token is expired or about to expire, need to refresh
    if (import.meta.env.DEV) console.log('Token expired or expiring soon, triggering refresh');

    try {
      // Make a request that will trigger the auth interceptor to refresh the token
      await this.authFetch.get(EVENTS_ENDPOINTS.list, {
        params: { limit: 1 },
        timeout: 5000
      });

      // Get the refreshed token from localStorage
      const refreshedToken = localStorage.getItem('token');
      if (!refreshedToken) {
        throw new Error('No token available after refresh');
      }

      // Verify the refreshed token is actually valid
      if (this.isTokenExpired(refreshedToken, 5)) {
        if (import.meta.env.DEV) console.error('Refreshed token is still expired');
        throw new Error('Session expired - please log in again');
      }

      if (import.meta.env.DEV) console.log('Retrieved fresh token for streaming');
      return refreshedToken;
    } catch (error: any) {
      // Check if it's an auth error (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (import.meta.env.DEV) console.error('Auth token expired or invalid:', error);
        throw new Error('Session expired - please log in again');
      }

      // For network errors, check if the existing token might still work
      // (maybe the events endpoint is down but chat will work)
      if (!this.isTokenExpired(token, 0)) {
        if (import.meta.env.DEV) {
          console.warn('Refresh request failed but token not expired, using existing:', error.message);
        }
        return token;
      }

      // Token is expired and we couldn't refresh
      if (import.meta.env.DEV) console.error('Cannot refresh expired token:', error);
      throw new Error('Session expired - please log in again');
    }
  }
}

// Fallback mock service for development
export class MockStreamingChatService implements StreamingChatService {
  startChatStream(
    message: string,
    onModelAToken: (token: string, done: boolean, metadata?: any) => void,
    onModelBToken: (token: string, done: boolean, metadata?: any) => void,
    _onError: (error: string) => void,
    _context: Partial<ChatContext> = {},
    _singleModelMode: boolean = true,
    _options: StreamingChatOptions = {}
  ): () => void {
    let isActive = true;

    const mockStream = async () => {
      const responseA = `I found some great events for you! Based on your query "${message}", here are my recommendations...`;
      const responseB = `Here are some activities I think you'd enjoy! Looking at "${message}", I can suggest...`;
      
      const tokensA = responseA.split(' ');
      const tokensB = responseB.split(' ');
      
      // Stream tokens with realistic timing
      for (let i = 0; i < Math.max(tokensA.length, tokensB.length); i++) {
        if (!isActive) break;
        
        if (i < tokensA.length) {
          onModelAToken(tokensA[i] + ' ', false);
        }
        
        if (i < tokensB.length) {
          onModelBToken(tokensB[i] + ' ', false);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (isActive) {
        // Send completion with metadata
        const metadata = {
          suggested_event_ids: [1, 2, 3],
          follow_up_questions: ['Would you like more details?', 'Any specific time preferences?'],
          response_time_ms: 2000,
        };
        
        onModelAToken('', true, metadata);
        onModelBToken('', true, metadata);
      }
    };

    mockStream();

    return () => {
      isActive = false;
    };
  }
}
