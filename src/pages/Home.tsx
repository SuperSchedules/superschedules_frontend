import { useState, useCallback } from 'react';
import { useAuth } from '../auth';
import ChatInterface from '../components/ChatInterface';
import EventSidebar from '../components/EventSidebar';
import type { Event } from '../types/index';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [accumulatedEvents, setAccumulatedEvents] = useState<Event[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Accumulate events instead of replacing them
  const handleSuggestedEvents = useCallback((newEvents: Event[]) => {
    setAccumulatedEvents((prev) => {
      // Filter out duplicates by id
      const existingIds = new Set(prev.map(e => e.id));
      const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
      return [...prev, ...uniqueNewEvents];
    });
  }, []);

  // Clear accumulated events (will be called from ChatInterface clearChat)
  const handleClearEvents = useCallback(() => {
    setAccumulatedEvents([]);
  }, []);

  // Handler for "Find more like this"
  const handleFindMoreLike = useCallback((event: Event) => {
    console.log('Finding more events like:', event.title);
    // The actual logic is handled in ChatInterface
  }, []);

  if (!user) {
    return (
      <div className="home-page">
        <div className="welcome-message">
          <h1>Welcome to Superschedules</h1>
          <p>Please log in to start discovering events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-layout">
        <div className="chat-column">
          <ChatInterface
            onSuggestedEvents={handleSuggestedEvents}
            onSuggestionsLoading={setLoadingSuggestions}
            onFindMoreLike={handleFindMoreLike}
            onClearEvents={handleClearEvents}
            suggestedEvents={accumulatedEvents}
            loadingSuggestions={loadingSuggestions}
            isVisible={true}
          />
        </div>
        <div className="events-column">
          <EventSidebar
            events={accumulatedEvents}
            loading={loadingSuggestions}
            onFindMoreLike={handleFindMoreLike}
          />
        </div>
      </div>
    </div>
  );
}
