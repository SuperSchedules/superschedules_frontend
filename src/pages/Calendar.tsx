import { useEffect, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  getDay,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { EVENTS_ENDPOINTS } from '../constants/api.js';
import { useAuth } from '../auth.js';
import DualChatInterface from '../components/DualChatInterface.js';
import type { Event } from '../types/index.js';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [suggestedEvents, setSuggestedEvents] = useState<Event[]>([]);
  const [showChat, setShowChat] = useState<boolean>(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);

  const { user, authFetch } = useAuth();

  useEffect(() => {
    if (!user?.token) {
      return;
    }

    const { start, end } = (() => {
      if (rangeStart && rangeEnd) {
        return { start: new Date(rangeStart), end: new Date(rangeEnd) };
      }

      switch (currentView) {
        case 'day':
          return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
        case 'week':
          return {
            start: startOfWeek(currentDate, { weekStartsOn: 0 }),
            end: endOfWeek(currentDate, { weekStartsOn: 0 }),
          };
        case 'month':
        default:
          return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      }
    })();

    const params = new URLSearchParams({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });

    async function loadEvents() {
      try {
        const res = await authFetch.get(
          `${EVENTS_ENDPOINTS.list}?${params.toString()}`,
        );
        const combineDateTime = (date: string | null, time: string | null): Date | undefined => {
          if (!date && !time) return undefined;
          const dateStr = date || '';
          const timeStr = time || '';
          // If date already has time information, use it directly
          if (dateStr && dateStr.includes('T')) return new Date(dateStr);
          // Otherwise, combine date and time into an ISO string
          return new Date(`${dateStr}${timeStr ? `T${timeStr}` : ''}`);
        };

        const mapped = res.data.map((e: Event) => ({
          ...e,
          start: combineDateTime(e.start, e.start_time),
          end: combineDateTime(e.end, e.end_time),
        }));
        setEvents(mapped);
      } catch (err) {
        console.error('Failed to load events', err);
      }
    }

    loadEvents();
  }, [user, authFetch, currentView, currentDate, rangeStart, rangeEnd]);

  const handleSuggestedEvents = (newSuggestedEvents: Event[]) => {
    setSuggestedEvents(newSuggestedEvents);
    setLoadingSuggestions(false);
    // Note: We don't merge here anymore since we use displayEvents computed property
  };

  const handleSuggestionsLoading = (isLoading: boolean) => {
    setLoadingSuggestions(isLoading);
    if (isLoading) {
      setSuggestedEvents([]); // Clear previous suggestions while loading new ones
    }
  };

  const handleCalendarUpdate = (event: Event) => {
    // Navigate to the event's date and highlight it
    if (event.start) {
      setCurrentDate(new Date(event.start));
      setSelectedEvent(event);
    }
  };

  // Combine regular events with suggested events for display
  const displayEvents = [...events, ...suggestedEvents];

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>Calendar</h1>
        <button 
          className="chat-toggle"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? 'Hide A/B Chat' : 'Show A/B Chat'}
        </button>
      </div>
      
      <div className={`calendar-layout ${showChat ? 'with-chat' : 'full-width'}`}>
        <div className="calendar-section">
          <div className="range-controls">
            <label>
              Start
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
              />
            </label>
          </div>
          <BigCalendar
            localizer={localizer}
            events={displayEvents}
            startAccessor="start"
            endAccessor="end"
            views={[ 'month', 'week', 'day' ]}
            view={currentView}
            date={currentDate}
            onView={(view) => setCurrentView(view)}
            onNavigate={(date) => setCurrentDate(date)}
            style={{ height: 500 }}
            onSelectEvent={(event) => setSelectedEvent(event)}
            eventPropGetter={(event) => ({
              className: event.suggested ? 'suggested-event' : '',
              style: event.suggested ? {
                backgroundColor: '#28a745',
                border: '2px solid #1e7e34',
                opacity: 0.8
              } : {}
            })}
            tooltipAccessor={(event) => {
              const parts = [event.title];
              if (event.suggested) parts.push('💡 AI Suggested');
              if (event.description) parts.push(event.description);
              if (event.location) parts.push(event.location);
              if (event.start && event.end) {
                parts.push(
                  `${format(event.start, 'Pp')} - ${format(event.end, 'Pp')}`,
                );
              }
              return parts.join('\n');
            }}
          />
        </div>
        
        {showChat && (
          <div className="chat-section">
            <DualChatInterface
              onSuggestedEvents={handleSuggestedEvents}
              onSuggestionsLoading={handleSuggestionsLoading}
              onCalendarUpdate={handleCalendarUpdate}
              suggestedEvents={suggestedEvents}
              loadingSuggestions={loadingSuggestions}
              isVisible={showChat}
            />
          </div>
        )}
      </div>
      
      {selectedEvent && (
        <dialog open className="event-dialog">
          <h2>{selectedEvent.title}</h2>
          {selectedEvent.suggested && (
            <div className="suggested-badge">💡 AI Suggested Event</div>
          )}
          {selectedEvent.description && <p>{selectedEvent.description}</p>}
          {selectedEvent.location && <p><strong>Location:</strong> {selectedEvent.location}</p>}
          {selectedEvent.start && (
            <p><strong>Date:</strong> {format(new Date(selectedEvent.start), 'PPp')}</p>
          )}
          <button onClick={() => setSelectedEvent(null)}>Close</button>
        </dialog>
      )}
    </div>
  );
}
