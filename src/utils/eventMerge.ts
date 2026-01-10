import type { Event, EventsState } from '../types/index';

/**
 * Merge incoming events into the existing events map without duplicates.
 * Returns a new Record with all events (preserves existing, adds new).
 *
 * @param existing - Current events keyed by ID
 * @param incoming - New events to merge
 * @returns New Record with merged events
 */
export function mergeEvents(
  existing: Record<string, Event>,
  incoming: Event[]
): Record<string, Event> {
  if (incoming.length === 0) {
    return existing;
  }

  const result = { ...existing };

  for (const event of incoming) {
    const id = String(event.id);
    // Only add if not already present, or update if it already exists
    result[id] = event;
  }

  return result;
}

/**
 * Normalize event ID to string format for consistent lookups.
 *
 * @param id - Event ID as string or number
 * @returns String ID
 */
export function normalizeEventId(id: string | number): string {
  return String(id);
}

/**
 * Convert event IDs array to normalized string array.
 *
 * @param ids - Array of event IDs (mixed string/number)
 * @returns Array of string IDs
 */
export function normalizeEventIds(ids: (string | number)[]): string[] {
  return ids.map(normalizeEventId);
}

/**
 * Derive the recommended events list from state, preserving order.
 *
 * @param state - Current events state
 * @returns Ordered array of recommended events
 */
export function getRecommendedEvents(state: EventsState): Event[] {
  return state.recommendedIds
    .map(id => state.allEventsById[id])
    .filter((event): event is Event => event !== undefined);
}

/**
 * Derive the full list of all events from state.
 *
 * @param state - Current events state
 * @returns Array of all events (unordered)
 */
export function getAllEvents(state: EventsState): Event[] {
  return Object.values(state.allEventsById);
}

/**
 * Create initial empty events state.
 *
 * @returns Fresh EventsState
 */
export function createInitialEventsState(): EventsState {
  return {
    recommendedIds: [],
    allEventsById: {},
    isLoadingRecommended: false,
  };
}

/**
 * Add recommended events to state.
 * Replaces the current recommended list with new IDs (in order).
 * Merges events into the allEventsById map.
 *
 * @param state - Current state
 * @param recommendedIds - New ordered list of recommended event IDs
 * @param events - The actual event objects to add
 * @returns New state with updated recommendations
 */
export function addRecommendedEvents(
  state: EventsState,
  recommendedIds: (string | number)[],
  events: Event[]
): EventsState {
  return {
    ...state,
    recommendedIds: normalizeEventIds(recommendedIds),
    allEventsById: mergeEvents(state.allEventsById, events),
    isLoadingRecommended: false,
  };
}

/**
 * Add context events to state (events for map display, not recommended).
 * Only updates the allEventsById map, does not change recommendedIds.
 *
 * @param state - Current state
 * @param events - Events to add to the map
 * @returns New state with additional events
 */
export function addContextEvents(
  state: EventsState,
  events: Event[]
): EventsState {
  return {
    ...state,
    allEventsById: mergeEvents(state.allEventsById, events),
  };
}

/**
 * Clear recommended events but keep all events in the map.
 *
 * @param state - Current state
 * @returns New state with cleared recommendations
 */
export function clearRecommendedEvents(state: EventsState): EventsState {
  return {
    ...state,
    recommendedIds: [],
  };
}

/**
 * Clear all events state, returning to initial state.
 *
 * @returns Fresh empty state
 */
export function clearAllEvents(): EventsState {
  return createInitialEventsState();
}

/**
 * Set loading state for recommended events.
 *
 * @param state - Current state
 * @param isLoading - Whether loading is in progress
 * @returns New state with updated loading flag
 */
export function setRecommendedLoading(
  state: EventsState,
  isLoading: boolean
): EventsState {
  return {
    ...state,
    isLoadingRecommended: isLoading,
  };
}

/**
 * Get the count of events in different categories.
 *
 * @param state - Current events state
 * @returns Object with event counts
 */
export function getEventCounts(state: EventsState): {
  recommended: number;
  all: number;
} {
  return {
    recommended: state.recommendedIds.length,
    all: Object.keys(state.allEventsById).length,
  };
}
