interface EventSidebarHeaderProps {
  isMobile: boolean;
  onClose: () => void;
}

export default function EventSidebarHeader({ isMobile, onClose }: EventSidebarHeaderProps) {
  return (
    <div className="events-sidebar-header">
      <h3>
        Events
      </h3>
      {isMobile && (
        <button
          className="close-sidebar"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      )}
    </div>
  );
}
