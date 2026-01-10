import { useState, useCallback, useMemo } from 'react';
import type { Event, EventsState } from '../types/index';
import {
  createInitialEventsState,
  addRecommendedEvents as addRecommended,
  addContextEvents as addContext,
  clearRecommendedEvents,
  clearAllEvents,
  setRecommendedLoading,
  getRecommendedEvents,
  getAllEvents,
  getEventCounts,
  normalizeEventIds,
} from '../utils/eventMerge';

/**
 * Hook for managing events state with separate tracking of:
 * - Recommended events: Ordered list from the current chat turn (for sidebar display)
 * - All events: Superset of all events seen in session (for map display)
 *
 * @returns Events state and actions
 */
export function useEventsState() {
  const [state, setState] = useState<EventsState>(createInitialEventsState);

  /**
   * Add recommended events from a chat response.
   * Replaces the current recommended list with new IDs (in order).
   * Merges events into the all events map.
   *
   * @param recommendedIds - Ordered list of recommended event IDs
   * @param events - The actual event objects
   */
  const addRecommendedEvents = useCallback(
    (recommendedIds: (string | number)[], events: Event[]) => {
      setState(prev => addRecommended(prev, recommendedIds, events));
    },
    []
  );

  /**
   * Add context events (events for map display, not recommended).
   * Only updates the all events map, does not change recommended list.
   *
   * @param events - Events to add to the map
   */
  const addContextEvents = useCallback((events: Event[]) => {
    setState(prev => addContext(prev, events));
  }, []);

  /**
   * Clear the recommended events list but keep all events in the map.
   */
  const clearRecommended = useCallback(() => {
    setState(prev => clearRecommendedEvents(prev));
  }, []);

  /**
   * Clear all events state, returning to initial empty state.
   */
  const clearAll = useCallback(() => {
    setState(clearAllEvents());
  }, []);

  /**
   * Set the loading state for recommended events.
   *
   * @param isLoading - Whether loading is in progress
   */
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => setRecommendedLoading(prev, isLoading));
  }, []);

  /**
   * Check if a specific event ID exists in the all events map.
   *
   * @param eventId - Event ID to check
   * @returns Whether the event exists
   */
  const hasEvent = useCallback(
    (eventId: string | number): boolean => {
      return String(eventId) in state.allEventsById;
    },
    [state.allEventsById]
  );

  /**
   * Get a specific event by ID from the all events map.
   *
   * @param eventId - Event ID to look up
   * @returns The event or undefined if not found
   */
  const getEvent = useCallback(
    (eventId: string | number): Event | undefined => {
      return state.allEventsById[String(eventId)];
    },
    [state.allEventsById]
  );

  // Derived data: ordered list of recommended events
  const recommended = useMemo(() => getRecommendedEvents(state), [state]);

  // Derived data: array of all events (for map display)
  const all = useMemo(() => getAllEvents(state), [state]);

  // Derived data: event counts
  const counts = useMemo(() => getEventCounts(state), [state]);

  // Check if there are any recommended events
  const hasRecommended = recommended.length > 0;

  // Check if we're loading recommended events
  const isLoading = state.isLoadingRecommended;

  return {
    // State
    state,
    recommended,
    all,
    counts,
    hasRecommended,
    isLoading,

    // Actions
    addRecommendedEvents,
    addContextEvents,
    clearRecommended,
    clearAll,
    setLoading,
    hasEvent,
    getEvent,
  };
}

export type UseEventsStateReturn = ReturnType<typeof useEventsState>;
