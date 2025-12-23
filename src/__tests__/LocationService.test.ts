import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationService } from '../services/locationService';

describe('LocationService', () => {
  let mockAuthFetch: {
    get: ReturnType<typeof vi.fn>;
  };
  let service: LocationService;

  beforeEach(() => {
    mockAuthFetch = {
      get: vi.fn(),
    };
    service = new LocationService(mockAuthFetch as any);
  });

  describe('suggest', () => {
    it('fetches suggestions successfully', async () => {
      const mockSuggestions = [
        { id: 1, label: 'Newton, MA', country_code: 'US' },
        { id: 2, label: 'New York, NY', country_code: 'US' },
      ];
      mockAuthFetch.get.mockResolvedValue({ data: { suggestions: mockSuggestions } });

      const result = await service.suggest('newton');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSuggestions);
      expect(mockAuthFetch.get).toHaveBeenCalledWith(
        expect.stringContaining('locations/suggest'),
        expect.any(Object)
      );
      expect(mockAuthFetch.get).toHaveBeenCalledWith(
        expect.stringContaining('q=newton'),
        expect.any(Object)
      );
    });

    it('handles array response format', async () => {
      const mockSuggestions = [
        { id: 1, label: 'Newton, MA', country_code: 'US' },
      ];
      mockAuthFetch.get.mockResolvedValue({ data: mockSuggestions });

      const result = await service.suggest('newton');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSuggestions);
    });

    it('includes country parameter when provided', async () => {
      mockAuthFetch.get.mockResolvedValue({ data: { suggestions: [] } });

      await service.suggest('newton', { country: 'US' });

      expect(mockAuthFetch.get).toHaveBeenCalledWith(
        expect.stringContaining('country=US'),
        expect.any(Object)
      );
    });

    it('includes limit parameter when provided', async () => {
      mockAuthFetch.get.mockResolvedValue({ data: { suggestions: [] } });

      await service.suggest('newton', { limit: 5 });

      expect(mockAuthFetch.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=5'),
        expect.any(Object)
      );
    });

    it('caches results by query and country', async () => {
      const mockSuggestions = [{ id: 1, label: 'Newton, MA', country_code: 'US' }];
      mockAuthFetch.get.mockResolvedValue({ data: { suggestions: mockSuggestions } });

      await service.suggest('newton');
      await service.suggest('newton');
      await service.suggest('NEWTON'); // Should use cached (case-insensitive)

      expect(mockAuthFetch.get).toHaveBeenCalledTimes(1);
    });

    it('does not cache results with different countries', async () => {
      const mockSuggestions = [{ id: 1, label: 'Newton, MA', country_code: 'US' }];
      mockAuthFetch.get.mockResolvedValue({ data: { suggestions: mockSuggestions } });

      await service.suggest('newton');
      await service.suggest('newton', { country: 'CA' });

      expect(mockAuthFetch.get).toHaveBeenCalledTimes(2);
    });

    it('handles errors gracefully', async () => {
      mockAuthFetch.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const result = await service.suggest('fail');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });

    it('handles network errors', async () => {
      mockAuthFetch.get.mockRejectedValue(new Error('Network error'));

      const result = await service.suggest('fail');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch suggestions');
    });

    it('handles abort signal (CanceledError)', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'CanceledError';
      mockAuthFetch.get.mockRejectedValue(abortError);

      const result = await service.suggest('test', { signal: new AbortController().signal });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request canceled');
    });

    it('handles abort signal (ERR_CANCELED)', async () => {
      const abortError = new Error('Aborted') as Error & { code?: string };
      abortError.code = 'ERR_CANCELED';
      mockAuthFetch.get.mockRejectedValue(abortError);

      const result = await service.suggest('test', { signal: new AbortController().signal });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request canceled');
    });
  });

  describe('getById', () => {
    it('fetches location by id successfully', async () => {
      const mockLocation = { id: 1, label: 'Newton, MA', country_code: 'US' };
      mockAuthFetch.get.mockResolvedValue({ data: mockLocation });

      const result = await service.getById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLocation);
      expect(mockAuthFetch.get).toHaveBeenCalledWith(
        expect.stringContaining('locations/1')
      );
    });

    it('handles string id', async () => {
      const mockLocation = { id: 'abc123', label: 'Newton, MA', country_code: 'US' };
      mockAuthFetch.get.mockResolvedValue({ data: mockLocation });

      const result = await service.getById('abc123');

      expect(result.success).toBe(true);
      expect(mockAuthFetch.get).toHaveBeenCalledWith(
        expect.stringContaining('locations/abc123')
      );
    });

    it('handles errors gracefully', async () => {
      mockAuthFetch.get.mockRejectedValue({
        response: { data: { message: 'Not found' } },
      });

      const result = await service.getById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });

  describe('clearCache', () => {
    it('clears the cache', async () => {
      const mockSuggestions = [{ id: 1, label: 'Newton, MA', country_code: 'US' }];
      mockAuthFetch.get.mockResolvedValue({ data: { suggestions: mockSuggestions } });

      await service.suggest('newton');
      service.clearCache();
      await service.suggest('newton');

      expect(mockAuthFetch.get).toHaveBeenCalledTimes(2);
    });
  });
});
