import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

// Mock streaming service to trigger onError and force fallback
vi.mock('../services/streamingChatService', () => {
  return {
    FastAPIStreamingChatService: class {
      constructor() {}
      startChatStream(_message: string, _onA: any, _onB: any, onError: (e: string) => void) {
        // Immediately trigger error to simulate streaming failure
        setTimeout(() => onError('stream error'), 0);
        return () => {};
      }
    },
    MockStreamingChatService: class {
      startChatStream() { return () => {}; }
    },
  };
});

// Mock ChatService to return a successful non-streaming response
vi.mock('../services/chatService', () => {
  return {
    ChatService: class {
      constructor() {}
      async sendMessage(_message: string) {
        return {
          success: true,
          data: {
            id: Date.now(),
            modelA: {
              modelName: 'mock-a',
              content: 'ignored',
              responseTimeMs: 10,
              success: true,
              error: null,
              suggestedEventIds: [],
              followUpQuestions: [],
            },
            modelB: {
              modelName: 'mock-b',
              content: 'Fallback response',
              responseTimeMs: 12,
              success: true,
              error: null,
              suggestedEventIds: [],
              followUpQuestions: [],
            },
            sessionId: null,
            clearPreviousSuggestions: false,
            timestamp: new Date(),
          },
        };
      }
    },
  };
});

import ChatInterface from '../components/ChatInterface';
import { AuthContext } from '../auth';

describe('ChatInterface streaming fallback', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  const authFetch: any = { get: vi.fn(), post: vi.fn() };

  const renderWithAuth = (ui: React.ReactNode) =>
    render(
      <AuthContext.Provider value={{ user: { token: 't' }, login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(), authFetch }}>
        {ui}
      </AuthContext.Provider>
    );

  it('shows error message when streaming fails', async () => {
    renderWithAuth(
      <ChatInterface onSuggestedEvents={() => {}} />
    );

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/having trouble connecting to the chat service/i)).toBeInTheDocument();
    });
  });
});

