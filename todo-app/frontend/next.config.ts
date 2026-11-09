import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning caused by a lockfile in the parent folder.
  outputFileTracingRoot: path.join(__dirname),

  // Same-origin proxy for LOCAL development only: the browser calls /api/*
  // on this Next.js origin and Next.js forwards to the FastAPI backend.
  // In production on Vercel, the top-level vercel.json already routes
  // /api/* to the backend service, so Next.js rewrites are never hit and
  // are disabled here to guarantee production never proxies to localhost.
  // Local value: API_PROXY_URL=http://localhost:8000 (see .env.example).
  async rewrites() {
    if (process.env.VERCEL) return [];
    const backend = (process.env.API_PROXY_URL || "http://localhost:8000").replace(
      /\/$/,
      ""
    );
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
