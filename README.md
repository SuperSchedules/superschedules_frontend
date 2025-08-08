# Superschedules Frontend

Superschedules is an AI-assisted event discovery tool. This React app talks to a Django API.

- Vision: chat search, user-supplied sources, continuously updated events
- Tech: Vite + React, Django + PostgreSQL, Terraform infrastructure
- Repos: `superschedules_frontend`, `superschedules`, `superschedules_IAC`, `superschedules_collector` (planned)

## Local development
1. `npm install`
2. `npm run dev` -> http://localhost:5173

## API configuration
Endpoints: [`src/constants/api.js`](src/constants/api.js).
Set `VITE_API_BASE_URL` and optional `VITE_API_VERSION` in `.env.development` or `.env.production`.
