import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning caused by a lockfile in the parent folder.
  outputFileTracingRoot: path.join(__dirname),

  // Same-origin proxy: the browser calls /api/* on this Next.js origin and
  // Next.js forwards to the FastAPI backend. This avoids CORS errors without
  // changing the FastAPI backend (whose CORS only allows the old Vite port).
  // Set API_PROXY_URL to your backend URL in production (e.g. on Vercel).
  async rewrites() {
    const backend = process.env.API_PROXY_URL || "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
