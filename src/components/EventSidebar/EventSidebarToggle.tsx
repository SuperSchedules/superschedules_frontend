interface EventSidebarToggleProps {
  eventCount: number;
  onClick: () => void;
}

export default function EventSidebarToggle({ eventCount, onClick }: EventSidebarToggleProps) {
  if (eventCount === 0) return null;

  return (
    <button
      className="events-sidebar-toggle"
      onClick={onClick}
      aria-label="Toggle events sidebar"
    >
      <i className="bi bi-calendar-event"></i>
      <span className="event-count">{eventCount}</span>
    </button>
  );
}
