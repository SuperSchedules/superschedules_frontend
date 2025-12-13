# Superschedules Frontend

Superschedules is an AI-assisted event discovery tool. The React frontend communicates with a Django API.

- **Vision:** chat-based search, user-supplied sources, continuously updated events
- **Tech:** Vite + React, Django + PostgreSQL, Terraform infrastructure
- **Repositories:** `superschedules_frontend`, `superschedules`, `superschedules_IAC`, `superschedules_collector` (planned)

## Local development

1. Enable Corepack (if not already enabled): `corepack enable`
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm dev` and visit http://localhost:5173

Note: This project uses pnpm as the package manager. If Corepack is not available, install pnpm manually: `npm install -g pnpm`

## API configuration

Endpoints are defined in `src/constants/api.ts`.
Configure the backend via environment variables in `.env.development` or `.env.production`:

- `VITE_API_BASE_URL` (e.g. `http://localhost:8000`)
- `VITE_API_VERSION` (defaults to `v1`)
- `VITE_STREAMING_API_BASE_URL` (optional; e.g. `http://localhost:8002` for chat streaming)

## API Schema Sync

The frontend types are generated from the backend's OpenAPI schema to ensure they stay in sync.

**Files:**
- `api-schema.json` - Canonical OpenAPI schema from backend
- `src/types/api.generated.ts` - Auto-generated TypeScript types
- `src/types/api.ts` - Friendly re-exports for common types
- `src/__tests__/mocks/api.ts` - Type-safe mock factories for tests

**Commands:**
- `pnpm api:generate` - Regenerate TypeScript types from `api-schema.json`
- `pnpm api:check` - Verify types match committed schema (used by CI)

**When the backend API changes:**
1. Export new schema from backend:
   ```bash
   cd ../superschedules
   ./.venv/bin/python -c "
   import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
   import django; django.setup()
   from config.urls import api
   import json
   print(json.dumps(api.get_openapi_schema(), indent=2, default=str))
   " > ../superschedules_frontend/api-schema.json
   ```
2. Regenerate types: `pnpm api:generate`
3. Fix any TypeScript errors in test mocks (they use the generated types)
4. Commit the updated `api-schema.json` and `api.generated.ts`

**Why this matters:**
Test mocks use the API types. If the backend changes and you don't update the types, TypeScript will catch the mismatch at compile time rather than letting tests pass with stale mocks.
