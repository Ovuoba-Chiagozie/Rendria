// Vite proxies this path locally; Vercel rewrites it in hosted deployments.
export const APP_BASE_URL = "/api";

// External API examples need an absolute URL, unlike browser requests.
export const PUBLIC_API_BASE_URL = (
  import.meta.env.VITE_PUBLIC_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://rendria-backend.vercel.app")
).replace(/\/$/, "");
