import type { Event, Venue } from '../types';

/**
 * Formats a human-friendly location string for an event.
 * Priority: venue + room_name > venue only > legacy location > fallback
 */
export function formatEventLocation(event: Event): string {
  if (event.venue) {
    if (event.room_name) {
      // Example: "Children's Room, Newton Free Library"
      return `${event.room_name}, ${event.venue.name}`;
    } else {
      // Example: "Newton Free Library"
      return event.venue.name;
    }
  } else if (event.place?.name) {
    // Legacy place fallback
    return event.place.name;
  } else if (event.location) {
    // Legacy location string fallback
    return event.location;
  } else {
    return 'Location TBD';
  }
}

/**
 * Formats the full street address for a venue.
 * Example: "330 Homer Street, Newton, MA 02459"
 */
export function formatVenueAddress(venue: Venue): string {
  return `${venue.street_address}, ${venue.city}, ${venue.state} ${venue.postal_code}`;
}

/**
 * Gets the full address string for an event, preferring venue data.
 * Returns null if no address information is available.
 */
export function getEventFullAddress(event: Event): string | null {
  if (event.venue) {
    return formatVenueAddress(event.venue);
  } else if (event.place?.address) {
    return event.place.address;
  } else if (event.location) {
    return event.location;
  }
  return null;
}

/**
 * Gets the venue name for an event.
 * Prefers venue.name over place.name over location string.
 */
export function getEventVenueName(event: Event): string | null {
  if (event.venue) {
    return event.venue.name;
  } else if (event.place?.name) {
    return event.place.name;
  }
  return null;
}

/**
 * Gets the city for an event from venue data.
 * Returns null if no venue or city information is available.
 */
export function getEventCity(event: Event): string | null {
  return event.venue?.city ?? null;
}

/**
 * Gets coordinates for an event, preferring venue over legacy place.
 * Returns null if no coordinates are available.
 */
export function getEventCoordinates(event: Event): { latitude: number; longitude: number } | null {
  if (event.venue?.latitude && event.venue?.longitude) {
    return {
      latitude: event.venue.latitude,
      longitude: event.venue.longitude,
    };
  } else if (event.place?.latitude && event.place?.longitude) {
    return {
      latitude: event.place.latitude,
      longitude: event.place.longitude,
    };
  }
  return null;
}

/**
 * Gets the telephone number for an event venue.
 */
export function getEventVenuePhone(event: Event): string | null {
  return event.venue?.telephone ?? event.place?.telephone ?? null;
}

/**
 * Checks if an event has coordinates (for map display).
 */
export function eventHasCoordinates(event: Event): boolean {
  return getEventCoordinates(event) !== null;
}
