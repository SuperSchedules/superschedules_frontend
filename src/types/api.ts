/**
 * API Types - Re-exports from generated OpenAPI types
 *
 * These types are derived from the backend's OpenAPI schema.
 * To regenerate: pnpm run api:generate
 *
 * Use these types for:
 * - API response validation
 * - Test mock data (ensures mocks match actual API)
 * - Type-safe API calls
 */

import type { components } from './api.generated';

// =============================================================================
// Schema Types - Direct exports from OpenAPI
// =============================================================================

/** Event as returned by the API */
export type ApiEvent = components['schemas']['EventSchema'];

/** Venue as returned by the API */
export type ApiVenue = components['schemas']['VenueSchema'];

/** Source as returned by the API */
export type ApiSource = components['schemas']['SourceSchema'];

/** User as returned by the API */
export type ApiUser = components['schemas']['UserSchema'];

/** Scraping job status */
export type ApiScrapingJob = components['schemas']['ScrapingJobSchema'];

// =============================================================================
// Request Types
// =============================================================================

/** Create event request body */
export type CreateEventRequest = components['schemas']['EventCreateSchema'];

/** Update event request body */
export type UpdateEventRequest = components['schemas']['EventUpdateSchema'];

/** Create user request body */
export type CreateUserRequest = components['schemas']['UserCreateSchema'];

/** Create source request body */
export type CreateSourceRequest = components['schemas']['SourceCreateSchema'];

/** Scrape request body */
export type ScrapeRequest = components['schemas']['ScrapeRequestSchema'];

/** Batch request body */
export type BatchRequest = components['schemas']['BatchRequestSchema'];

// =============================================================================
// Response Types
// =============================================================================

/** Scrape result response */
export type ScrapeResult = components['schemas']['ScrapeResultSchema'];

/** Batch response */
export type BatchResponse = components['schemas']['BatchResponseSchema'];

/** Site strategy response */
export type SiteStrategy = components['schemas']['SiteStrategySchema'];

/** Generic message response */
export type MessageResponse = components['schemas']['MessageSchema'];
