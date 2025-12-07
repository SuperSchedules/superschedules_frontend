import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { ChatService } from '../services/chatService';
import { FastAPIStreamingChatService, MockStreamingChatService } from '../services/streamingChatService';
import type { ChatInterfaceProps, ChatMessage, Event } from '../types/index';
import './ChatInterface.css';
import SearchPreferencesBar from './SearchPreferencesBar';
import ChatComposer from './ChatComposer';
import MessagesList from './MessagesList';

// Message formatting moved into MessageItem

// Storage key helpers
const CHAT_EXPIRY_DAYS = 7;

const getChatStorageKey = (userId?: number | string) => {
  const userPart = userId ? `user${userId}` : 'anonymous';
  return `superschedules_chats_${userPart}`;
};

const getSessionStorageKey = (userId?: number | string) => {
  const userPart = userId ? `user${userId}` : 'anonymous';
  return `superschedules_session_${userPart}`;
};

// Default welcome message - Zombie themed!
const getDefaultMessages = (): ChatMessage[] => [
  {
    id: 1,
    type: 'assistant',
    content: "🧟 Braaains... I mean, events! I'm your friendly zombie guide to local happenings. Tell me what you're hungry for - activities for little monsters, grown-up zombies, or the whole undead family!",
    timestamp: new Date()
  }
];

// Clean up old chats (older than CHAT_EXPIRY_DAYS)
const cleanupOldChats = () => {
  try {
    const keys = Object.keys(localStorage);
    const chatKeys = keys.filter(k => k.startsWith('superschedules_chats_'));

    chatKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          const savedAt = data.savedAt ? new Date(data.savedAt) : null;

          if (savedAt) {
            const daysOld = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysOld > CHAT_EXPIRY_DAYS) {
              console.log(`Removing expired chat: ${key} (${Math.floor(daysOld)} days old)`);
              localStorage.removeItem(key);
              // Also remove associated session
              const sessionKey = key.replace('chats', 'session');
              localStorage.removeItem(sessionKey);
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to process ${key}:`, err);
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup old chats:', error);
  }
};

// Load messages from localStorage
const loadPersistedMessages = (userId?: number | string): ChatMessage[] => {
  try {
    const key = getChatStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      const savedAt = data.savedAt ? new Date(data.savedAt) : null;

      // Check if expired
      if (savedAt) {
        const daysOld = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld > CHAT_EXPIRY_DAYS) {
          console.log('Chat history expired, clearing');
          localStorage.removeItem(key);
          return getDefaultMessages();
        }
      }

      // Convert timestamp strings back to Date objects
      const messages = (data.messages || data).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      return messages;
    }
  } catch (error) {
    console.warn('Failed to load persisted chat messages:', error);
  }
  return getDefaultMessages();
};

export default function ChatInterface({
  onSuggestedEvents,
  onSuggestionsLoading,
  onFindMoreLike,
  onClearEvents,
  suggestedEvents = [],
  loadingSuggestions = false,
  isVisible = true
}: ChatInterfaceProps) {
  const { user, authFetch } = useAuth();
  const userId = user?.id;

  // Run cleanup on mount
  useEffect(() => {
    cleanupOldChats();
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadPersistedMessages(userId));
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const key = getSessionStorageKey(userId);
    return localStorage.getItem(key);
  });
  const useStreaming = true; // Always use streaming mode
  const [streamingCleanup, setStreamingCleanup] = useState<(() => void) | null>(null);
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
  // Additional filter states
  const [location, setLocation] = useState<string>('');
  const [ageMin, setAgeMin] = useState<number>(0);
  const [ageMax, setAgeMax] = useState<number>(18);
  const [maxPrice, setMaxPrice] = useState<number>(100);
  // Date helpers are handled within DateRangePicker
  // MessagesList will handle scroll management
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

  // Legacy scroll helpers removed; managed by MessagesList

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      const key = getChatStorageKey(userId);
      const data = {
        messages,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist chat messages:', error);
    }
  }, [messages, userId]);

  // Persist session ID when it changes
  useEffect(() => {
    if (sessionId) {
      const key = getSessionStorageKey(userId);
      localStorage.setItem(key, sessionId);
    }
  }, [sessionId, userId]);

  // Clear chat function
  const clearChat = () => {
    const defaultMessages = getDefaultMessages();
    setMessages(defaultMessages);
    setSessionId(null);
    onSuggestedEvents([]); // Clear suggested events
    if (onClearEvents) {
      onClearEvents(); // Clear accumulated events
    }
    const chatKey = getChatStorageKey(userId);
    const sessionKey = getSessionStorageKey(userId);
    localStorage.removeItem(chatKey);
    localStorage.removeItem(sessionKey);
    console.log('Chat cleared');
  };

  // MessagesList auto-scrolls on updates

  // Cleanup streaming connections on unmount
  useEffect(() => {
    return () => {
      if (streamingCleanup) {
        streamingCleanup();
      }
    };
  }, [streamingCleanup]);

  const handleSendMessage = async (moreLikeEventId?: string | number) => {
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
      await handleStreamingMessage(userMessage.content, moreLikeEventId);
    } else {
      await handleRegularMessage(userMessage.content, moreLikeEventId);
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

  const handleStreamingMessage = async (message: string, moreLikeEventId?: string | number) => {
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
        // Remove the empty streaming message
        setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));

        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: 'Sorry, I\'m having trouble connecting to the chat service. Please check that the backend is running.',
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
        },
        more_like_event_id: moreLikeEventId
      },
      // Single model mode
      true
    );

    setStreamingCleanup(() => cleanup);
  };

  // Handler for "Find more like this" button
  const handleFindMoreLike = useCallback((event: Event) => {
    const message = `Find more events like "${event.title}"`;
    setInputMessage(message);
    // Call parent handler if provided
    if (onFindMoreLike) {
      onFindMoreLike(event);
    }
    // Trigger send with the event ID
    setTimeout(() => {
      handleSendMessage(event.id);
    }, 100);
  }, [onFindMoreLike]);

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

  const handleRegularMessage = async (message: string, moreLikeEventId?: string | number) => {
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
        },
        more_like_event_id: moreLikeEventId
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


  if (!isVisible) return null;

  return (
    <div className="chat-interface" aria-busy={isLoading}>
      <div className="chat-header">
        <SearchPreferencesBar
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateChange={({ from, to }) => {
            setDateFrom(from);
            setDateTo(to);
          }}
          location={location}
          onLocationChange={setLocation}
          ageMin={ageMin}
          ageMax={ageMax}
          onAgeChange={(min, max) => {
            setAgeMin(min);
            setAgeMax(max);
          }}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
        />
      </div>

      <MessagesList messages={messages} streaming={useStreaming} isLoading={isLoading} />


      <ChatComposer
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSendMessage}
        disabled={isLoading}
      />
    </div>
  );
}
