import { useEffect, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { EVENTS_ENDPOINTS } from '../constants/api.js';

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
  const [range, setRange] = useState(null);

  useEffect(() => {
    if (!range) return;
    async function loadEvents() {
      try {
        const params = new URLSearchParams({
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        });
        const res = await fetch(`${EVENTS_ENDPOINTS.list}?${params}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((e) => ({
            ...e,
            start: new Date(e.start ?? e.start_time),
            end: new Date(e.end ?? e.end_time),
          }));
          setEvents(mapped);
        }
      } catch (err) {
        console.error('Failed to load events', err);
      }
    }
    loadEvents();
  }, [range]);

  const handleRangeChange = (r) => {
    let start;
    let end;
    if (Array.isArray(r)) {
      start = r[0];
      end = r[r.length - 1];
    } else {
      ({ start, end } = r);
    }
    setRange((prev) => {
      if (
        prev &&
        prev.start.getTime() === start.getTime() &&
        prev.end.getTime() === end.getTime()
      ) {
        return prev;
      }
      return { start, end };
    });
  };

  return (
    <div className="calendar-page">
      <h1>Calendar</h1>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[ 'month', 'week', 'day' ]}
        style={{ height: 500 }}
        onSelectEvent={(event) => setSelectedEvent(event)}
        onRangeChange={handleRangeChange}
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
