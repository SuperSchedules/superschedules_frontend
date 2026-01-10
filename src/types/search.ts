/**
 * Types for future Elasticsearch-based event search integration.
 * These types define the architecture for passing search context to chat.
 *
 * NOTE: These types are for future implementation. The backend Elasticsearch
 * integration is not yet complete, but these types prepare the frontend
 * architecture for when it's ready.
 */

import type { Event } from './index';

/**
 * Search filters that can be applied to event queries
 */
export interface SearchFilters {
  /** Date range for events */
  dateRange?: {
    from: string;  // ISO date string
    to: string;    // ISO date string
  };

  /** Location to search around */
  location?: {
    id: string | number;
    label: string;
    lat?: number;
    lng?: number;
  };

  /** Maximum distance from location in miles */
  maxDistanceMiles?: number;

  /** Age range filter */
  ageRange?: {
    min: number;
    max: number;
  };

  /** Maximum price (0 = free only) */
  maxPrice?: number;

  /** Event categories/tags to filter by */
  categories?: string[];

  /** Include virtual events */
  includeVirtual?: boolean;
}

/**
 * Context for search results that can be passed to chat
 */
export interface SearchContext {
  /** Handle/cursor for paginated search results from Elasticsearch */
  searchHandle?: string;

  /** IDs of events in the candidate set for chat context */
  candidateEventIds?: string[];

  /** Original search query that generated this context */
  searchQuery?: string;

  /** Filters applied to the search */
  searchFilters?: SearchFilters;

  /** Total number of results available (for pagination info) */
  totalResults?: number;
}

/**
 * Distinguishes between free-form chat and search-context chat modes
 */
export type ChatMode = 'free-form' | 'search-context';

/**
 * Extended chat context that includes search information
 */
export interface ChatContextWithSearch {
  /** Current chat mode */
  mode: ChatMode;

  /** Search context if in search-context mode */
  searchContext?: SearchContext;
}

/**
 * Response from search endpoint
 */
export interface SearchResponse {
  /** Success indicator */
  success: boolean;

  /** Event results */
  data?: {
    /** Events matching the search */
    events: Event[];

    /** Handle for passing to chat or pagination */
    searchHandle?: string;

    /** Total count of matching events */
    totalCount: number;

    /** Current page/offset info */
    pagination?: {
      offset: number;
      limit: number;
      hasMore: boolean;
    };
  };

  /** Error message if failed */
  error?: string;
}

/**
 * Hook interface for future useEventSearch implementation
 */
export interface UseEventSearchReturn {
  /** Current search results */
  searchResults: Event[];

  /** Search handle for chat context */
  searchHandle: string | null;

  /** Whether a search is in progress */
  isSearching: boolean;

  /** Search error, if any */
  error: string | null;

  /** Execute a search */
  search: (query: string, filters?: SearchFilters) => Promise<void>;

  /** Load more results (pagination) */
  loadMore: () => Promise<void>;

  /** Clear search results */
  clearSearch: () => void;

  /** Get search context for chat endpoint */
  getSearchContext: () => SearchContext | undefined;
}

/**
 * Hook interface for managing chat mode with search context
 */
export interface UseChatWithSearchReturn {
  /** Current chat mode */
  chatMode: ChatMode;

  /** Set the chat mode */
  setChatMode: (mode: ChatMode) => void;

  /** Active search context (if in search-context mode) */
  searchContext: SearchContext | undefined;

  /** Set search context */
  setSearchContext: (context: SearchContext | undefined) => void;

  /** Build chat context including search information */
  buildChatContext: () => ChatContextWithSearch;

  /** Clear search context and return to free-form mode */
  clearSearchContext: () => void;
}
