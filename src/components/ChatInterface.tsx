import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../auth';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { ChatService } from '../services/chatService';
import { FastAPIStreamingChatService, MockStreamingChatService } from '../services/streamingChatService';
import UserPreferences from './UserPreferences';
import type { ChatInterfaceProps, ChatMessage, Event } from '../types/index';
import './ChatInterface.css';
import './UserPreferences.css';

// Enhanced text formatter that preserves line breaks and formatting
const formatMessageContent = (text: string): string => {
  if (!text) return '';
  
  // First decode HTML entities and strip most HTML tags but preserve structure
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  let formatted = tempDiv.textContent || tempDiv.innerText || '';
  
  // Preserve line breaks and bullet point formatting
  formatted = formatted.replace(/\n/g, '\n');
  
  return formatted;
};

const CHAT_STORAGE_KEY = 'superschedules_chat_messages';
const SESSION_STORAGE_KEY = 'superschedules_session_id';

// Default welcome message
const getDefaultMessages = (): ChatMessage[] => [
  {
    id: 1,
    type: 'assistant',
    content: "Hi! I'm here to help you find events. Tell me what you're looking for - like activities for specific ages, locations, or timeframes.",
    timestamp: new Date()
  }
];

// Load messages from localStorage
const loadPersistedMessages = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.warn('Failed to load persisted chat messages:', error);
  }
  return getDefaultMessages();
};

export default function ChatInterface({ 
  onSuggestedEvents, 
  onSuggestionsLoading,
  suggestedEvents = [],
  loadingSuggestions = false,
  isVisible = true 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadPersistedMessages);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  });
  const useStreaming = true; // Always use streaming mode
  const [streamingCleanup, setStreamingCleanup] = useState<(() => void) | null>(null);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    // Default to 7 days from today
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authFetch } = useAuth();
  const { preferences, getPreferencesContext } = useUserPreferences();
  const [chatService] = useState(() => new ChatService(authFetch));
  const [streamingService] = useState(() => {
    // Try FastAPI first, fallback to mock for development
    try {
      return new FastAPIStreamingChatService(authFetch);
    } catch (_error) {
      console.warn('FastAPI streaming service not available, using mock service');
      return new MockStreamingChatService();
    }
  });

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to persist chat messages:', error);
    }
  }, [messages]);

  // Persist session ID when it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
  }, [sessionId]);

  // Clear chat function
  const clearChat = () => {
    const defaultMessages = getDefaultMessages();
    setMessages(defaultMessages);
    setSessionId(null);
    onSuggestedEvents([]); // Clear suggested events
    localStorage.removeItem(CHAT_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('Chat cleared');
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup streaming connections on unmount
  useEffect(() => {
    return () => {
      if (streamingCleanup) {
        streamingCleanup();
      }
    };
  }, [streamingCleanup]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Clean up any existing streaming connection
    if (streamingCleanup) {
      streamingCleanup();
      setStreamingCleanup(null);
    }

    if (useStreaming) {
      await handleStreamingMessage(userMessage.content);
    } else {
      await handleRegularMessage(userMessage.content);
    }
  };

  // Convert messages to chat history format for backend with smart truncation
  const formatChatHistory = (maxMessages: number = 10) => {
    // Always keep the welcome message (first message) for context
    const welcomeMessage = messages[0];
    const recentMessages = messages.slice(1); // Skip welcome message
    
    // Get the most recent messages (up to maxMessages)
    const messagesToInclude = recentMessages.slice(-maxMessages);
    
      const formatMessage = (msg: any) => {
        if (msg.type === 'user') {
          return { role: 'user', content: msg.content };
        } else if (msg.type === 'assistant') {
          return { role: 'assistant', content: msg.content };
        }
        return null;
      };

      const history: any[] = [];
    
    // Add welcome message context if it's not a default message
    if (welcomeMessage && messagesToInclude.length > 0) {
      const welcomeFormatted = formatMessage(welcomeMessage);
      if (welcomeFormatted) {
        history.push(welcomeFormatted);
      }
    }
    
    // Add recent messages
    messagesToInclude.forEach(msg => {
      const formatted = formatMessage(msg);
      if (formatted) {
        history.push(formatted);
      }
    });

    // Estimate token count (rough approximation: ~4 chars per token)
    const estimatedTokens = JSON.stringify(history).length / 4;
    console.log(`Chat history: ${history.length} messages, ~${Math.round(estimatedTokens)} tokens`);
    
    return history;
  };

  const handleStreamingMessage = async (message: string) => {
    // Create placeholder message that will be updated with streaming content
    const streamingMessageId = Date.now() + 1000;
    const streamingMessage = {
      id: streamingMessageId,
      type: 'assistant',
      content: '',
      isComplete: false,
      suggestedEventIds: [],
      followUpQuestions: [],
      responseTimeMs: 0,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, streamingMessage]);

    const cleanup = streamingService.startChatStream(
      message,
      // Model A handler (this is where single model responses actually come through)
      (token: string, done: boolean, metadata?: any) => {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? {
                ...msg,
                content: done ? msg.content : msg.content + token,
                isComplete: done,
                suggestedEventIds: metadata?.suggested_event_ids || msg.suggestedEventIds,
                followUpQuestions: metadata?.follow_up_questions || msg.followUpQuestions,
                responseTimeMs: metadata?.response_time_ms || msg.responseTimeMs
              }
            : msg
        ));
        
        if (done) {
          setIsLoading(false);
        }
      },
      // Model B handler (unused in single mode)
        (_token: string, _done: boolean, _metadata?: any) => {
          // Not used in single model mode
        },
      // Error handler
      (error: string) => {
        console.error('Streaming error:', error);
        const errorMessage = {
          id: Date.now() + 2000,
          type: 'assistant',
          content: `Sorry, I encountered an error with streaming: ${error}. Please try again.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      },
      // Context
      {
        location: preferences.location || null,
        preferences: {
          ...preferences,
          context_summary: getPreferencesContext()
        },
        session_id: sessionId,
        chat_history: formatChatHistory(),
        date_range: {
          from: dateFrom,
          to: dateTo
        }
      },
      // Single model mode
      true
    );

    setStreamingCleanup(() => cleanup);
  };

  const handleSuggestedEvents = useCallback(async (suggestedIds: (string | number)[]) => {
    console.log('handleSuggestedEvents called with:', suggestedIds);
    onSuggestionsLoading?.(true);

    try {
      const eventsResponse = await chatService.fetchEventsByIds(suggestedIds);
      console.log('Events response:', eventsResponse);
      if (eventsResponse.success && eventsResponse.data.length > 0) {
        console.log('Setting suggested events:', eventsResponse.data);
        onSuggestedEvents(eventsResponse.data);
        onSuggestionsLoading?.(false);
      } else if (import.meta.env.DEV) {
        console.log('Using mock events for:', suggestedIds);
        const mockEvents = chatService.generateMockEventsFromIds(suggestedIds);
        onSuggestedEvents(mockEvents);
        onSuggestionsLoading?.(false);
      } else {
        console.log('No events found, clearing loading');
        onSuggestionsLoading?.(false);
      }
    } catch (error) {
      console.error('Error fetching suggested events:', error);
      if (import.meta.env.DEV) {
        console.log('Using mock events due to error:', suggestedIds);
        const mockEvents = chatService.generateMockEventsFromIds(suggestedIds);
        onSuggestedEvents(mockEvents);
      } else {
        onSuggestionsLoading?.(false);
      }
    }
  }, [chatService, onSuggestedEvents, onSuggestionsLoading]);

  // Effect to handle suggested events after streaming is complete
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.type === 'assistant' && latestMessage.isComplete) {
      const suggestedIds = latestMessage.suggestedEventIds || [];

      console.log('Processing suggested events:', suggestedIds);

      if (suggestedIds.length > 0) {
        handleSuggestedEvents(suggestedIds);
      }
    }
  }, [messages, handleSuggestedEvents]);

  const handleRegularMessage = async (message: string) => {
    try {
      const response = await chatService.sendMessage(message, {
        location: preferences.location || null,
        preferences: {
          ...preferences,
          context_summary: getPreferencesContext()
        },
        session_id: sessionId,
        clear_suggestions: false,
        chat_history: formatChatHistory(),
        date_range: {
          from: dateFrom,
          to: dateTo
        }
      });

      if (response.success) {
        // Update session ID if provided
        if (response.data.sessionId) {
          setSessionId(response.data.sessionId);
        }

        const assistantMessage = {
          id: response.data.id,
          type: 'assistant',
          content: response.data.modelB?.content || response.data.content,
          timestamp: response.data.timestamp
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Clear previous suggestions if the response indicates a topic change
        if (response.data.clearPreviousSuggestions) {
          onSuggestedEvents([]);
        }
        
        // Handle suggested events
        const suggestedIds = response.data.modelB?.suggestedEventIds || response.data.suggestedEventIds || [];
        
        if (suggestedIds.length > 0) {
          await handleSuggestedEvents(suggestedIds);
        } else if (response.data.clearPreviousSuggestions) {
          onSuggestedEvents([]);
        }

      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="chat-interface" aria-busy={isLoading}>
      <div className="chat-header">
        <h3>Event Assistant</h3>
        <div className="header-controls">
          <button
            className="preferences-btn"
            onClick={() => setShowPreferences(true)}
            title="Set your event preferences"
            aria-label="Set event preferences"
          >
            ⚙️ Preferences
          </button>
          <button
            className="clear-chat-btn"
            onClick={clearChat}
            title="Clear conversation history"
            aria-label="Clear conversation history"
          >
            🗑️ Clear Chat
          </button>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <div className="date-range-selector">
        <div className="date-range-inputs">
          <div className="date-input-group">
            <label htmlFor="date-from">From:</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label htmlFor="date-to">To:</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div
        className="chat-messages"
        ref={chatMessagesRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => {
          if (message.type === 'assistant') {
            return (
              <div key={message.id} className="message assistant">
                <div className="message-content formatted-content">
                  {useStreaming ? (
                    <pre className="formatted-text">
                      {formatMessageContent(message.content || '')}
                      {!message.isComplete && <span className="typing-cursor">|</span>}
                    </pre>
                  ) : (
                    <pre className="formatted-text">{formatMessageContent(message.content || '')}</pre>
                  )}
                </div>
              </div>
            );
          }
          
          return (
            <div 
              key={message.id} 
              className={`message ${message.type}`}
            >
              <div className="message-content">
                <pre className="formatted-text">
                  {formatMessageContent(message.content || '')}
                </pre>
              </div>
            </div>
          );
        })}
        
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
        <div ref={messagesEndRef} />
      </div>

      
      <div className="chat-input">
        <textarea
          aria-label="Message input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about events..."
          disabled={isLoading}
          rows="2"
        />
        <button 
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>

      {/* Suggested Events Section Below Chat */}
      {(suggestedEvents.length > 0 || loadingSuggestions) && (
        <div className="suggested-events-section">
          <h3>Suggested Events</h3>
          {loadingSuggestions ? (
            <div className="loading-suggestions">
              <div className="loading-spinner"></div>
              <span>Finding relevant events...</span>
            </div>
          ) : (
            <div className="suggested-events-list">
              {suggestedEvents.map((event) => (
                <div key={event.id} className="suggested-event-card-full">
                  {/* Top line: Title and Location */}
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    {event.location && (
                      <div className="event-location">
                        <i className="bi bi-geo-alt-fill"></i>
                        <span>{event.location}</span>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="directions-link"
                        >
                          Directions
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {event.description && (
                    <div className="event-description">
                      {event.description}
                    </div>
                  )}

                  {/* Meta tags at the bottom */}
                  <div className="event-meta">
                    {event.start_time && (
                      <span className="meta-tag meta-time">
                        {format(new Date(event.start_time), 'EEEE MMM d, yyyy • h:mm a')}
                      </span>
                    )}
                    {event.age_range && (
                      <span className="meta-tag meta-age">
                        <i className="bi bi-people-fill"></i>
                        Ages {event.age_range}
                      </span>
                    )}
                    {event.price && (
                      <span className="meta-tag meta-price">
                        <i className="bi bi-currency-dollar"></i>
                        {event.price}
                      </span>
                    )}
                    {event.organizer && (
                      <span className="meta-tag meta-organizer">
                        <i className="bi bi-building"></i>
                        {event.organizer}
                      </span>
                    )}
                    {/* Display tags from either tags or metadata_tags field */}
                    {(event.tags || event.metadata_tags) && (
                      <>
                        {(event.tags || event.metadata_tags || []).slice(0, 3).map((tag, index) => (
                          <span key={index} className="meta-tag meta-category">
                            <i className="bi bi-tag-fill"></i>
                            {tag}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {/* View Details button */}
                  {event.url && (
                    <div className="event-actions">
                      <a 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-event-btn"
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                        View Details
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <UserPreferences 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />
    </div>
  );
}