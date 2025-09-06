import React from 'react';
import type { Event } from '../types';
import SuggestedEventCard from './SuggestedEventCard';

interface SuggestedEventsListProps {
  events: Event[];
  loading?: boolean;
}

export default function SuggestedEventsList({ events, loading = false }: SuggestedEventsListProps) {
  if (!loading && (!events || events.length === 0)) return null;
  return (
    <div className="suggested-events-section">
      <h3>Suggested Events</h3>
      {loading ? (
        <div className="loading-suggestions">
          <div className="loading-spinner"></div>
          <span>Finding relevant events...</span>
        </div>
      ) : (
        <div className="suggested-events-list">
          {events.map((event) => (
            <SuggestedEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

