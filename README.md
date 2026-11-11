# Rendria

Rendria has a Vite frontend in `src/` and a NestJS API in `backend/`. They deploy as separate Vercel projects from this repository.

## URLs

| Environment | Frontend | API used by the browser | Default public API URL |
| --- | --- | --- | --- |
| Local | `http://localhost:5173` | `/api` (Vite proxy) | `http://localhost:5000` |
| Vercel | `https://app-rendria.vercel.app` | `/api` (Vercel rewrite) | `https://rendria-backend.vercel.app` |
| Custom domain | `https://app.rendria.com` | `/api` (same Vercel rewrite) | `https://rendria-backend.vercel.app` |

The frontend always calls `/api`. Vite forwards that path to the local API during development, and the frontend Vercel project forwards it to `rendria-backend.vercel.app` in hosted deployments. Login cookies remain on the frontend hostname.

Set the frontend Vercel project's Root Directory to the repository root, and the API project's Root Directory to `backend`. Configure the API project's variables according to [backend/README.md](backend/README.md). The frontend needs no API URL variable for browser requests.

To use the custom domains, attach `app.rendria.com` to the frontend project and, if desired, `api.rendria.com` to the API project. Browser requests continue to use `/api` without a code change. To show the custom API URL in the API documentation examples, set the **frontend** Vercel variable `VITE_PUBLIC_API_URL=https://api.rendria.com` and redeploy the frontend. Otherwise those examples continue to use the backend Vercel URL.

## Local development

Run `npm install` and `npm run start` for the frontend. Follow [backend/README.md](backend/README.md) to start the API and prepare PostgreSQL.
