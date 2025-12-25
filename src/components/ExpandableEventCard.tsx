import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import type { Event } from '../types';
import {
  formatEventLocation,
  formatVenueAddress,
  getEventCoordinates,
  getEventVenuePhone,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadIcsFile,
} from '../utils';
import './ExpandableEventCard.css';

interface ExpandableEventCardProps {
  event: Event;
  onFindMoreLike: (event: Event) => void;
}

// Decode common HTML entities in text
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}

export default function ExpandableEventCard({ event, onFindMoreLike }: ExpandableEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const calendarMenuRef = useRef<HTMLDivElement>(null);

  // Close calendar menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(event.target as Node)) {
        setCalendarMenuOpen(false);
      }
    }
    if (calendarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [calendarMenuOpen]);

  // Get location info using helpers - prefers venue over legacy place/location
  const locationName = formatEventLocation(event);
  const coordinates = getEventCoordinates(event);
  const hasCoordinates = coordinates !== null;
  const venuePhone = getEventVenuePhone(event);

  // Check if room_name is redundant (contains or equals venue name)
  const venueName = event.venue?.name || event.place?.name;
  const showRoomName = event.room_name && venueName &&
    !event.room_name.toLowerCase().includes(venueName.toLowerCase());

  // Get full address - prefer venue structured address over legacy
  const fullAddress = event.venue
    ? formatVenueAddress(event.venue)
    : event.place?.address || event.location || '';

  // Generate OpenStreetMap embed URL
  const getMapEmbedUrl = () => {
    if (hasCoordinates && coordinates) {
      const { latitude: lat, longitude: lon } = coordinates;
      // Calculate bounding box (roughly 0.01 degrees = ~1km)
      const bbox = `${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}`;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
    }
    return null;
  };

  const mapUrl = getMapEmbedUrl();

  // Generate link to full map (for cases without coordinates, use search)
  const getMapLinkUrl = () => {
    if (hasCoordinates && coordinates) {
      const { latitude: lat, longitude: lon } = coordinates;
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
    } else if (fullAddress) {
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(fullAddress)}`;
    }
    return null;
  };

  const mapLinkUrl = getMapLinkUrl();

  // Parse date/time - handle UTC strings that should be treated as local time
  const parseEventDate = (dateStr: string | Date): Date => {
    if (typeof dateStr === 'string') {
      // If the string ends with Z (UTC), strip it to treat as local time
      // This fixes timezone issues where backend sends local times tagged as UTC
      const localStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
      return new Date(localStr);
    }
    return new Date(dateStr);
  };

  const eventDate = event.start_time
    ? parseEventDate(event.start_time)
    : event.start
    ? parseEventDate(event.start)
    : null;
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
                {format(eventDate, 'EEE MMM d')} {formattedTime && `at ${formattedTime}`}
              </span>
            )}
            {(fullAddress || locationName) && (
              <span className="quick-info-item">
                <i className="bi bi-geo-alt"></i>
                {fullAddress || locationName}
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
            {venueName && (
              <div className="venue-name">{venueName}</div>
            )}
            {showRoomName && (
              <div className="room-name">{event.room_name}</div>
            )}
            {fullAddress && <div className="venue-address">{fullAddress}</div>}
            {venuePhone && (
              <div className="venue-phone">
                <i className="bi bi-telephone"></i> {venuePhone}
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="event-description">
              <p>{decodeHtmlEntities(event.description)}</p>
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
            <div className="calendar-dropdown" ref={calendarMenuRef}>
              <button
                className="btn-add-calendar"
                onClick={(e) => {
                  e.stopPropagation();
                  setCalendarMenuOpen(!calendarMenuOpen);
                }}
              >
                <i className="bi bi-calendar-plus"></i>
                Add to Calendar
                <i className={`bi bi-chevron-${calendarMenuOpen ? 'up' : 'down'} chevron-icon`}></i>
              </button>
              {calendarMenuOpen && (
                <ul className="calendar-menu">
                  <li>
                    <a
                      href={generateGoogleCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalendarMenuOpen(false);
                      }}
                    >
                      <i className="bi bi-google"></i>
                      Google Calendar
                    </a>
                  </li>
                  <li>
                    <a
                      href={generateOutlookCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalendarMenuOpen(false);
                      }}
                    >
                      <i className="bi bi-microsoft"></i>
                      Outlook
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadIcsFile(event);
                        setCalendarMenuOpen(false);
                      }}
                    >
                      <i className="bi bi-download"></i>
                      Download .ics
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
