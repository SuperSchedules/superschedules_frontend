import React from 'react';
import type { ChatMessage } from '../types';

function formatMessageContent(text: string): string {
  if (!text) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  let formatted = tempDiv.textContent || (tempDiv as any).innerText || '';
  formatted = formatted.replace(/\n/g, '\n');
  return formatted;
}

interface MessageItemProps {
  message: ChatMessage;
  streaming: boolean;
}

export default function MessageItem({ message, streaming }: MessageItemProps) {
  if (message.type === 'assistant') {
    return (
      <div className="message assistant">
        <div className="message-content formatted-content">
          {streaming ? (
            <pre className="formatted-text">
              {formatMessageContent(message.content || '')}
              {message.isComplete === false && <span className="typing-cursor">|</span>}
            </pre>
          ) : (
            <pre className="formatted-text">{formatMessageContent(message.content || '')}</pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${message.type}`}>
      <div className="message-content">
        <pre className="formatted-text">{formatMessageContent(message.content || '')}</pre>
      </div>
    </div>
  );
}

