# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Superschedules is an AI-assisted event discovery tool. This React frontend communicates with a Django API backend. The project uses Vite as the build tool with React 19, Bootstrap for styling, and includes authentication with JWT tokens.

## Development Commands

- `pnpm dev` - Start development server (http://localhost:5173)
- `pnpm build` - Build for production
- `pnpm test` - Run tests with Vitest
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build locally

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

### Application Structure
- `src/App.tsx` - Main app component with React Router setup
- `src/pages/` - Page components (Home, Calendar, Login, etc.)
- `src/components/` - Reusable components (TopBar, Sidebar)
- `src/__tests__/` - Test files using Vitest and Testing Library
- Layout system with collapsible sidebar

### Key Dependencies
- React Router DOM for navigation
- Axios for HTTP requests with auth interceptors
- React Big Calendar for calendar views
- Bootstrap + Bootstrap Icons for UI
- date-fns for date manipulation

### Testing Setup
- Vitest as test runner with jsdom environment
- Testing Library for React component testing
- Setup file: `vitest.setup.js` includes jest-dom matchers

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
- `/api/v1/events/` - Event data
- `/api/v1/sources/` - Event sources
