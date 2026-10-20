import { defineConfig, devices } from "@playwright/test";

// Full-stack E2E: real FastAPI + PostgreSQL (docker compose) + Next.js gateway.
// Only OCR uses recorded model output (OCR_PROVIDER=fixture, test-only).
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: "uv run python scripts/e2e_server.py",
      cwd: "../../services/api",
      url: "http://127.0.0.1:8011/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npx next start --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_ORIGIN: "http://127.0.0.1:8011",
        API_GATEWAY_SECRET: "e2e-gateway-secret",
        ADMIN_DEV_TOKEN: "e2e-admin",
      },
    },
  ],
});
