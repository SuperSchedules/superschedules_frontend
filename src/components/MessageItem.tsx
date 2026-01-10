import React from 'react';
import type { ChatMessage } from '../types';

const DEBUG_ADMIN_URL = 'https://admin.eventzombie.com/admin/traces/chatdebugrun';

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
    const showDebugLink = message.isComplete && message.debugRunId;

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
          {showDebugLink && (
            <div className="debug-trace-link">
              <a
                href={`${DEBUG_ADMIN_URL}/${message.debugRunId}/change/`}
                target="_blank"
                rel="noopener noreferrer"
                title="View RAG debug trace"
              >
                <i className="bi bi-bug"></i> View debug trace
              </a>
            </div>
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

