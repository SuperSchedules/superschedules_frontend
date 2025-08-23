import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth.js';
import { ChatService } from '../services/chatService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import type { DualChatInterfaceProps, ChatMessage, Event } from '../types/index.js';
import './DualChatInterface.css';

export default function DualChatInterface({ 
  onSuggestedEvents, 
  onSuggestionsLoading,
  onCalendarUpdate,
  suggestedEvents = [],
  loadingSuggestions = false,
  isVisible = true 
}: DualChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm here to help you find events. Tell me what you're looking for - like activities for specific ages, locations, or timeframes.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'A' | 'B' | null>(null); // Track which model user prefers
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authFetch } = useAuth();
  const [chatService] = useState(() => new ChatService(authFetch));
  const [analyticsService] = useState(() => new AnalyticsService(authFetch));

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      const response = await chatService.sendMessage(userMessage.content, {
        location: null,
        preferences: {},
        session_id: sessionId,
        clear_suggestions: false
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
          onSuggestionsLoading && onSuggestionsLoading(true);
          
          try {
            const eventsResponse = await chatService.fetchEventsByIds(allSuggestedIds);
            if (eventsResponse.success && eventsResponse.data.length > 0) {
              onSuggestedEvents(eventsResponse.data);
            } else if (import.meta.env.DEV) {
              const mockEvents = chatService.generateMockEventsFromIds(allSuggestedIds);
              onSuggestedEvents(mockEvents);
            } else {
              onSuggestionsLoading && onSuggestionsLoading(false);
            }
          } catch (error) {
            console.error('Error fetching suggested events:', error);
            if (import.meta.env.DEV) {
              const mockEvents = chatService.generateMockEventsFromIds(allSuggestedIds);
              onSuggestedEvents(mockEvents);
            } else {
              const errorMessage = {
                id: Date.now() + 2,
                type: 'assistant',
                content: 'I found some relevant events, but there was an issue loading the details.',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              onSuggestionsLoading && onSuggestionsLoading(false);
            }
          }
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
        <h3>Event Assistant (A/B Testing)</h3>
        <div className="model-legend">
          <span className="model-a-label">Model A</span>
          <span className="model-b-label">Model B</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => {
          if (message.type === 'dual-assistant') {
            return (
              <div key={message.id} className="dual-message-container">
                <div className="dual-responses">
                  <div className={`model-response model-a ${message.selectedModel === 'A' ? 'selected' : ''}`}>
                    <div className="model-header">
                      <span className="model-name">{message.modelA.modelName}</span>
                      <span className="response-time">{message.modelA.responseTimeMs}ms</span>
                      {!message.modelA.success && <span className="error-indicator">❌</span>}
                    </div>
                    <div className="message-content">
                      {message.modelA.success ? message.modelA.content : 
                        `Error: ${message.modelA.error}`}
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
                      <span className="model-name">{message.modelB.modelName}</span>
                      <span className="response-time">{message.modelB.responseTimeMs}ms</span>
                      {!message.modelB.success && <span className="error-indicator">❌</span>}
                    </div>
                    <div className="message-content">
                      {message.modelB.success ? message.modelB.content : 
                        `Error: ${message.modelB.error}`}
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
                {message.content}
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
    </div>
  );
}