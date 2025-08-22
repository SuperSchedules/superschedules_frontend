import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth.jsx';
import { ChatService } from '../services/chatService.js';
import './ChatInterface.css';

export default function ChatInterface({ 
  onSuggestedEvents, 
  onSuggestionsLoading,
  onCalendarUpdate,
  suggestedEvents = [],
  loadingSuggestions = false,
  isVisible = true 
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm here to help you find events. Tell me what you're looking for - like activities for specific ages, locations, or timeframes.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { authFetch } = useAuth();
  const [chatService] = useState(() => new ChatService(authFetch));

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
        // Add any relevant context
        location: null, // Could be extracted from user preferences
        preferences: {}
      });

      if (response.success) {
        const assistantMessage = {
          id: response.data.id,
          type: 'assistant',
          content: response.data.content,
          timestamp: response.data.timestamp,
          followUpQuestions: response.data.followUpQuestions || []
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Fetch and update suggested events if we have event IDs
        if (response.data.suggestedEventIds && response.data.suggestedEventIds.length > 0) {
          onSuggestionsLoading && onSuggestionsLoading(true);
          
          try {
            const eventsResponse = await chatService.fetchEventsByIds(response.data.suggestedEventIds);
            if (eventsResponse.success && eventsResponse.data.length > 0) {
              onSuggestedEvents(eventsResponse.data);
            } else if (import.meta.env.DEV) {
              // Fallback to mock events in development
              const mockEvents = chatService.generateMockEventsFromIds(response.data.suggestedEventIds);
              onSuggestedEvents(mockEvents);
            } else {
              // Show error message for failed event fetching
              const errorMessage = {
                id: Date.now() + 2,
                type: 'assistant',
                content: 'I found some relevant events, but there was an issue loading the details. Please try again or contact support if the problem persists.',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              onSuggestionsLoading && onSuggestionsLoading(false);
            }
          } catch (error) {
            console.error('Error fetching suggested events:', error);
            // In development, show mock events as fallback
            if (import.meta.env.DEV) {
              const mockEvents = chatService.generateMockEventsFromIds(response.data.suggestedEventIds);
              onSuggestedEvents(mockEvents);
            } else {
              // Show error message to user
              const errorMessage = {
                id: Date.now() + 2,
                type: 'assistant',
                content: 'I found some relevant events, but there was an issue loading the details. Please try again or contact support if the problem persists.',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              onSuggestionsLoading && onSuggestionsLoading(false);
            }
          }
        }
        
        // Add follow-up questions as separate messages if they exist
        if (response.data.followUpQuestions && response.data.followUpQuestions.length > 0) {
          setTimeout(() => {
            const followUpMessage = {
              id: Date.now() + 1,
              type: 'assistant',
              content: "I have a few follow-up questions to help me find better matches:\n• " + response.data.followUpQuestions.join('\n• '),
              timestamp: new Date()
            };
            setMessages(prev => [...prev, followUpMessage]);
          }, 1000);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible) return null;

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Event Assistant</h3>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
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
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
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
          placeholder="Ask me about events... (e.g., 'I need activities for 3-5 year olds in Newton this weekend')"
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