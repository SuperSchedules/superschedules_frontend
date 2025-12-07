import ExpandableEventCard from '../ExpandableEventCard';
import type { Event } from '../../types';

interface EventsListProps {
  events: Event[];
  loading: boolean;
  onFindMoreLike: (event: Event) => void;
}

export default function EventsList({ events, loading, onFindMoreLike }: EventsListProps) {
  if (loading && events.length === 0) {
    return (
      <div className="loading-state">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading events...</span>
        </div>
        <p>Finding events for you...</p>
      </div>
    );
  }

  return (
    <>
      <div className="events-count">
        {events.length} {events.length === 1 ? 'event' : 'events'} found
      </div>
      <div className="events-list">
        {events.map((event) => (
          <ExpandableEventCard
            key={event.id}
            event={event}
            onFindMoreLike={onFindMoreLike}
          />
        ))}
      </div>
    </>
  );
}
