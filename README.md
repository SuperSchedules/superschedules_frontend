# Superschedules Frontend

Superschedules is an AI-assisted event discovery tool. The React frontend communicates with a Django API.

- **Vision:** chat-based search, user-supplied sources, continuously updated events
- **Tech:** Vite + React, Django + PostgreSQL, Terraform infrastructure
- **Repositories:** `superschedules_frontend`, `superschedules`, `superschedules_IAC`, `superschedules_collector` (planned)

## Local development

1. Run `pnpm install`.
2. Start the development server with `pnpm dev` and visit http://localhost:5173.

Note: This project uses pnpm as the package manager.

## API configuration

Endpoints are defined in [`src/constants/api.js`](src/constants/api.js).
Set `VITE_API_BASE_URL` and optionally `VITE_API_VERSION` in `.env.development` or `.env.production`.
