import { describe, it, expect } from 'vitest';
import {
  mergeEvents,
  normalizeEventId,
  normalizeEventIds,
  getRecommendedEvents,
  getAllEvents,
  createInitialEventsState,
  addRecommendedEvents,
  addContextEvents,
  clearRecommendedEvents,
  clearAllEvents,
  setRecommendedLoading,
  getEventCounts,
} from '../../utils/eventMerge';
import type { Event, EventsState } from '../../types/index';

// Helper to create mock events
function createMockEvent(id: string, title?: string): Event {
  return {
    id,
    title: title || `Event ${id}`,
    start: new Date().toISOString(),
  };
}

describe('eventMerge utilities', () => {
  describe('mergeEvents', () => {
    it('adds new events to empty map', () => {
      const existing: Record<string, Event> = {};
      const incoming = [createMockEvent('1'), createMockEvent('2')];

      const result = mergeEvents(existing, incoming);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1'].id).toBe('1');
      expect(result['2'].id).toBe('2');
    });

    it('preserves existing events when merging', () => {
      const existing: Record<string, Event> = {
        '1': createMockEvent('1', 'Original'),
      };
      const incoming = [createMockEvent('2')];

      const result = mergeEvents(existing, incoming);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1'].title).toBe('Original');
      expect(result['2']).toBeDefined();
    });

    it('updates existing events with same ID', () => {
      const existing: Record<string, Event> = {
        '1': createMockEvent('1', 'Original'),
      };
      const incoming = [createMockEvent('1', 'Updated')];

      const result = mergeEvents(existing, incoming);

      expect(Object.keys(result)).toHaveLength(1);
      expect(result['1'].title).toBe('Updated');
    });

    it('handles empty incoming array', () => {
      const existing: Record<string, Event> = {
        '1': createMockEvent('1'),
      };
      const incoming: Event[] = [];

      const result = mergeEvents(existing, incoming);

      expect(result).toBe(existing); // Should return same reference
    });

    it('does not mutate original objects', () => {
      const existing: Record<string, Event> = {
        '1': createMockEvent('1'),
      };
      const incoming = [createMockEvent('2')];

      const result = mergeEvents(existing, incoming);

      expect(result).not.toBe(existing);
      expect(existing['2']).toBeUndefined();
    });
  });

  describe('normalizeEventId', () => {
    it('converts number to string', () => {
      expect(normalizeEventId(123)).toBe('123');
    });

    it('keeps string as string', () => {
      expect(normalizeEventId('abc')).toBe('abc');
    });
  });

  describe('normalizeEventIds', () => {
    it('converts mixed array to strings', () => {
      const result = normalizeEventIds([1, '2', 3, 'abc']);
      expect(result).toEqual(['1', '2', '3', 'abc']);
    });

    it('handles empty array', () => {
      expect(normalizeEventIds([])).toEqual([]);
    });
  });

  describe('getRecommendedEvents', () => {
    it('returns events in recommended order', () => {
      const state: EventsState = {
        recommendedIds: ['2', '1', '3'],
        allEventsById: {
          '1': createMockEvent('1', 'First'),
          '2': createMockEvent('2', 'Second'),
          '3': createMockEvent('3', 'Third'),
        },
        isLoadingRecommended: false,
      };

      const result = getRecommendedEvents(state);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('3');
    });

    it('filters out missing events', () => {
      const state: EventsState = {
        recommendedIds: ['1', '2', '999'],
        allEventsById: {
          '1': createMockEvent('1'),
          '2': createMockEvent('2'),
        },
        isLoadingRecommended: false,
      };

      const result = getRecommendedEvents(state);

      expect(result).toHaveLength(2);
    });

    it('returns empty array for empty state', () => {
      const state = createInitialEventsState();
      expect(getRecommendedEvents(state)).toEqual([]);
    });
  });

  describe('getAllEvents', () => {
    it('returns all events from map', () => {
      const state: EventsState = {
        recommendedIds: ['1'],
        allEventsById: {
          '1': createMockEvent('1'),
          '2': createMockEvent('2'),
          '3': createMockEvent('3'),
        },
        isLoadingRecommended: false,
      };

      const result = getAllEvents(state);

      expect(result).toHaveLength(3);
    });

    it('returns empty array for empty state', () => {
      const state = createInitialEventsState();
      expect(getAllEvents(state)).toEqual([]);
    });
  });

  describe('createInitialEventsState', () => {
    it('creates empty state', () => {
      const state = createInitialEventsState();

      expect(state.recommendedIds).toEqual([]);
      expect(state.allEventsById).toEqual({});
      expect(state.isLoadingRecommended).toBe(false);
    });
  });

  describe('addRecommendedEvents', () => {
    it('replaces recommended list and merges events', () => {
      const initialState: EventsState = {
        recommendedIds: ['1'],
        allEventsById: { '1': createMockEvent('1') },
        isLoadingRecommended: true,
      };

      const result = addRecommendedEvents(
        initialState,
        [3, 2],
        [createMockEvent('2'), createMockEvent('3')]
      );

      expect(result.recommendedIds).toEqual(['3', '2']);
      expect(Object.keys(result.allEventsById)).toHaveLength(3);
      expect(result.isLoadingRecommended).toBe(false);
    });

    it('normalizes IDs to strings', () => {
      const state = createInitialEventsState();
      const result = addRecommendedEvents(state, [1, 2], [
        createMockEvent('1'),
        createMockEvent('2'),
      ]);

      expect(result.recommendedIds).toEqual(['1', '2']);
    });
  });

  describe('addContextEvents', () => {
    it('adds events without changing recommended list', () => {
      const initialState: EventsState = {
        recommendedIds: ['1'],
        allEventsById: { '1': createMockEvent('1') },
        isLoadingRecommended: false,
      };

      const result = addContextEvents(initialState, [
        createMockEvent('2'),
        createMockEvent('3'),
      ]);

      expect(result.recommendedIds).toEqual(['1']);
      expect(Object.keys(result.allEventsById)).toHaveLength(3);
    });
  });

  describe('clearRecommendedEvents', () => {
    it('clears recommended list but keeps all events', () => {
      const initialState: EventsState = {
        recommendedIds: ['1', '2'],
        allEventsById: {
          '1': createMockEvent('1'),
          '2': createMockEvent('2'),
        },
        isLoadingRecommended: false,
      };

      const result = clearRecommendedEvents(initialState);

      expect(result.recommendedIds).toEqual([]);
      expect(Object.keys(result.allEventsById)).toHaveLength(2);
    });
  });

  describe('clearAllEvents', () => {
    it('returns fresh empty state', () => {
      const result = clearAllEvents();

      expect(result.recommendedIds).toEqual([]);
      expect(result.allEventsById).toEqual({});
      expect(result.isLoadingRecommended).toBe(false);
    });
  });

  describe('setRecommendedLoading', () => {
    it('sets loading to true', () => {
      const state = createInitialEventsState();
      const result = setRecommendedLoading(state, true);

      expect(result.isLoadingRecommended).toBe(true);
    });

    it('sets loading to false', () => {
      const state: EventsState = {
        ...createInitialEventsState(),
        isLoadingRecommended: true,
      };
      const result = setRecommendedLoading(state, false);

      expect(result.isLoadingRecommended).toBe(false);
    });
  });

  describe('getEventCounts', () => {
    it('returns correct counts', () => {
      const state: EventsState = {
        recommendedIds: ['1', '2'],
        allEventsById: {
          '1': createMockEvent('1'),
          '2': createMockEvent('2'),
          '3': createMockEvent('3'),
        },
        isLoadingRecommended: false,
      };

      const counts = getEventCounts(state);

      expect(counts.recommended).toBe(2);
      expect(counts.all).toBe(3);
    });

    it('returns zeros for empty state', () => {
      const state = createInitialEventsState();
      const counts = getEventCounts(state);

      expect(counts.recommended).toBe(0);
      expect(counts.all).toBe(0);
    });
  });
});
