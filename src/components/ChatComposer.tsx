import React from 'react';

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
  debugMode?: boolean;
  onToggleDebug?: () => void;
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onClear,
  disabled = false,
  placeholder = "What events are you looking for?",
  debugMode = false,
  onToggleDebug
}: ChatComposerProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  // Only show debug toggle in development mode
  const showDebugToggle = import.meta.env.DEV && onToggleDebug;

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
        {showDebugToggle && (
          <button
            onClick={onToggleDebug}
            className={`debug-toggle ${debugMode ? 'active' : ''}`}
            title={debugMode ? 'Debug mode ON - click to disable' : 'Enable debug mode for RAG tracing'}
          >
            <i className="bi bi-bug"></i>
            {debugMode ? 'Debug ON' : 'Debug'}
          </button>
        )}
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

