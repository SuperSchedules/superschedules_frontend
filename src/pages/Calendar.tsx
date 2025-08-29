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
import { EVENTS_ENDPOINTS } from '../constants/api';
import { useAuth } from '../auth';
import DualChatInterface from '../components/DualChatInterface';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  date: string;
  start_time?: string;
  end_time?: string;
}

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

// Simple text cleaner - backend should now provide clean data
const cleanText = (text: string): string => {
  if (!text) return '';
  
  // Just normalize whitespace and handle any stray newlines
  return text.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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
        const combineDateTime = (date: string, time?: string): Date => {
          if (!date) return new Date();
          
          try {
            const dateStr = date || '';
            const timeStr = time || '';
            
            // If date already has time information, use it directly
            if (dateStr && dateStr.includes('T')) {
              const parsedDate = new Date(dateStr);
              return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
            }
            
            // Otherwise, combine date and time into an ISO string
            const combinedDateTime = new Date(`${dateStr}${timeStr ? `T${timeStr}` : ''}`);
            return isNaN(combinedDateTime.getTime()) ? new Date() : combinedDateTime;
          } catch (error) {
            console.error('Error parsing date:', date, time, error);
            return new Date();
          }
        };

        const mapped = res.data.map((e: any): CalendarEvent => ({
          ...e,
          start: e.start_time ? new Date(e.start_time) : new Date(),
          end: e.end_time ? new Date(e.end_time) : new Date(),
        }));
        setEvents(mapped);
      } catch (err) {
        console.error('Failed to load events', err);
      }
    }

    loadEvents();
  }, [user, authFetch, currentView, currentDate, rangeStart, rangeEnd]);

  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const toggleEventExpansion = (eventId: number) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  return (
    <div className="calendar-page-new">
      {/* Chat Section at Top */}
      <div className="chat-section-separate">
        <DualChatInterface 
          onSuggestedEvents={setSuggestedEvents}
          onSuggestionsLoading={setLoadingSuggestions}
          onCalendarUpdate={(newEvents) => {
            // Add suggested events to the calendar events
            setEvents(prev => [...prev, ...newEvents]);
          }}
          suggestedEvents={suggestedEvents}
          loadingSuggestions={loadingSuggestions}
        />
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="main-content">
        
        {/* Left Side - Compact Event List (1/3 max width) */}
        <div className="events-sidebar">
          <h2>Recommended Events</h2>
          {loadingSuggestions ? (
            <div className="loading-suggestions">
              <div className="loading-spinner"></div>
              <span>Finding recommendations...</span>
            </div>
          ) : suggestedEvents.length > 0 ? (
            <div className="compact-events-list">
              {suggestedEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={`compact-event-card ${expandedEvent === event.id ? 'expanded' : ''}`}
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  {/* Always visible: date, title, truncated description */}
                  <div className="event-header">
                    {event.start_time && (
                      <div className="event-date">
                        {format(new Date(event.start_time), 'MMM d')}
                        {event.start_time && event.end_time && (
                          <span className="event-time">
                            {format(new Date(event.start_time), 'h:mm a')}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="event-title">{cleanText(event.title)}</div>
                    {event.description && (
                      <div className="event-description-preview">
                        {cleanText(event.description).length > 80 
                          ? `${cleanText(event.description).substring(0, 80)}...`
                          : cleanText(event.description)
                        }
                      </div>
                    )}
                  </div>
                  
                  {/* Expandable details */}
                  {expandedEvent === event.id && (
                    <div className="event-details">
                      {event.description && (
                        <p><strong>Full Description:</strong> {cleanText(event.description)}</p>
                      )}
                      {event.location && (
                        <p><strong>Location:</strong> {cleanText(event.location)}</p>
                      )}
                      {event.start_time && event.end_time && (
                        <p><strong>Time:</strong> {format(new Date(event.start_time), 'p')} - {format(new Date(event.end_time), 'p')}</p>
                      )}
                      {event.url && (
                        <p><a href={event.url} target="_blank" rel="noopener noreferrer">More info</a></p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-recommendations">
              Ask me about events and I'll show personalized recommendations here!
            </p>
          )}
        </div>

        {/* Right Side - Calendar */}
        <div className="calendar-main">
          <div className="range-controls">
            <label>
              Start
              <input
                type="date"
                value={rangeStart}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRangeStart(e.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="date"
                value={rangeEnd}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRangeEnd(e.target.value)}
              />
            </label>
          </div>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={[ 'month', 'week', 'day' ]}
            view={currentView}
            date={currentDate}
            onView={(view) => setCurrentView(view)}
            onNavigate={(date) => setCurrentDate(date)}
            style={{ height: 500 }}
            onSelectEvent={(event) => setSelectedEvent(event)}
            tooltipAccessor={(event) => {
              const parts = [event.title];
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
          {selectedEvent && (
            <dialog open className="event-dialog">
              <h2>{selectedEvent.title}</h2>
              {selectedEvent.description && <p>{selectedEvent.description}</p>}
              <button onClick={() => setSelectedEvent(null)}>Close</button>
            </dialog>
          )}
        </div>
      </div>
    </div>
  );
}
