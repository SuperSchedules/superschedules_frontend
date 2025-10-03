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
        const response = await fetch(`${this.baseURL}/chat/stream`, {
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

  private async getAuthToken(): Promise<string> {
    // Use the authFetch system to ensure we get a fresh, valid token
    try {
      // Make a simple request that will trigger token refresh if needed
      // The authFetch interceptor handles expiration automatically
      await this.authFetch.get(EVENTS_ENDPOINTS.list, { 
        params: { limit: 1 },
        timeout: 5000 
      });
      
      // After the successful authFetch call, the token in localStorage should be fresh
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available after refresh');
      }
      
      if (import.meta.env.DEV) console.log('Retrieved fresh token for streaming');
      return token;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to get/refresh token for streaming:', error);
      throw new Error('Authentication failed - please refresh the page and try again');
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
