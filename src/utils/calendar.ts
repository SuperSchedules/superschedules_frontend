import { format, addHours } from 'date-fns';
import type { Event } from '../types';
import { formatEventLocation, getEventFullAddress } from './eventLocation';

/**
 * Format a date for Google Calendar URL (YYYYMMDDTHHmmssZ format)
 */
function formatGoogleCalendarDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

/**
 * Format a date for ICS file (YYYYMMDDTHHmmss format)
 */
function formatIcsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

/**
 * Parse event date, handling UTC strings that should be treated as local time
 */
function parseEventDate(dateStr: string | Date): Date {
  if (typeof dateStr === 'string') {
    const localStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
    return new Date(localStr);
  }
  return new Date(dateStr);
}

/**
 * Get the location string for calendar entries
 */
function getCalendarLocation(event: Event): string {
  const fullAddress = getEventFullAddress(event);
  const locationName = formatEventLocation(event);

  if (fullAddress && locationName && fullAddress !== locationName) {
    return `${locationName}, ${fullAddress}`;
  }
  return fullAddress || locationName || '';
}

/**
 * Get start and end dates for an event
 */
function getEventDates(event: Event): { start: Date; end: Date } {
  const startDate = event.start_time
    ? parseEventDate(event.start_time)
    : event.start
    ? parseEventDate(event.start)
    : new Date();

  let endDate: Date;
  if (event.end_time) {
    endDate = parseEventDate(event.end_time);
  } else if (event.end) {
    endDate = parseEventDate(event.end);
  } else {
    // Default to 1 hour after start
    endDate = addHours(startDate, 1);
  }

  return { start: startDate, end: endDate };
}

/**
 * Generate a Google Calendar URL for an event
 */
export function generateGoogleCalendarUrl(event: Event): string {
  const { start, end } = getEventDates(event);
  const location = getCalendarLocation(event);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`,
  });

  if (event.description) {
    params.set('details', event.description);
  }
  if (location) {
    params.set('location', location);
  }
  if (event.url) {
    const details = params.get('details') || '';
    params.set('details', details ? `${details}\n\nMore info: ${event.url}` : event.url);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook Web Calendar URL for an event
 */
export function generateOutlookCalendarUrl(event: Event): string {
  const { start, end } = getEventDates(event);
  const location = getCalendarLocation(event);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  if (event.description) {
    params.set('body', event.description);
  }
  if (location) {
    params.set('location', location);
  }

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/**
 * Escape special characters for ICS format
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate ICS file content for an event
 */
export function generateIcsContent(event: Event): string {
  const { start, end } = getEventDates(event);
  const location = getCalendarLocation(event);
  const now = new Date();

  let description = event.description || '';
  if (event.url) {
    description = description ? `${description}\\n\\nMore info: ${event.url}` : event.url;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventZombie//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@eventzombie.com`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  }
  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Trigger download of an ICS file for an event
 */
export function downloadIcsFile(event: Event): void {
  const content = generateIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
