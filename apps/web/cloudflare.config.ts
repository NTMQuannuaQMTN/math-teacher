import { bindings, defineConfig, defineWorker } from "cf/config";

// Web Worker (vinext). Values for secrets come from .dev.vars locally and `wrangler secret put` in production.
// ADMIN_DEV_TOKEN is deliberately not declared: production admin access goes through Cloudflare Access.
export default defineConfig({
  worker: defineWorker({
    name: "math-tutor-web",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-20",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Origin of the Python API Worker (Cloudflare Container front), e.g. https://api.example.com
      API_ORIGIN: bindings.secret(),
      // Shared secret checked by FastAPI (GATEWAY_SECRET) so the API cannot be called around this gateway.
      API_GATEWAY_SECRET: bindings.secret(),
    },
  }),
});
