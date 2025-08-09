import { useEffect, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
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
import { useAuth } from '../auth.jsx';

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
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

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
        const combineDateTime = (date, time) => {
          if (!date && !time) return undefined;
          const dateStr = date || '';
          const timeStr = time || '';
          // If date already has time information, use it directly
          if (dateStr && dateStr.includes('T')) return new Date(dateStr);
          // Otherwise, combine date and time into an ISO string
          return new Date(`${dateStr}${timeStr ? `T${timeStr}` : ''}`);
        };

        const mapped = res.data.map((e) => ({
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

  return (
    <div className="calendar-page">
      <h1>Calendar</h1>
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
  );
}
