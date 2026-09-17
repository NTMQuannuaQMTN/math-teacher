# Math Teacher — MVP

An AI mathematics teacher: photograph a question, get it read, classified, (for geometry)
diagrammed, solved, and explained.

```
Student → photo/upload → AI understands → classify
                                              │
                                    geometry? ─┴─ not geometry
                                       │              │
                          generate interactive        │
                             diagram (SVG)             │
                                       └──────┬────────┘
                                         solve + explain
                                              │
                                       student learns
```

See [docs/DECISIONS.md](docs/DECISIONS.md) for the architecture decisions made while building
this (including where the original spec was ambiguous or cut off and how those gaps were filled).

## Repository layout

- `app/` — Expo (React Native + TypeScript) client. No secrets live here.
- `worker/` — Cloudflare Worker (TypeScript) backend: API, D1, R2, and the AI provider call.
- `docs/` — architecture notes.

## Running it locally

### 1. Backend (`worker/`)

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars   # then put a real ANTHROPIC_API_KEY in .dev.vars
npm run db:migrate:local         # creates the local D1 schema
npm run dev                      # starts wrangler dev on http://localhost:8787
```

Useful checks:

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit tests for schema validation / upload guards (node:test)
curl localhost:8787/health
```

### 2. Client (`app/`)

```bash
cd app
npm install
cp .env.example .env   # EXPO_PUBLIC_API_URL — point this at your worker
npm start               # Expo dev server; scan the QR code with Expo Go, or press i/a
```

`EXPO_PUBLIC_API_URL` defaults to `http://localhost:8787`, which works for the iOS Simulator
and web. For a physical device on the same network, set it to your machine's LAN IP
(e.g. `http://192.168.1.23:8787`), since the phone can't resolve your laptop's `localhost`.

**Camera note:** taking a photo works in Expo Go on a real device. It does not work in the iOS
Simulator (no camera hardware). "Choose from Library" always works as a fallback. A custom
development build (`expo prebuild` + EAS/local build) is only needed if you want the custom
permission-prompt copy configured in `app.json` to take effect, or native camera behavior beyond
what Expo Go's bundled module provides.

## Deploying the backend

```bash
cd worker
npx wrangler d1 create math_teacher_db        # then paste the id into wrangler.toml
npx wrangler r2 bucket create math-teacher-images
npx wrangler secret put ANTHROPIC_API_KEY
npm run db:migrate:remote
npm run deploy
```

## What's implemented (MVP scope)

- Image capture/upload with permission handling, format/size validation, cancellation, and
  network-failure handling.
- A single backend endpoint (`POST /api/questions`) that runs the whole pipeline — extract,
  classify, optionally generate an interactive geometry diagram spec, solve, explain — and
  returns one structured, schema-validated result.
- All AI output is parsed and validated with Zod before being trusted or stored; invalid output
  is a handled failure, never silently passed through.
- Interactive geometry diagrams rendered client-side with `react-native-svg` from a declarative
  JSON scene graph (tap a point to highlight it).
- Per-IP rate limiting, upload size/type limits, magic-byte image content verification (the
  client-declared MIME type is never trusted on its own), and sanitized error messages (internal
  AI/validation diagnostics are logged server-side, never returned to the client).
- No AI credentials in the client; the Worker is the only thing that talks to the AI provider.

### Post-MVP hardening pass

Three improvements made after the core flow was working end-to-end:

- **Retry with backoff** on transient AI provider failures (network errors, 429/5xx) — up to 3
  attempts with short backoff, non-retryable errors (auth, bad request) fail immediately. See
  `worker/src/ai/anthropic.ts`.
- **Client-side image compression** (`expo-image-manipulator`) before upload — phone cameras
  routinely produce multi-MB photos; downscaling to a 1600px max dimension and re-compressing
  keeps uploads fast and reliable on cellular. See `app/src/prepareImage.ts`.
- **Local question history** (`@react-native-async-storage/async-storage`) — solved questions are
  listed on-device so a student can revisit a past explanation, reusing the existing
  `GET /api/questions/:id` endpoint rather than adding new backend surface. See `app/src/history.ts`.

## Known MVP limitations (intentionally out of scope for now)

- No user accounts — a question is retrievable only by its opaque id.
- No image retention/cleanup policy for R2 (uploaded images persist indefinitely).
- No syllabus, knowledge tracking, or adaptive learning — see the product vision for what's next.
