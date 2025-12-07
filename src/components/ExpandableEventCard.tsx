import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import type { Event } from '../types';
import './ExpandableEventCard.css';

interface ExpandableEventCardProps {
  event: Event;
  onFindMoreLike: (event: Event) => void;
}

export default function ExpandableEventCard({ event, onFindMoreLike }: ExpandableEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get location info from place or fallback to location string
  const locationName = event.place?.name || event.location || 'Location TBA';
  const locationAddress = event.place?.address || event.location || '';
  const hasCoordinates = event.place?.latitude && event.place?.longitude;

  // Generate OpenStreetMap embed URL
  const getMapEmbedUrl = () => {
    if (hasCoordinates) {
      const lat = event.place!.latitude!;
      const lon = event.place!.longitude!;
      // Calculate bounding box (roughly 0.01 degrees = ~1km)
      const bbox = `${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}`;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
    }
    return null;
  };

  const mapUrl = getMapEmbedUrl();

  // Generate link to full map (for cases without coordinates, use search)
  const getMapLinkUrl = () => {
    if (hasCoordinates) {
      const lat = event.place!.latitude!;
      const lon = event.place!.longitude!;
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
    } else if (locationAddress) {
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(locationAddress)}`;
    }
    return null;
  };

  const mapLinkUrl = getMapLinkUrl();

  // Format date/time
  const eventDate = event.start_time ? new Date(event.start_time) : event.start ? new Date(event.start) : null;
  const formattedDate = eventDate ? format(eventDate, 'EEEE, MMMM d, yyyy') : 'Date TBA';
  const formattedTime = eventDate ? format(eventDate, 'h:mm a') : '';

  // Generate mini calendar grid
  const generateCalendarDays = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the day of week for the first day (0 = Sunday)
    const firstDayOfWeek = getDay(monthStart);

    // Add empty slots for days before the month starts
    const emptySlots = Array(firstDayOfWeek).fill(null);

    return [...emptySlots, ...daysInMonth];
  };

  const calendarDays = eventDate ? generateCalendarDays(eventDate) : [];

  // Get tags
  const tags = event.metadata_tags || event.tags || [];

  return (
    <div className={`expandable-event-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Collapsed view - always visible */}
      <div className="event-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="event-card-summary">
          <h4 className="event-title">{event.title}</h4>
          <div className="event-quick-info">
            {eventDate && (
              <span className="quick-info-item">
                <i className="bi bi-calendar3"></i>
                {format(eventDate, 'MMM d')}
              </span>
            )}
            {locationName && (
              <span className="quick-info-item">
                <i className="bi bi-geo-alt"></i>
                {locationName}
              </span>
            )}
          </div>
        </div>
        <button className="expand-toggle" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </button>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="event-card-details">
          {/* Calendar and Map Side by Side */}
          <div className="calendar-map-row">
            {/* Mini Calendar Visual */}
            {eventDate && (
              <div className="mini-calendar">
                <div className="calendar-header">
                  <div className="calendar-day-name">{format(eventDate, 'EEEE')}</div>
                  <div className="calendar-date-line">
                    {format(eventDate, 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    <span>S</span>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                  </div>
                  <div className="calendar-days">
                    {calendarDays.map((day, idx) => (
                      <div
                        key={idx}
                        className={`calendar-day-cell ${
                          day && isSameDay(day, eventDate) ? 'highlighted' : ''
                        } ${!day ? 'empty' : ''}`}
                      >
                        {day && isSameDay(day, eventDate) ? format(day, 'd') : ''}
                      </div>
                    ))}
                  </div>
                </div>
                {formattedTime && (
                  <div className="calendar-time">
                    <i className="bi bi-clock"></i> {formattedTime}
                  </div>
                )}
              </div>
            )}

            {/* Map - only show if we have coordinates */}
            {mapUrl && (
              <div className="event-map">
                <iframe
                  width="100%"
                  height="150"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={mapUrl}
                  title={`Map of ${locationName}`}
                ></iframe>
                <div className="map-link">
                  <a
                    href={mapLinkUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-arrow-up-right-square"></i> View on Map
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Location Details */}
          <div className="location-details">
            <h5><i className="bi bi-geo-alt-fill"></i> Location</h5>
            {event.place?.name && <div className="venue-name">{event.place.name}</div>}
            {locationAddress && <div className="venue-address">{locationAddress}</div>}
            {event.place?.telephone && (
              <div className="venue-phone">
                <i className="bi bi-telephone"></i> {event.place.telephone}
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="event-description">
              <h5>About</h5>
              <p>{event.description}</p>
            </div>
          )}

          {/* Metadata Badges */}
          <div className="event-metadata">
            {event.price && (
              <span className="metadata-badge badge-price">
                <i className="bi bi-currency-dollar"></i>
                {event.price === 'Free' || event.price === '0' ? 'Free' : event.price}
              </span>
            )}
            {event.age_range && (
              <span className="metadata-badge badge-age">
                <i className="bi bi-people"></i>
                Ages {event.age_range}
              </span>
            )}
            {event.organizer && (
              <span className="metadata-badge badge-organizer">
                <i className="bi bi-building"></i>
                {event.organizer}
              </span>
            )}
            {event.event_attendance_mode && (
              <span className="metadata-badge badge-attendance">
                <i className={`bi bi-${event.event_attendance_mode === 'online' ? 'laptop' : event.event_attendance_mode === 'offline' ? 'pin-map' : 'hybrid'}`}></i>
                {event.event_attendance_mode.charAt(0).toUpperCase() + event.event_attendance_mode.slice(1)}
              </span>
            )}
            {event.event_status && event.event_status !== 'scheduled' && (
              <span className={`metadata-badge badge-status status-${event.event_status}`}>
                <i className="bi bi-exclamation-circle"></i>
                {event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1)}
              </span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="event-tags">
              {tags.map((tag, idx) => (
                <span key={idx} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="event-actions">
            <button
              className="btn-find-more"
              onClick={(e) => {
                e.stopPropagation();
                onFindMoreLike(event);
              }}
            >
              <i className="bi bi-search"></i>
              Find more like this
            </button>
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-view-details"
                onClick={(e) => e.stopPropagation()}
              >
                <i className="bi bi-box-arrow-up-right"></i>
                View Details
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
