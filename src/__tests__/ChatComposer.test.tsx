import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ChatComposer from '../components/ChatComposer';

describe('ChatComposer', () => {
  afterEach(() => cleanup());
  it('sends on Enter and respects Shift+Enter', () => {
    const onSend = vi.fn();
    const onChange = vi.fn();
    render(<ChatComposer value="hello" onChange={onChange} onSend={onSend} />);

    const area = screen.getByLabelText(/message input/i);
    fireEvent.keyDown(area, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(area, { key: 'Enter', shiftKey: true });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('disables send when empty or disabled', () => {
    const onSend = vi.fn();
    const onChange = vi.fn();
    const { rerender } = render(
      <ChatComposer value="" onChange={onChange} onSend={onSend} />
    );
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();

    rerender(<ChatComposer value="Hello" onChange={onChange} onSend={onSend} disabled />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });
});
