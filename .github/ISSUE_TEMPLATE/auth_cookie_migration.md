---
name: Migrate auth to HttpOnly cookies + CSRF
about: Track the work to move from localStorage JWTs to cookie-based auth with CSRF
title: "Auth: Migrate to HttpOnly refresh cookie + in-memory access + CSRF"
labels: enhancement, security
assignees: ''
---

Summary

Move frontend auth from localStorage-stored JWTs to a more secure model:
- Refresh token in an HttpOnly, Secure cookie (set by Django)
- Access token in memory only (returned in JSON), sent via Authorization header
- CSRF protection on unsafe requests
- Align FastAPI chat service to accept the same access token

Why

- Mitigates XSS exfiltration of long-lived refresh tokens
- Standardizes on Django’s CSRF model for unsafe methods
- Simplifies cross-service auth (Django + FastAPI) with a single access token

Scope

Backend (Django, django-ninja, django-ninja-jwt)
- [ ] Login endpoint
  - [ ] Issue refresh via `RefreshToken.for_user`
  - [ ] Set `refresh_token` cookie: HttpOnly, Secure, SameSite=Lax (or None if cross-site), Path=/api/
  - [ ] Return `{ access: <jwt> }` in JSON (do NOT expose refresh in body)
- [ ] Refresh endpoint
  - [ ] Read `refresh_token` from cookie
  - [ ] Issue new access (and rotate refresh if configured)
  - [ ] Reset `refresh_token` cookie if rotated
  - [ ] Return `{ access: <jwt> }`
- [ ] CSRF
  - [ ] Ensure `CsrfViewMiddleware` enabled
  - [ ] Ensure `csrftoken` cookie is set
  - [ ] Add `GET /api/csrf/` no-op to ensure SPA can prefetch CSRF cookie
- [ ] Settings
  - [ ] `CSRF_TRUSTED_ORIGINS`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_SECONDS` (prod)
  - [ ] Same-origin: no CORS needed; if cross-subdomain, configure as required

Backend (FastAPI chat)
- [ ] Validate Authorization: Bearer <access> using the same signing key/alg
- [ ] For POST `/chat/stream`, accept and (optionally) verify `X-CSRFToken` for parity
- [ ] Document token validation and expiry handling

Frontend
- [ ] Axios instance (`auth.tsx`)
  - [ ] Enable `withCredentials` so cookies are sent to same-origin
  - [ ] Request interceptor: attach `Authorization: Bearer <access>` if in-memory access exists
  - [ ] Request interceptor (unsafe): attach `X-CSRFToken` from `csrftoken` cookie
  - [ ] Response interceptor: on 401, POST `/api/token/refresh/` (cookie-backed), update in-memory access, retry
- [ ] Token storage
  - [ ] Remove localStorage usage for `token`/`refresh`
  - [ ] Keep access token in component state/context only
  - [ ] Remove 24h hard session cap; rely on refresh expiry
  - [ ] Add pre-expiry skew (e.g., refresh if exp < now + 60s)
- [ ] Streaming (fetch)
  - [ ] Include `Authorization` with in-memory access
  - [ ] Include `X-CSRFToken` header for POST
  - [ ] Remove preflight get-on-stream if not needed post-migration
- [ ] UX
  - [ ] On refresh/login failure, route to login and show a clear message
  - [ ] Optional: multi-tab sync using `storage` event if any local storage remains

Security Hardening
- [ ] Enforce HTTPS + HSTS in prod
- [ ] Add CSP (restrict script-src) and other headers (Referrer-Policy, Permissions-Policy)
- [ ] Rate limit login/refresh endpoints; generic errors to avoid enumeration

Acceptance Criteria
- [ ] Login sets refresh cookie and returns access in JSON; no JWTs persisted in localStorage
- [ ] All unsafe API calls send CSRF header and succeed
- [ ] Access renewal works seamlessly across pages and streaming
- [ ] Manual and automated tests updated and passing

Notes
- Same domain deployment simplifies cookies (no CORS/credentials headaches)
- If you later switch to cookie-based access as well, add CSRF checks to FastAPI or keep Authorization header model

