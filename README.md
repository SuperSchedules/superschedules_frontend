# EventZombie Frontend

EventZombie is an AI-assisted event discovery tool. The React frontend communicates with a Django API.

- **Vision:** Chat-based search, user-supplied sources, continuously updated local events
- **Tech:** Vite + React 19 + TypeScript, Django + PostgreSQL backend
- **Repositories:** `superschedules_frontend`, `superschedules`, `superschedules_IAC`, `superschedules_collector`

## Local Development

1. Enable Corepack (if not already enabled): `corepack enable`
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm dev` and visit http://localhost:5173

Note: This project uses pnpm as the package manager. If Corepack is not available, install pnpm manually: `npm install -g pnpm`

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests with Vitest |
| `pnpm lint` | Run ESLint |
| `pnpm preview` | Preview production build |
| `pnpm api:generate` | Regenerate TypeScript types from backend schema |
| `pnpm api:check` | Verify types match committed schema (used by CI) |

## API Configuration

Endpoints are defined in `src/constants/api.ts`.
Configure the backend via environment variables in `.env.development` or `.env.production`:

- `VITE_API_BASE_URL` - Backend API URL (e.g., `http://localhost:8000`)
- `VITE_API_VERSION` - API version (defaults to `v1`)
- `VITE_STREAMING_API_BASE_URL` - Optional streaming service URL (e.g., `http://localhost:8002`)

## API Schema Sync

The frontend types are generated from the backend's OpenAPI schema to ensure they stay in sync. This prevents test mocks from becoming stale when the API changes.

**Key Files:**
- `api-schema.json` - Canonical OpenAPI schema from backend
- `src/types/api.generated.ts` - Auto-generated TypeScript types
- `src/types/api.ts` - Friendly type exports (`ApiEvent`, `ApiVenue`, etc.)
- `src/__tests__/mocks/api.ts` - Type-safe mock factories for tests

**When the backend API changes:**

```bash
# 1. Export new schema from backend
cd ../superschedules
./.venv/bin/python -c "
import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django; django.setup()
from config.urls import api
import json
print(json.dumps(api.get_openapi_schema(), indent=2, default=str))
" > ../superschedules_frontend/api-schema.json

# 2. Regenerate types
cd ../superschedules_frontend
pnpm api:generate

# 3. Fix any TypeScript errors in test mocks, then commit
```

**Why this matters:** Test mocks use the generated API types. If the backend changes, TypeScript will catch mismatches at compile time rather than letting tests pass with stale mocks.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatInterface/   # Chat UI with streaming support
│   ├── EventSidebar/    # Events list and map panel
│   ├── EventsMap.tsx    # Leaflet map with event markers
│   └── ...
├── pages/               # Route page components
├── types/               # TypeScript types
│   ├── index.ts         # App-specific types
│   ├── api.ts           # API type exports
│   └── api.generated.ts # Auto-generated from OpenAPI
├── utils/               # Helper functions
├── constants/           # API endpoints, config
└── __tests__/           # Test files
    └── mocks/           # Type-safe mock factories
```
