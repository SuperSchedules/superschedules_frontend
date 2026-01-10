import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import ChatInterface from '../components/ChatInterface';
import EventSidebar from '../components/EventSidebar';
import { useEventsState } from '../hooks/useEventsState';
import type { Event } from '../types/index';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use events state hook for managing recommended vs all events
  const {
    recommended,
    all,
    isLoading,
    addRecommendedEvents,
    clearAll,
    setLoading,
  } = useEventsState();

  // Handle suggested events from chat - these become the new recommended list
  const handleSuggestedEvents = useCallback((newEvents: Event[]) => {
    // Extract event IDs in order - these are the recommended events
    const recommendedIds = newEvents.map(e => e.id);
    addRecommendedEvents(recommendedIds, newEvents);
  }, [addRecommendedEvents]);

  // Clear all events (called from ChatInterface clearChat)
  const handleClearEvents = useCallback(() => {
    clearAll();
  }, [clearAll]);

  // Handler for "Find more like this"
  const handleFindMoreLike = useCallback((event: Event) => {
    console.log('Finding more events like:', event.title);
    // The actual logic is handled in ChatInterface
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="home-page">
      <div className="home-layout">
        <div className="chat-column">
          <ChatInterface
            onSuggestedEvents={handleSuggestedEvents}
            onSuggestionsLoading={setLoading}
            onFindMoreLike={handleFindMoreLike}
            onClearEvents={handleClearEvents}
            suggestedEvents={all}
            loadingSuggestions={isLoading}
            isVisible={true}
          />
        </div>
        <div className="events-column">
          <EventSidebar
            events={all}
            recommendedEvents={recommended}
            loading={isLoading}
            onFindMoreLike={handleFindMoreLike}
          />
        </div>
      </div>
    </div>
  );
}
