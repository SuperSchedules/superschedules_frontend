import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastAPIStreamingChatService } from '../services/streamingChatService';

describe('FastAPIStreamingChatService', () => {
  const encoder = new TextEncoder();
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Create a valid JWT token (exp = 1 hour from now)
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    const validToken = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
    localStorage.setItem('token', validToken);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('streams SSE events and invokes token callbacks with metadata', async () => {
    // authFetch is not called when token is valid (skip warming request)
    const authFetch: any = { get: vi.fn() };

    const sseText = [
      'data: {"model":"A","token":"Hello ","done":false}',
      '',
      'data: {"model":"A","token":"world!","done":true,"suggested_event_ids":[1,2],"follow_up_questions":["Q1"],"response_time_ms":1234}',
      '',
    ].join('\n');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => {
          let sent = false;
          return {
            read: async () => {
              if (sent) return { done: true, value: undefined };
              sent = true;
              return { done: false, value: encoder.encode(sseText) };
            },
          };
        },
      },
      text: async () => '',
    });

    const service = new FastAPIStreamingChatService(authFetch);

    const tokens: string[] = [];
    let finalDone = false;
    let finalMeta: any = null;
    const cleanup = service.startChatStream(
      'hi',
      (token, done, metadata) => {
        if (!done) tokens.push(token);
        if (done) {
          finalDone = true;
          finalMeta = metadata || null;
        }
      },
      () => {},
      () => {},
    );

    // Wait for completion callback
    await vi.waitFor(() => {
      expect(finalDone).toBe(true);
    });
    cleanup();

    // With valid token, authFetch.get is not called (no warming request needed)
    expect(authFetch.get).not.toHaveBeenCalled();
    expect(tokens.join('')).toBe('Hello ');
    expect(finalMeta?.suggested_event_ids).toEqual([1, 2]);
    expect(finalMeta?.follow_up_questions).toEqual(['Q1']);
    expect(typeof finalMeta?.response_time_ms).toBe('number');
  });
});
