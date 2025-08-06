import { useEffect, useState, useRef } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
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

  const { user } = useAuth();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || !user?.token) {
      return;
    }
    fetchedRef.current = true;

    async function loadEvents() {
      try {
        const res = await fetch(EVENTS_ENDPOINTS.list, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((e) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
          }));
          setEvents(mapped);
        }
      } catch (err) {
        console.error('Failed to load events', err);
      }
    }
    loadEvents();
  }, [user]);

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
