import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Server Actions CSRF: behind IIS / reverse proxy the inferred host is often
// localhost:5000 while the browser Origin is the public https URL, which
// aborts the action with 500. Prefer fixing IIS: iis/reverse-proxy-web.config
// (X-Forwarded-Host / Proto). Optionally set NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS
// (comma-separated host:port, no https://) to your public site hostname.
// Wildcards like *.scipl.info.in match any subdomain (see next/server csrf-protection).
const fromEnv = (process.env.NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// Include :3000 (next dev) and :5000 (typical production / IIS) local origins.
const defaultServerActionOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  "localhost:5000",
  "127.0.0.1:5000",
  "*.scipl.info.in",
  "*.sciql.info.in",
];
const extraServerActionOrigins = [
  ...new Set([...fromEnv, ...defaultServerActionOrigins]),
];

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@microsoft/signalr"],

  experimental: {
    serverActions: {
      allowedOrigins: extraServerActionOrigins,
      // default in Next is 1mb; allow slightly larger form posts if needed
      bodySizeLimit: "25mb",
    },
  },


  // Production standalone build
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  outputFileTracingIncludes: {
    "/*": ["./src/i18n/locales/**/*", "./public/**/*"],
  },

  compress: true,
  trailingSlash: false,

  poweredByHeader: false,

  async rewrites() {
    return [
      {
        source: "/manifest.webmanifest",
        destination: "/manifest.json",
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/((?!api/(?:report-download|designer-report-download)(?:/|$)).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/designer-report-download/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/report-download/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
