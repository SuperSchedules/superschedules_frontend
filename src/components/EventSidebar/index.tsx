import { useState, useEffect } from 'react';
import EventSidebarToggle from './EventSidebarToggle';
import EventSidebarHeader from './EventSidebarHeader';
import EventsPanel from './EventsPanel';
import type { Event } from '../../types';
import './EventSidebar.css';

interface EventSidebarProps {
  events: Event[];                    // All events (superset for map)
  recommendedEvents?: Event[];        // Recommended events (ordered, for list)
  loading?: boolean;
  onFindMoreLike: (event: Event) => void;
}

export default function EventSidebar({
  events,
  recommendedEvents,
  loading = false,
  onFindMoreLike
}: EventSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-open sidebar when events are added (desktop only)
  useEffect(() => {
    if (events.length > 0 && !isMobile) {
      setIsOpen(true);
    }
  }, [events.length, isMobile]);

  // Close on mobile when clicking overlay
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  if (events.length === 0 && !loading) {
    return null;
  }

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <EventSidebarToggle
          eventCount={events.length}
          onClick={() => setIsOpen(!isOpen)}
        />
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div className="events-sidebar-overlay" onClick={handleOverlayClick} />
      )}

      {/* Sidebar */}
      <aside className={`events-sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
        <EventSidebarHeader
          isMobile={isMobile}
          onClose={() => setIsOpen(false)}
        />

        <div className="events-sidebar-content">
          <EventsPanel
            events={events}
            recommendedEvents={recommendedEvents}
            loading={loading}
            onFindMoreLike={onFindMoreLike}
          />
        </div>
      </aside>
    </>
  );
}
