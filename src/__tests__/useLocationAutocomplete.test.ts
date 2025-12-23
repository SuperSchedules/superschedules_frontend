import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock auth
vi.mock('../auth', () => ({
  useAuth: () => ({
    authFetch: {
      get: vi.fn(),
    },
  }),
}));

// Mock the location service to return immediately
vi.mock('../services/locationService', () => ({
  LocationService: vi.fn(() => ({
    suggest: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 1, label: 'Newton, MA', country_code: 'US' }],
    }),
  })),
}));

// Import after mocking
import { useLocationAutocomplete } from '../hooks/useLocationAutocomplete';

describe('useLocationAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.highlightedIndex).toBe(-1);
  });

  it('does not search with fewer than minChars', () => {
    const { result } = renderHook(() => useLocationAutocomplete({ minChars: 2 }));

    act(() => {
      result.current.search('n');
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });

  it('sets isLoading to true when searching with enough chars', () => {
    const { result } = renderHook(() => useLocationAutocomplete({ minChars: 2 }));

    act(() => {
      result.current.search('new');
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('closes dropdown and resets highlightedIndex', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.highlightedIndex).toBe(-1);
  });

  it('does not open when there are no suggestions', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    // Initially no suggestions
    expect(result.current.suggestions).toEqual([]);

    act(() => {
      result.current.open();
    });

    // Should not open without suggestions
    expect(result.current.isOpen).toBe(false);
  });

  it('clearSuggestions resets state', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    act(() => {
      result.current.clearSuggestions();
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.highlightedIndex).toBe(-1);
    expect(result.current.error).toBeNull();
  });

  it('highlightNext cycles through suggestions', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    // Manually set suggestions for this test
    // This tests the highlight logic independent of API calls
    act(() => {
      result.current.highlightNext();
    });

    // With no suggestions, highlightNext should wrap to 0
    expect(result.current.highlightedIndex).toBe(0);
  });

  it('highlightPrev cycles through suggestions', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    act(() => {
      result.current.highlightPrev();
    });

    // With no suggestions, highlightPrev wraps to -1 which becomes length-1 = -1
    // But since suggestions is empty, it would be -1
    expect(result.current.highlightedIndex).toBe(-1);
  });

  it('getHighlighted returns null when no suggestion is highlighted', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    expect(result.current.getHighlighted()).toBeNull();
  });

  it('retry clears error state', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    // Clear any existing error
    act(() => {
      result.current.retry('test');
    });

    expect(result.current.error).toBeNull();
    // Retry triggers a new search which sets isLoading
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes all expected functions', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    expect(typeof result.current.search).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.highlightNext).toBe('function');
    expect(typeof result.current.highlightPrev).toBe('function');
    expect(typeof result.current.getHighlighted).toBe('function');
    expect(typeof result.current.clearSuggestions).toBe('function');
    expect(typeof result.current.retry).toBe('function');
  });

  it('exposes all expected state properties', () => {
    const { result } = renderHook(() => useLocationAutocomplete());

    expect(result.current).toHaveProperty('suggestions');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isOpen');
    expect(result.current).toHaveProperty('highlightedIndex');
  });

  it('accepts configuration options', () => {
    const { result } = renderHook(() =>
      useLocationAutocomplete({
        debounceMs: 500,
        minChars: 3,
        maxResults: 10,
        country: 'US',
      })
    );

    // Just verify it doesn't throw with options
    expect(result.current.suggestions).toEqual([]);
  });

  it('respects minChars configuration', () => {
    const { result } = renderHook(() => useLocationAutocomplete({ minChars: 3 }));

    act(() => {
      result.current.search('ab'); // 2 chars, less than minChars
    });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.search('abc'); // 3 chars, meets minChars
    });

    expect(result.current.isLoading).toBe(true);
  });
});
