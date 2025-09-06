import React from 'react';

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatComposer({ value, onChange, onSend, disabled = false, placeholder = 'Ask me about events...' }: ChatComposerProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        aria-label="Message input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2 as any}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="send-button"
      >
        Send
      </button>
    </div>
  );
}

