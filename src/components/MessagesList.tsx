import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import MessageItem from './MessageItem';

interface MessagesListProps {
  messages: ChatMessage[];
  streaming: boolean;
  isLoading: boolean;
}

export default function MessagesList({ messages, streaming, isLoading }: MessagesListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="chat-messages"
      ref={containerRef}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((m) => (
        <MessageItem key={m.id} message={m} streaming={streaming} />
      ))}
      {isLoading && (
        <div className="message assistant" role="status" aria-live="polite">
          <div className="message-content">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="loading-models">Thinking...</div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

