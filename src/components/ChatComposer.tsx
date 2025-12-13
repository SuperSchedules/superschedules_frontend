import React from 'react';

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatComposer({ value, onChange, onSend, onClear, disabled = false, placeholder = "What events are you looking for?" }: ChatComposerProps) {
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
      <div className="chat-input-buttons">
        {onClear && (
          <button
            onClick={onClear}
            disabled={disabled}
            className="clear-button"
            title="Clear chat"
          >
            <i className="bi bi-trash"></i>
          </button>
        )}
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

