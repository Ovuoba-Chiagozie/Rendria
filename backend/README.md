# Rendria Nest backend

Rendria's NestJS API, backed by PostgreSQL. Code is organized by feature: each `src/modules/*` directory owns its controller, service, repository, DTOs, and types as needed. Cross-cutting guards live in `src/common`, runtime settings in `src/config`, and versioned SQL migrations in `database/migrations`.

## Run

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run start:dev
```

Run `npm.cmd run db:migrate` against the target PostgreSQL database before deploying new schema changes. Migrations are versioned and are not run by serverless function startup. `GET /health` checks database connectivity.

## Vercel deployment

The Vite frontend and API are separate Vercel projects. Set the API project's Root Directory to `backend` (relative to this Git repository's root) and connect it to the intended Git branch. Vercel detects `src/main.ts` as the NestJS entry point; [vercel.json](vercel.json) sets a 60-second function duration.

Current hosted URLs are `https://app-rendria.vercel.app` and `https://rendria-backend.vercel.app`. The frontend routes browser API calls through `/api/*` to the backend Vercel project, allowing host-only session cookies. When using custom domains, attach `app.rendria.com` to the frontend project and `api.rendria.com` to the API project.

## Production configuration

Required: `DATABASE_URL`, `JWT_SECRET`, `API_KEY_ENC_KEY` (base64-encoded 32 bytes), `APP_ENV=production`, `AWS_REGION`, `RENDER_LAMBDA_NAME`, all three `CLOUDINARY_*` values, and the Lemon Squeezy API key, webhook secret, store ID, and both product variant IDs. The server fails at startup when these production settings are missing.

Keep `JWT_SECRET` and `API_KEY_ENC_KEY` stable across deployments so existing sessions and encrypted API keys remain usable. Configure CORS, Cloudinary, and Lemon Squeezy using `.env.example`.

Production invokes the renderer through AWS Lambda; local development calls `SAM_RENDER_URL`. Add every value from `.env.example` to the API Vercel project for Production, Preview, and Development as appropriate. The Vercel AWS principal must have permission to invoke `RENDER_LAMBDA_NAME`. Set `API_BASE_URL=https://rendria-backend.vercel.app` while using the Vercel domain; change it to `https://api.rendria.com` only if that API domain is active and should be used for generated asset URLs. Session cookies are host-only; the frontend's `/api` proxy keeps them on the frontend hostname. `CORS_ORIGINS` adds any extra trusted frontend origins to the built-in local, Vercel, and custom-domain origins. If PostgreSQL uses a custom CA, configure Node's trusted CA; TLS certificate verification is enabled in production.

## Verification

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run test -- --runInBand
npm.cmd run test:e2e -- --runInBand
```

Before releasing, smoke-test signup, login, templates, `/v1/render`, batch ZIP output, and a signed Lemon webhook in staging. The API uses a small serverless-safe PostgreSQL pool; use your provider's pooled connection string where available. The local tests do not substitute for a staging test with PostgreSQL, AWS, Cloudinary, and the deployed Vercel environment. Batch rendering remains synchronous within the 60-second function duration; large batches may time out and need a background job for reliable processing.
