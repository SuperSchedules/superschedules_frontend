import { LOCATION_ENDPOINTS } from '../constants/api';
import type { AuthFetch, LocationSuggestion } from '../types/index';

export interface LocationSuggestResponse {
  success: boolean;
  data?: LocationSuggestion[];
  error?: string;
}

export interface LocationDetailResponse {
  success: boolean;
  data?: LocationSuggestion;
  error?: string;
}

export class LocationService {
  private authFetch: AuthFetch;
  private cache: Map<string, LocationSuggestion[]> = new Map();

  constructor(authFetch: AuthFetch) {
    this.authFetch = authFetch;
  }

  async suggest(
    query: string,
    options: { country?: string; limit?: number; signal?: AbortSignal } = {}
  ): Promise<LocationSuggestResponse> {
    const cacheKey = `${query.toLowerCase()}:${options.country || ''}`;

    if (this.cache.has(cacheKey)) {
      return { success: true, data: this.cache.get(cacheKey)! };
    }

    try {
      const params = new URLSearchParams({ q: query });
      if (options.country) params.append('country', options.country);
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await this.authFetch.get(
        `${LOCATION_ENDPOINTS.suggest}?${params.toString()}`,
        { signal: options.signal }
      );

      const suggestions: LocationSuggestion[] = response.data.suggestions || response.data || [];
      this.cache.set(cacheKey, suggestions);

      return { success: true, data: suggestions };
    } catch (error) {
      if ((error as any).name === 'CanceledError' || (error as any).code === 'ERR_CANCELED') {
        return { success: false, error: 'Request canceled' };
      }
      return {
        success: false,
        error: (error as any).response?.data?.message || 'Failed to fetch suggestions'
      };
    }
  }

  async getById(id: string | number): Promise<LocationDetailResponse> {
    try {
      const response = await this.authFetch.get(LOCATION_ENDPOINTS.detail(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: (error as any).response?.data?.message || 'Failed to fetch location'
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }
}
