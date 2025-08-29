import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { ChatService } from '../services/chatService';
import { FastAPIStreamingChatService, MockStreamingChatService } from '../services/streamingChatService';
import { AnalyticsService } from '../services/analyticsService';
import UserPreferences from './UserPreferences';
import type { DualChatInterfaceProps, ChatMessage, Event } from '../types/index';
import './DualChatInterface.css';
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

// Simple HTML to text converter for backward compatibility
const htmlToText = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
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

export default function DualChatInterface({ 
  onSuggestedEvents, 
  onSuggestionsLoading,
  onCalendarUpdate,
  suggestedEvents = [],
  loadingSuggestions = false,
  isVisible = true 
}: DualChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadPersistedMessages);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  });
  const [selectedModel, setSelectedModel] = useState<'A' | 'B' | null>(null); // Track which model user prefers
  const [useStreaming, setUseStreaming] = useState<boolean>(true); // Toggle for streaming mode
  const [useABTesting, setUseABTesting] = useState<boolean>(false); // Toggle for A/B testing mode
  const [streamingCleanup, setStreamingCleanup] = useState<(() => void) | null>(null);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authFetch } = useAuth();
  const { preferences, getPreferencesContext } = useUserPreferences();
  const [chatService] = useState(() => new ChatService(authFetch));
  const [streamingService] = useState(() => {
    // Try FastAPI first, fallback to mock for development
    try {
      return new FastAPIStreamingChatService(authFetch);
    } catch (error) {
      console.warn('FastAPI streaming service not available, using mock service');
      return new MockStreamingChatService();
    }
  });
  const [analyticsService] = useState(() => new AnalyticsService(authFetch));

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
      } else if (msg.type === 'dual-assistant') {
        // For dual responses, use the selected model or default to Model B
        const content = msg.selectedModel === 'A' 
          ? msg.modelA.content || msg.modelA.response 
          : msg.modelB.content || msg.modelB.response;
        return { role: 'assistant', content: content };
      }
      return null;
    };

    const history = [];
    
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
      type: 'dual-assistant',
      modelA: {
        response: '',
        isComplete: false,
        suggestedEventIds: [],
        followUpQuestions: [],
        responseTimeMs: 0
      },
      modelB: {
        response: '',
        isComplete: false,
        suggestedEventIds: [],
        followUpQuestions: [],
        responseTimeMs: 0
      },
      timestamp: new Date(),
      selectedModel: null
    };

    setMessages(prev => [...prev, streamingMessage]);

    const cleanup = streamingService.startChatStream(
      message,
      // Model A token handler
      (token: string, done: boolean, metadata?: any) => {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? {
                ...msg,
                modelA: {
                  ...msg.modelA,
                  response: done ? msg.modelA.response : msg.modelA.response + token,
                  isComplete: done,
                  suggestedEventIds: metadata?.suggested_event_ids || msg.modelA.suggestedEventIds,
                  followUpQuestions: metadata?.follow_up_questions || msg.modelA.followUpQuestions,
                  responseTimeMs: metadata?.response_time_ms || msg.modelA.responseTimeMs
                }
              }
            : msg
        ));
        
        if (done) {
          checkStreamingComplete(streamingMessageId);
        }
      },
      // Model B token handler  
      (token: string, done: boolean, metadata?: any) => {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? {
                ...msg,
                modelB: {
                  ...msg.modelB,
                  response: done ? msg.modelB.response : msg.modelB.response + token,
                  isComplete: done,
                  suggestedEventIds: metadata?.suggested_event_ids || msg.modelB.suggestedEventIds,
                  followUpQuestions: metadata?.follow_up_questions || msg.modelB.followUpQuestions,
                  responseTimeMs: metadata?.response_time_ms || msg.modelB.responseTimeMs
                }
              }
            : msg
        ));
        
        if (done) {
          checkStreamingComplete(streamingMessageId);
        }
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
        chat_history: formatChatHistory()
      },
      // Single model mode (opposite of A/B testing)
      !useABTesting
    );

    setStreamingCleanup(() => cleanup);
  };

  const checkStreamingComplete = (messageId: number) => {
    setMessages(prev => {
      const message = prev.find(msg => msg.id === messageId);
      if (message && message.type === 'dual-assistant') {
        // In A/B testing mode, both models need to complete
        // In single model mode, only Model B needs to complete
        const isComplete = useABTesting 
          ? (message.modelA.isComplete && message.modelB.isComplete)
          : message.modelB.isComplete;
        
        if (isComplete) {
          setIsLoading(false);
        }
      }
      return prev;
    });
  };

  // Effect to handle suggested events after streaming is complete
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.type === 'dual-assistant') {
      // Check if streaming is complete based on mode
      const isComplete = useABTesting 
        ? (latestMessage.modelA.isComplete && latestMessage.modelB.isComplete)
        : latestMessage.modelB.isComplete;
      
      if (isComplete) {
        // Get suggested events from the appropriate model(s)
        const allSuggestedIds = useABTesting 
          ? [
              ...latestMessage.modelA.suggestedEventIds,
              ...latestMessage.modelB.suggestedEventIds
            ].filter((id, index, self) => self.indexOf(id) === index)
          : [...latestMessage.modelB.suggestedEventIds];
      
      console.log('Processing suggested events:', allSuggestedIds);
      
        if (allSuggestedIds.length > 0) {
          handleSuggestedEvents(allSuggestedIds);
        }
      }
    }
  }, [messages, useABTesting]);

  const handleSuggestedEvents = async (suggestedIds: (string | number)[]) => {
    console.log('handleSuggestedEvents called with:', suggestedIds);
    onSuggestionsLoading && onSuggestionsLoading(true);
    
    try {
      const eventsResponse = await chatService.fetchEventsByIds(suggestedIds);
      console.log('Events response:', eventsResponse);
      if (eventsResponse.success && eventsResponse.data.length > 0) {
        console.log('Setting suggested events:', eventsResponse.data);
        onSuggestedEvents(eventsResponse.data);
        onSuggestionsLoading && onSuggestionsLoading(false);
      } else if (import.meta.env.DEV) {
        console.log('Using mock events for:', suggestedIds);
        const mockEvents = chatService.generateMockEventsFromIds(suggestedIds);
        onSuggestedEvents(mockEvents);
        onSuggestionsLoading && onSuggestionsLoading(false);
      } else {
        console.log('No events found, clearing loading');
        onSuggestionsLoading && onSuggestionsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching suggested events:', error);
      if (import.meta.env.DEV) {
        console.log('Using mock events due to error:', suggestedIds);
        const mockEvents = chatService.generateMockEventsFromIds(suggestedIds);
        onSuggestedEvents(mockEvents);
      } else {
        onSuggestionsLoading && onSuggestionsLoading(false);
      }
    }
  };

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
        chat_history: formatChatHistory()
      });

      if (response.success) {
        // Update session ID if provided
        if (response.data.sessionId) {
          setSessionId(response.data.sessionId);
        }

        const dualAssistantMessage = {
          id: response.data.id,
          type: 'dual-assistant',
          modelA: response.data.modelA,
          modelB: response.data.modelB,
          timestamp: response.data.timestamp,
          selectedModel: null // User hasn't selected a preference yet
        };

        setMessages(prev => [...prev, dualAssistantMessage]);
        
        // Clear previous suggestions if the response indicates a topic change
        if (response.data.clearPreviousSuggestions) {
          onSuggestedEvents([]);
        }
        
        // Handle suggested events - combine from both models for now
        const allSuggestedIds = [
          ...response.data.modelA.suggestedEventIds,
          ...response.data.modelB.suggestedEventIds
        ].filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
        
        if (allSuggestedIds.length > 0) {
          await handleSuggestedEvents(allSuggestedIds);
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

  const handleModelSelection = async (messageId: number, model: 'A' | 'B') => {
    // Find the message to get the full context
    const targetMessage = messages.find(msg => msg.id === messageId && msg.type === 'dual-assistant');
    if (!targetMessage) return;

    // Find the original user message that triggered this dual response
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;

    // Update UI immediately
    setMessages(prev => prev.map(msg => 
      msg.id === messageId && msg.type === 'dual-assistant'
        ? { ...msg, selectedModel: model }
        : msg
    ));
    setSelectedModel(model);
    
    // Track the preference
    if (targetMessage && userMessage) {
      await analyticsService.trackModelPreference(
        messageId, 
        model, 
        targetMessage.modelA, 
        targetMessage.modelB,
        userMessage.content || ''
      );
    }
    
    console.log(`User preferred ${model} for message ${messageId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible) return null;

  return (
    <div className="dual-chat-interface">
      <div className="chat-header">
        <h3>Event Assistant</h3>
        <div className="header-controls">
          <button 
            className="preferences-btn"
            onClick={() => setShowPreferences(true)}
            title="Set your event preferences"
          >
            ⚙️ Preferences
          </button>
          <button 
            className="clear-chat-btn"
            onClick={clearChat}
            title="Clear conversation history"
          >
            🗑️ Clear Chat
          </button>
          <div className="toggle-controls">
            <label>
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
              />
              🚀 Streaming Mode
            </label>
            <label>
              <input
                type="checkbox"
                checked={useABTesting}
                onChange={(e) => setUseABTesting(e.target.checked)}
              />
              🔬 A/B Testing
            </label>
          </div>
          {useABTesting && (
            <div className="model-legend">
              <span className="model-a-label">Model A (8B)</span>
              <span className="model-b-label">Model B (3B)</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((message) => {
          if (message.type === 'dual-assistant') {
            // Single model mode - show only Model B (3B) unless A/B testing is enabled
            if (!useABTesting) {
              return (
                <div key={message.id} className="message assistant">
                  <div className="model-header-single">
                    <span className="model-name">{message.modelB.modelName || 'Model B (3B)'}</span>
                    <span className="response-time">{message.modelB.responseTimeMs || 0}ms</span>
                    {!message.modelB.isComplete && useStreaming && <span className="streaming-indicator">⏳</span>}
                    {message.modelB.success === false && <span className="error-indicator">❌</span>}
                  </div>
                  <div className="message-content formatted-content">
                    {useStreaming ? (
                      <pre className="formatted-text">
                        {formatMessageContent(message.modelB.response || '')}
                        {!message.modelB.isComplete && <span className="typing-cursor">|</span>}
                      </pre>
                    ) : (
                      message.modelB.success ? 
                        <pre className="formatted-text">{formatMessageContent(message.modelB.content || '')}</pre> : 
                        `Error: ${message.modelB.error}`
                    )}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              );
            }
            
            // A/B testing mode - show both models
            return (
              <div key={message.id} className="dual-message-container">
                <div className="dual-responses">
                  <div className={`model-response model-a ${message.selectedModel === 'A' ? 'selected' : ''}`}>
                    <div className="model-header">
                      <span className="model-name">{message.modelA.modelName || 'Model A (8B)'}</span>
                      <span className="response-time">{message.modelA.responseTimeMs || 0}ms</span>
                      {!message.modelA.isComplete && useStreaming && <span className="streaming-indicator">⏳</span>}
                      {message.modelA.success === false && <span className="error-indicator">❌</span>}
                    </div>
                    <div className="message-content">
                      {useStreaming ? (
                        <pre className="formatted-text">
                          {formatMessageContent(message.modelA.response || '')}
                          {!message.modelA.isComplete && <span className="typing-cursor">|</span>}
                        </pre>
                      ) : (
                        message.modelA.success ? 
                          <pre className="formatted-text">{formatMessageContent(message.modelA.content || '')}</pre> : 
                          `Error: ${message.modelA.error}`
                      )}
                    </div>
                    {message.modelA.success && (
                      <button 
                        className="select-model-btn"
                        onClick={() => handleModelSelection(message.id, 'A')}
                        disabled={message.selectedModel !== null}
                      >
                        {message.selectedModel === 'A' ? '✓ Selected' : 'Prefer This'}
                      </button>
                    )}
                  </div>
                  
                  <div className={`model-response model-b ${message.selectedModel === 'B' ? 'selected' : ''}`}>
                    <div className="model-header">
                      <span className="model-name">{message.modelB.modelName || 'Model B (3B)'}</span>
                      <span className="response-time">{message.modelB.responseTimeMs || 0}ms</span>
                      {!message.modelB.isComplete && useStreaming && <span className="streaming-indicator">⏳</span>}
                      {message.modelB.success === false && <span className="error-indicator">❌</span>}
                    </div>
                    <div className="message-content">
                      {useStreaming ? (
                        <pre className="formatted-text">
                          {formatMessageContent(message.modelB.response || '')}
                          {!message.modelB.isComplete && <span className="typing-cursor">|</span>}
                        </pre>
                      ) : (
                        message.modelB.success ? 
                          <pre className="formatted-text">{formatMessageContent(message.modelB.content || '')}</pre> : 
                          `Error: ${message.modelB.error}`
                      )}
                    </div>
                    {message.modelB.success && (
                      <button 
                        className="select-model-btn"
                        onClick={() => handleModelSelection(message.id, 'B')}
                        disabled={message.selectedModel !== null}
                      >
                        {message.selectedModel === 'B' ? '✓ Selected' : 'Prefer This'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
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
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="loading-models">Testing both models...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {(suggestedEvents.length > 0 || loadingSuggestions) && (
        <div className="suggestions-panel">
          <h4>Suggested Events</h4>
          {loadingSuggestions ? (
            <div className="loading-suggestions">
              <div className="loading-spinner"></div>
              <span>Finding relevant events...</span>
            </div>
          ) : (
            <div className="suggested-events">
              {suggestedEvents.map((event) => (
                <div key={event.id} className="suggested-event">
                  <div className="event-title">{event.title}</div>
                  <div className="event-details">
                    {event.location && <span className="event-location">{event.location}</span>}
                    {event.start && (
                      <span className="event-time">
                        {new Date(event.start).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button 
                    className="add-event-btn"
                    onClick={() => onCalendarUpdate && onCalendarUpdate(event)}
                  >
                    View on Calendar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about events... (Responses from 2 models will be shown for comparison)"
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
      
      <UserPreferences 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />
    </div>
  );
}