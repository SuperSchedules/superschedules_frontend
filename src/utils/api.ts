/**
 * URL construction utilities for API calls.
 *
 * Convention: NO trailing slashes in API paths.
 * This prevents 404s from URLs like /api/v1/locations/suggest/?q=foo
 */

/**
 * Joins URL path segments, ensuring exactly one slash between parts
 * and no trailing slash on the result.
 *
 * @example
 * joinUrl('https://api.example.com/', '/users/') => 'https://api.example.com/users'
 * joinUrl('https://api.example.com', 'users') => 'https://api.example.com/users'
 */
export function joinUrl(...parts: string[]): string {
  return parts
    .map((part, index) => {
      let p = part;
      // Strip leading slash (except for first part)
      if (index > 0) {
        p = p.replace(/^\/+/, '');
      }
      // Strip trailing slash
      p = p.replace(/\/+$/, '');
      return p;
    })
    .filter(Boolean)
    .join('/');
}

/**
 * Builds a complete API URL with query parameters.
 * Ensures no trailing slash before the query string.
 *
 * @example
 * buildApiUrl('/api/v1/locations/suggest', { q: 'newton', limit: '8' })
 * => '/api/v1/locations/suggest?q=newton&limit=8'
 */
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  // Remove trailing slash from endpoint
  const cleanEndpoint = endpoint.replace(/\/+$/, '');

  if (!params) {
    return cleanEndpoint;
  }

  // Filter out undefined/null values and build params
  const filteredParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      filteredParams[key] = String(value);
    }
  }

  if (Object.keys(filteredParams).length === 0) {
    return cleanEndpoint;
  }

  const searchParams = new URLSearchParams(filteredParams);
  return `${cleanEndpoint}?${searchParams.toString()}`;
}

/**
 * Creates a URL with array parameters (for IDs, etc.)
 *
 * @example
 * buildApiUrlWithArrayParams('/api/v1/events', 'ids', [1, 2, 3])
 * => '/api/v1/events?ids=1&ids=2&ids=3'
 */
export function buildApiUrlWithArrayParams(
  endpoint: string,
  paramName: string,
  values: (string | number)[]
): string {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');

  if (!values || values.length === 0) {
    return cleanEndpoint;
  }

  const searchParams = new URLSearchParams();
  values.forEach(value => searchParams.append(paramName, String(value)));

  return `${cleanEndpoint}?${searchParams.toString()}`;
}

/**
 * Dev-only guardrail: throws if a URL path ends with a trailing slash.
 * Call this in the API client before making requests.
 */
export function assertNoTrailingSlash(url: string): void {
  if (import.meta.env.DEV) {
    // Parse the URL to check just the pathname (not query string)
    try {
      const parsed = new URL(url, 'http://localhost');
      if (parsed.pathname.endsWith('/') && parsed.pathname !== '/') {
        throw new Error(
          `API URL has trailing slash before query params: ${url}\n` +
          `This will cause 404 errors. Remove the trailing slash from the endpoint.`
        );
      }
    } catch {
      // If URL parsing fails, check the path portion manually
      const pathPart = url.split('?')[0];
      if (pathPart.endsWith('/') && pathPart !== '/') {
        throw new Error(
          `API URL has trailing slash: ${url}\n` +
          `This will cause 404 errors. Remove the trailing slash from the endpoint.`
        );
      }
    }
  }
}
