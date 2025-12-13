import { useState, useRef, useEffect } from 'react';
import ExpandableEventCard from '../ExpandableEventCard';
import EventsMap from '../EventsMap';
import type { Event } from '../../types';
import { eventHasCoordinates } from '../../utils';
import './EventsPanel.css';

interface EventsPanelProps {
  events: Event[];
  loading: boolean;
  onFindMoreLike: (event: Event) => void;
}

export default function EventsPanel({ events, loading, onFindMoreLike }: EventsPanelProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const eventRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());

  // Count events with coordinates for map display
  const eventsWithCoords = events.filter(eventHasCoordinates);
  const hasMapData = eventsWithCoords.length > 0;

  // Handle event selection from map
  const handleMapEventSelect = (id: string | number) => {
    setSelectedEventId(id);
    // Scroll to the event in the list
    const eventRef = eventRefs.current.get(id);
    if (eventRef) {
      eventRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle event selection from list (when card is expanded)
  const handleListEventSelect = (id: string | number) => {
    setSelectedEventId(id);
  };

  // Reset selection when events change
  useEffect(() => {
    setSelectedEventId(undefined);
  }, [events]);

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
    <div className="events-panel">
      {/* View Mode Toggle */}
      {hasMapData && (
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split view"
          >
            <i className="bi bi-layout-split"></i>
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List only"
          >
            <i className="bi bi-list-ul"></i>
          </button>
          <button
            className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            title="Map only"
          >
            <i className="bi bi-map"></i>
          </button>
        </div>
      )}

      <div className={`events-panel-content ${viewMode}`}>
        {/* Events List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className="events-list-section">
            <div className="events-count">
              {events.length} {events.length === 1 ? 'event' : 'events'} found
              {hasMapData && eventsWithCoords.length < events.length && (
                <span className="map-count">
                  ({eventsWithCoords.length} on map)
                </span>
              )}
            </div>
            <div className="events-list">
              {events.map((event) => (
                <div
                  key={event.id}
                  ref={(el) => {
                    if (el) {
                      eventRefs.current.set(event.id, el);
                    } else {
                      eventRefs.current.delete(event.id);
                    }
                  }}
                  className={`event-card-wrapper ${selectedEventId === event.id ? 'selected' : ''}`}
                  onClick={() => handleListEventSelect(event.id)}
                >
                  <ExpandableEventCard
                    event={event}
                    onFindMoreLike={onFindMoreLike}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {hasMapData && (viewMode === 'split' || viewMode === 'map') && (
          <div className="events-map-section">
            <EventsMap
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={handleMapEventSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
