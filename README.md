# Backend_Klinik

Node.js API for the Klinik UNESA frontend. It uses the existing Supabase project as its PostgreSQL database and authentication provider; it does not create or modify database migrations.

## Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
3. Install packages with `npm install`.
4. Run `npm run dev`.

The API listens on `http://localhost:3001` by default. Configure `PORT` to change the port and `FRONTEND_ORIGIN` to allow one or more comma-separated frontend origins. `GET /health` checks that the process is responding. All `/api` endpoints require a valid Supabase access token. Petugas-only operations also verify the caller's `user_roles` record.

The API uses the caller's token for database access and does not use a service-role key. Existing Supabase row-level security policies and RPC functions remain responsible for data-level authorization.

## Project structure

- `src/config.ts` validates environment configuration.
- `src/app.ts` configures Express middleware and mounts routes.
- `src/routes/api.ts` implements the API consumed by the frontend.
- `src/middleware/` contains authentication, authorization, and error handling.
- `src/index.ts` starts the HTTP server.

The `/api` route paths, request fields, response shapes, and Indonesian error messages are kept compatible with the frontend's `apiRequest` calls.
