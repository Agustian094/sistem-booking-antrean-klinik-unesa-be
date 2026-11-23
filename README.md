# Backend_Klinik

Node.js API for the Klinik UNESA frontend. It uses the existing Supabase project as its PostgreSQL database and authentication provider; it does not create or modify database migrations.

## Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
3. Install packages with `npm install`.
4. Run `npm run dev`.

The API listens on `http://localhost:3001` by default. Configure `PORT` to change the port and `FRONTEND_ORIGIN` to allow one or more comma-separated frontend origins. `GET /health` checks that the process is responding. All `/api` endpoints require a valid Supabase access token. Petugas-only operations also verify the caller's `user_roles` record.

The API uses the caller's token for database access and does not use a service-role key. Existing Supabase row-level security policies and RPC functions remain responsible for data-level authorization.

## Deploy to Vercel

1. Push this repository to GitHub without committing `.env`. The `.gitignore` already excludes it.
2. In Vercel, import the repository and set the project root to the repository root. Use the **Other** framework preset, `npm run build` as the build command, and leave the output directory empty.
3. In the Vercel project settings, add these environment variables for the environments you will deploy:
   - `SUPABASE_URL`: the Project URL from Supabase.
   - `SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable key. Do not use a service-role key.
   - `FRONTEND_ORIGIN`: the frontend's exact deployed origin, such as `https://your-frontend.vercel.app`. Multiple origins can be comma-separated.
4. Deploy the project. Vercel serves the Express app through `api/index.ts`; `vercel.json` routes requests to it.
5. Verify the deployment at `https://<your-project>.vercel.app/api/health` and configure the frontend API base URL as `https://<your-project>.vercel.app/api`.

Do not set `PORT` in Vercel; Vercel manages the function's port. For local setup, copy `.env.example` to `.env` and replace its Supabase placeholders with your project values.

## Project structure

- `src/config.ts` validates environment configuration.
- `src/app.ts` configures Express middleware and mounts routes.
- `src/routes/api.ts` implements the API consumed by the frontend.
- `src/middleware/` contains authentication, authorization, and error handling.
- `src/index.ts` starts the HTTP server.
- `api/index.ts` exposes the Express app as a Vercel function.

The `/api` route paths, request fields, response shapes, and Indonesian error messages are kept compatible with the frontend's `apiRequest` calls.
