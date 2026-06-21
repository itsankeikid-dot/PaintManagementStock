import type { NextConfig } from "next";
import path from "node:path";

/**
 * Security headers previously set in proxy.ts.
 * Moved here because Next.js 16 Proxy defaults to the Node.js runtime, which
 * OpenNext Cloudflare does not support. The `headers()` config is applied
 * without any request-time middleware, so it works on Cloudflare.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Pin the workspace root so Turbopack ignores the stray lockfile in the home
  // directory and treats this project as the root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ["192.168.1.6"],
  experimental: {
    turbopackFileSystemCacheForDev: true,
    serverActions: {
      allowedOrigins: ["localhost:3000", "192.168.1.6:3000"],
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
