import { AuthFetch } from '../types/index';
import { EVENTS_ENDPOINTS, STREAMING_API_BASE_URL } from '../constants/api';

export interface StreamingChatService {
  startChatStream(
    message: string, 
    onModelAToken: (token: string, done: boolean, metadata?: any) => void,
    onModelBToken: (token: string, done: boolean, metadata?: any) => void,
    onError: (error: string) => void,
    context?: any,
    singleModelMode?: boolean
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
      context: any = {},
      singleModelMode: boolean = true
    ): () => void {
      let isActive = true;

    const controller = new AbortController();
    const startStream = async () => {
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
            chat_history: context.chat_history || []
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Chat stream error:', response.status, response.statusText, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }
        
        if (import.meta.env.DEV) {
          console.log('Chat stream response received, status:', response.status);
        }

        if (!response.body) {
          throw new Error('No response body for streaming');
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
            break;
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
      } catch (error) {
        if (isActive) {
          onError(error instanceof Error ? error.message : 'Stream connection failed');
        }
      }
    };

    startStream();

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
    } : undefined;

    if (chunk.model === 'A') {
      onModelAToken(chunk.token || '', chunk.done, metadata);
    } else if (chunk.model === 'B') {
      onModelBToken(chunk.token || '', chunk.done, metadata);
    } else if (chunk.model === 'SYSTEM' && chunk.done) {
      // Stream completed
      if (import.meta.env.DEV) console.log('Stream completed');
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
    onError: (error: string) => void,
    _context: any = {},
    _singleModelMode: boolean = true
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
