/**
 * Type-safe API mock factories
 *
 * These factories create mock data that matches the actual API schema.
 * If the backend API changes and types are regenerated, TypeScript will
 * error here if the mock data no longer matches.
 *
 * Usage in tests:
 *   import { createMockEvent, createMockVenue } from './mocks/api';
 *   const event = createMockEvent({ title: 'Custom Title' });
 */

import type { ApiEvent, ApiVenue, ApiSource, ApiUser } from '../../types/api';

/**
 * Creates a mock venue that matches the API schema
 */
export function createMockVenue(overrides: Partial<ApiVenue> = {}): ApiVenue {
  return {
    id: 1,
    name: 'Test Venue',
    street_address: '123 Main St',
    city: 'Boston',
    state: 'MA',
    postal_code: '02101',
    latitude: 42.3601,
    longitude: -71.0589,
    ...overrides,
  };
}

/**
 * Creates a mock event that matches the API schema
 */
export function createMockEvent(overrides: Partial<ApiEvent> = {}): ApiEvent {
  return {
    id: 1,
    external_id: 'ext-123',
    title: 'Test Event',
    description: 'A test event description',
    location: '',
    room_name: '',
    venue: null,
    start_time: new Date().toISOString(),
    end_time: null,
    url: 'https://example.com/event',
    metadata_tags: null,
    ...overrides,
  };
}

/**
 * Creates a mock event with a venue
 */
export function createMockEventWithVenue(
  eventOverrides: Partial<ApiEvent> = {},
  venueOverrides: Partial<ApiVenue> = {}
): ApiEvent {
  return createMockEvent({
    venue: createMockVenue(venueOverrides),
    ...eventOverrides,
  });
}

/**
 * Creates a mock source that matches the API schema
 */
export function createMockSource(overrides: Partial<ApiSource> = {}): ApiSource {
  return {
    id: 1,
    name: 'Test Source',
    base_url: 'https://example.com',
    search_method: 'manual',
    status: 'not_run',
    date_added: new Date().toISOString(),
    last_run_at: null,
    ...overrides,
  };
}

/**
 * Creates a mock user that matches the API schema
 */
export function createMockUser(overrides: Partial<ApiUser> = {}): ApiUser {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    ...overrides,
  };
}

/**
 * Creates an array of mock events
 */
export function createMockEvents(count: number, baseOverrides: Partial<ApiEvent> = {}): ApiEvent[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEvent({
      id: i + 1,
      external_id: `ext-${i + 1}`,
      title: `Test Event ${i + 1}`,
      ...baseOverrides,
    })
  );
}
