import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../auth';
import { LocationService } from '../services/locationService';
import type { LocationSuggestion } from '../types/index';

interface UseLocationAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  maxResults?: number;
  country?: string;
}

interface UseLocationAutocompleteState {
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  highlightedIndex: number;
}

export function useLocationAutocomplete(options: UseLocationAutocompleteOptions = {}) {
  const { debounceMs = 250, minChars = 2, maxResults = 8, country } = options;
  const { authFetch } = useAuth();

  const [state, setState] = useState<UseLocationAutocompleteState>({
    suggestions: [],
    isLoading: false,
    error: null,
    isOpen: false,
    highlightedIndex: -1,
  });

  const serviceRef = useRef<LocationService | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    serviceRef.current = new LocationService(authFetch);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [authFetch]);

  const search = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length < minChars) {
      setState(prev => ({ ...prev, suggestions: [], isOpen: false, error: null, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    debounceTimerRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      const result = await serviceRef.current!.suggest(query, {
        country,
        limit: maxResults,
        signal: abortControllerRef.current.signal,
      });

      if (result.success && result.data) {
        setState(prev => {
          // Keep previous suggestions if new search returns nothing (typo tolerance)
          const hasNewResults = result.data!.length > 0;
          return {
            ...prev,
            suggestions: hasNewResults ? result.data! : prev.suggestions,
            isLoading: false,
            isOpen: prev.suggestions.length > 0 || hasNewResults,
            highlightedIndex: -1,
          };
        });
      } else if (result.error !== 'Request canceled') {
        setState(prev => ({
          ...prev,
          suggestions: [],
          isLoading: false,
          error: result.error || null,
          isOpen: true,
        }));
      }
    }, debounceMs);
  }, [debounceMs, minChars, maxResults, country]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, highlightedIndex: -1 }));
  }, []);

  const open = useCallback(() => {
    setState(prev => {
      if (prev.suggestions.length > 0) {
        return { ...prev, isOpen: true };
      }
      return prev;
    });
  }, []);

  const highlightNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      highlightedIndex: prev.highlightedIndex < prev.suggestions.length - 1
        ? prev.highlightedIndex + 1
        : 0,
    }));
  }, []);

  const highlightPrev = useCallback(() => {
    setState(prev => ({
      ...prev,
      highlightedIndex: prev.highlightedIndex > 0
        ? prev.highlightedIndex - 1
        : prev.suggestions.length - 1,
    }));
  }, []);

  const getHighlighted = useCallback((): LocationSuggestion | null => {
    if (state.highlightedIndex >= 0 && state.highlightedIndex < state.suggestions.length) {
      return state.suggestions[state.highlightedIndex];
    }
    return null;
  }, [state.highlightedIndex, state.suggestions]);

  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [], isOpen: false, highlightedIndex: -1, error: null }));
  }, []);

  const retry = useCallback((query: string) => {
    setState(prev => ({ ...prev, error: null }));
    search(query);
  }, [search]);

  return {
    ...state,
    search,
    close,
    open,
    highlightNext,
    highlightPrev,
    getHighlighted,
    clearSuggestions,
    retry,
  };
}
