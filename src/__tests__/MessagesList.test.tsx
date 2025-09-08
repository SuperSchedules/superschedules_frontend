import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import MessagesList from '../components/MessagesList';

const baseMsg = (id: number, type: 'assistant' | 'user', content: string, extra: any = {}) => ({ id, type, content, timestamp: new Date(), ...extra });

describe('MessagesList', () => {
  afterEach(() => cleanup());
  it('shows typing cursor only when streaming and message incomplete', () => {
    const messages = [
      baseMsg(1, 'assistant', 'Hello', { isComplete: true }),
      baseMsg(2, 'assistant', 'Typing', { isComplete: false }),
      baseMsg(3, 'user', 'Query'),
    ];
    const { container } = render(<MessagesList messages={messages} streaming={true} isLoading={false} />);
    const cursors = container.querySelectorAll('.typing-cursor');
    expect(cursors.length).toBe(1);
  });

  it('auto-scrolls to bottom on new message', () => {
    const messages = [baseMsg(1, 'assistant', 'Hello', { isComplete: true })];
    const { rerender } = render(<MessagesList messages={messages} streaming={false} isLoading={false} />);
    const container = screen.getByRole('log');
    // Simulate a scrollable container
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 200 });
    Object.defineProperty(container, 'scrollTop', { configurable: true, writable: true, value: 0 });

    rerender(<MessagesList messages={[...messages, baseMsg(2, 'user', 'Hi')]} streaming={false} isLoading={false} />);
    expect((container as HTMLElement).scrollTop).toBe(200);
  });
});
