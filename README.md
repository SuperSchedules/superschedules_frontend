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
