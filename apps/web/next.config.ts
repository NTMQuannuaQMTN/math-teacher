import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Inline scripts/styles are allowed because Next.js hydration and KaTeX/JSXGraph inline styles need them; all
// student content is escaped before rendering (lib/math.ts) and KaTeX runs with trust disabled. A nonce-based
// script policy is the next hardening step.
const contentSecurityPolicy = [
  "default-src 'self'",
  // `next dev` hot reload evaluates code; production builds do not.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The repo root has its own lockfile (dev tooling); keep Turbopack rooted at the web app.
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  agentRules: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
