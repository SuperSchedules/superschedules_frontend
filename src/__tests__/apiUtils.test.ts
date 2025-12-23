import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { joinUrl, buildApiUrl, buildApiUrlWithArrayParams, assertNoTrailingSlash } from '../utils/api';

describe('joinUrl', () => {
  it('joins URL parts with single slash', () => {
    expect(joinUrl('https://api.example.com', 'users')).toBe('https://api.example.com/users');
  });

  it('removes trailing slash from result', () => {
    expect(joinUrl('https://api.example.com/', 'users/')).toBe('https://api.example.com/users');
  });

  it('handles leading slashes in path', () => {
    expect(joinUrl('https://api.example.com', '/users')).toBe('https://api.example.com/users');
  });

  it('handles multiple parts', () => {
    expect(joinUrl('https://api.example.com', 'api', 'v1', 'users')).toBe('https://api.example.com/api/v1/users');
  });

  it('handles empty parts', () => {
    expect(joinUrl('https://api.example.com', '', 'users')).toBe('https://api.example.com/users');
  });

  it('removes multiple slashes', () => {
    expect(joinUrl('https://api.example.com//', '//users//')).toBe('https://api.example.com/users');
  });
});

describe('buildApiUrl', () => {
  it('builds URL without params', () => {
    expect(buildApiUrl('/api/v1/locations/suggest')).toBe('/api/v1/locations/suggest');
  });

  it('removes trailing slash before params', () => {
    expect(buildApiUrl('/api/v1/locations/suggest/', { q: 'newton' })).toBe('/api/v1/locations/suggest?q=newton');
  });

  it('builds URL with string params', () => {
    expect(buildApiUrl('/api/v1/locations/suggest', { q: 'newton', country: 'US' }))
      .toBe('/api/v1/locations/suggest?q=newton&country=US');
  });

  it('builds URL with number params', () => {
    expect(buildApiUrl('/api/v1/locations/suggest', { q: 'newton', limit: 8 }))
      .toBe('/api/v1/locations/suggest?q=newton&limit=8');
  });

  it('builds URL with boolean params', () => {
    expect(buildApiUrl('/api/v1/events', { active: true })).toBe('/api/v1/events?active=true');
  });

  it('filters out undefined params', () => {
    expect(buildApiUrl('/api/v1/locations/suggest', { q: 'newton', country: undefined }))
      .toBe('/api/v1/locations/suggest?q=newton');
  });

  it('filters out null params', () => {
    expect(buildApiUrl('/api/v1/locations/suggest', { q: 'newton', country: null }))
      .toBe('/api/v1/locations/suggest?q=newton');
  });

  it('returns endpoint when all params are null/undefined', () => {
    expect(buildApiUrl('/api/v1/locations/suggest', { country: undefined, limit: null }))
      .toBe('/api/v1/locations/suggest');
  });

  it('returns endpoint when params is empty object', () => {
    expect(buildApiUrl('/api/v1/locations/suggest', {})).toBe('/api/v1/locations/suggest');
  });
});

describe('buildApiUrlWithArrayParams', () => {
  it('builds URL with array of numbers', () => {
    expect(buildApiUrlWithArrayParams('/api/v1/events', 'ids', [1, 2, 3]))
      .toBe('/api/v1/events?ids=1&ids=2&ids=3');
  });

  it('builds URL with array of strings', () => {
    expect(buildApiUrlWithArrayParams('/api/v1/events', 'ids', ['a', 'b', 'c']))
      .toBe('/api/v1/events?ids=a&ids=b&ids=c');
  });

  it('removes trailing slash', () => {
    expect(buildApiUrlWithArrayParams('/api/v1/events/', 'ids', [1, 2]))
      .toBe('/api/v1/events?ids=1&ids=2');
  });

  it('returns endpoint for empty array', () => {
    expect(buildApiUrlWithArrayParams('/api/v1/events', 'ids', []))
      .toBe('/api/v1/events');
  });

  it('handles single value', () => {
    expect(buildApiUrlWithArrayParams('/api/v1/events', 'ids', [42]))
      .toBe('/api/v1/events?ids=42');
  });
});

describe('assertNoTrailingSlash', () => {
  const originalEnv = import.meta.env.DEV;

  beforeEach(() => {
    // @ts-expect-error - modifying import.meta.env for testing
    import.meta.env.DEV = true;
  });

  afterEach(() => {
    // @ts-expect-error - restoring import.meta.env
    import.meta.env.DEV = originalEnv;
  });

  it('does not throw for valid URL without trailing slash', () => {
    expect(() => assertNoTrailingSlash('/api/v1/events')).not.toThrow();
  });

  it('does not throw for URL with query params', () => {
    expect(() => assertNoTrailingSlash('/api/v1/events?ids=1')).not.toThrow();
  });

  it('throws for URL with trailing slash before query', () => {
    expect(() => assertNoTrailingSlash('/api/v1/events/?ids=1')).toThrow(/trailing slash/i);
  });

  it('throws for URL with trailing slash without query', () => {
    expect(() => assertNoTrailingSlash('/api/v1/events/')).toThrow(/trailing slash/i);
  });

  it('does not throw for root path', () => {
    expect(() => assertNoTrailingSlash('/')).not.toThrow();
  });

  it('handles full URLs', () => {
    expect(() => assertNoTrailingSlash('https://api.example.com/api/v1/events')).not.toThrow();
    expect(() => assertNoTrailingSlash('https://api.example.com/api/v1/events/')).toThrow(/trailing slash/i);
  });
});
