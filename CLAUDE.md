# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EventZombie is an AI-assisted event discovery tool. This React frontend communicates with a Django API backend. The project uses Vite as the build tool with React 19, TypeScript, Bootstrap for styling, and JWT authentication.

## Development Commands

- `pnpm dev` - Start development server (http://localhost:5173)
- `pnpm build` - Build for production
- `pnpm test` - Run tests with Vitest
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build locally
- `pnpm api:generate` - Regenerate TypeScript types from backend OpenAPI schema
- `pnpm api:check` - Verify types match committed schema (used by CI)

Note: This project uses pnpm as the package manager.

## Architecture

### Authentication System
- JWT-based authentication with refresh tokens in `src/auth.tsx`
- AuthContext provides login/logout/token refresh functionality
- Automatic token refresh with axios interceptors
- 24-hour session timeout with automatic logout
- Tokens stored in localStorage

### API Integration
- API configuration centralized in `src/constants/api.ts`
- Environment-based URL switching (dev/prod)
- Endpoints organized by feature (AUTH_ENDPOINTS, EVENTS_ENDPOINTS, SOURCES_ENDPOINTS)
- Use `VITE_API_BASE_URL` and `VITE_API_VERSION` environment variables for configuration

### API Schema Sync
- `api-schema.json` - OpenAPI schema exported from Django backend
- `src/types/api.generated.ts` - Auto-generated TypeScript types from schema
- `src/types/api.ts` - Friendly re-exports (`ApiEvent`, `ApiVenue`, etc.)
- `src/__tests__/mocks/api.ts` - Type-safe mock factories for tests
- CI workflow verifies frontend types match backend schema

### Application Structure
- `src/App.tsx` - Main app component with React Router setup
- `src/pages/` - Page components (Home, Calendar, Login, etc.)
- `src/components/` - Reusable components
  - `ChatInterface.tsx` - Chat UI with streaming support
  - `EventSidebar/` - Events list panel with map integration
  - `EventsMap.tsx` - Leaflet map showing event locations
  - `ExpandableEventCard.tsx` - Event card with expand/collapse
  - `AppSidebar.tsx` - Main navigation sidebar
  - `TopBar.tsx` - Header with user menu
- `src/types/` - TypeScript type definitions
- `src/utils/` - Helper functions (location formatting, etc.)
- `src/__tests__/` - Test files using Vitest and Testing Library
- Layout system with collapsible sidebar

### Key Dependencies
- React Router DOM for navigation
- Axios for HTTP requests with auth interceptors
- React Big Calendar for calendar views
- React Leaflet for interactive maps
- Bootstrap + Bootstrap Icons for UI
- date-fns for date manipulation
- openapi-typescript for API type generation

### Testing Setup
- Vitest as test runner with jsdom environment
- Testing Library for React component testing
- Setup file: `vitest.setup.js` includes jest-dom matchers
- Type-safe mock factories in `src/__tests__/mocks/api.ts`

### Environment Variables
- `VITE_API_BASE_URL` - Backend API URL (e.g., `http://localhost:8000`)
- `VITE_API_VERSION` - API version (defaults to `v1`)
- `VITE_STREAMING_API_BASE_URL` - Optional FastAPI streaming service base URL (e.g., `http://localhost:8002`)

## Environment Configuration

Create `.env.development` or `.env.production` files with:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_API_VERSION` - API version (defaults to 'v1')

## Backend Dependencies

This frontend expects a Django API backend running on http://localhost:8000 in development mode with the following endpoints structure:
- `/api/v1/token/` - Authentication
- `/api/v1/events/` - Event data (includes venue information)
- `/api/v1/sources/` - Event sources
- `/api/docs` - OpenAPI documentation
- `/api/openapi.json` - OpenAPI schema

## Key Types

The main data types used throughout the app:

- `Event` - Event with title, description, start/end times, venue, etc.
- `Venue` - Normalized venue data (name, address, city, state, lat/long)
- `ChatMessage` - Chat messages with streaming support
- `UserPreferences` - User settings for event recommendations

API types are in `src/types/api.ts` and app-specific types in `src/types/index.ts`.
