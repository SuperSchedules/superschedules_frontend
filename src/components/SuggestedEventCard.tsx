import { format } from 'date-fns';
import type { Event } from '../types';
import { formatEventLocation, getEventFullAddress, getEventCoordinates } from '../utils';

interface SuggestedEventCardProps {
  event: Event;
}

export default function SuggestedEventCard({ event }: SuggestedEventCardProps) {
  const locationDisplay = formatEventLocation(event);
  const coordinates = getEventCoordinates(event);
  const fullAddress = getEventFullAddress(event);

  // Generate maps link - prefer coordinates for accuracy, fallback to address search
  const getMapsUrl = () => {
    if (coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
    } else if (fullAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    }
    return null;
  };

  const mapsUrl = getMapsUrl();

  return (
    <div className="suggested-event-card-full">
      {/* Top line: Title and Location */}
      <div className="event-header">
        <h4 className="event-title">{event.title}</h4>
        {locationDisplay && locationDisplay !== 'Location TBD' && (
          <div className="event-location">
            <i className="bi bi-geo-alt-fill"></i>
            <span>{locationDisplay}</span>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="directions-link"
              >
                Directions
              </a>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <div className="event-description">{event.description}</div>
      )}

      {/* Meta tags at the bottom */}
      <div className="event-meta">
        {event.start_time && (
          <span className="meta-tag meta-time">
            {format(new Date(event.start_time), 'EEEE MMM d, yyyy • h:mm a')}
          </span>
        )}
        {event.age_range && (
          <span className="meta-tag meta-age">
            <i className="bi bi-people-fill"></i>
            Ages {event.age_range}
          </span>
        )}
        {event.price && (
          <span className="meta-tag meta-price">
            <i className="bi bi-currency-dollar"></i>
            {event.price}
          </span>
        )}
        {event.organizer && (
          <span className="meta-tag meta-organizer">
            <i className="bi bi-building"></i>
            {event.organizer}
          </span>
        )}
        {(event.tags || event.metadata_tags) && (
          <>
            {(event.tags || event.metadata_tags || []).slice(0, 3).map((tag, index) => (
              <span key={index} className="meta-tag meta-category">
                <i className="bi bi-tag-fill"></i>
                {tag}
              </span>
            ))}
          </>
        )}
      </div>

      {/* View Details button */}
      {event.url && (
        <div className="event-actions">
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="view-event-btn"
          >
            <i className="bi bi-box-arrow-up-right"></i>
            View Details
          </a>
        </div>
      )}
    </div>
  );
}

