# Setting up Cloudflare for Math Teacher

This walks through taking `worker/` from local-only (`wrangler dev` + local D1/R2 emulation) to a
real, deployed Cloudflare backend: a live Worker, a real D1 database, and a real R2 bucket.

Everything here happens in **your** Cloudflare account — none of it can be done for you, since it
requires your login and (for anything beyond the free tier) your billing details.

## 0. Prerequisites

- A Cloudflare account — sign up free at https://dash.cloudflare.com/sign-up. No credit card is
  required for the free tier, which comfortably covers this MVP (see [Costs](#costs-what-tier-do-i-need) below).
- Node.js and the repo already set up locally (`cd worker && npm install` — see the main
  [README](../README.md) if you haven't done this yet).
- An OpenAI API key (https://platform.openai.com/api-keys) — this is the one secret the app needs
  by default. (An Anthropic key works too if you'd rather run Claude — see
  [Switching AI providers](#switching-ai-providers).)

You do **not** need to install `wrangler` globally; the repo already has it as a dev dependency,
so every command below is run as `npx wrangler ...` from inside `worker/`.

## 1. Log in to Cloudflare from the CLI

```bash
cd worker
npx wrangler login
```

This opens a browser tab to authorize the CLI against your Cloudflare account. Once it says
"Successfully logged in", close the tab and return to the terminal.

If you're on a machine without a browser (e.g. a remote box), use `npx wrangler login` anyway —
it prints a URL you can open on another device — or generate an API token instead:
Cloudflare dashboard → **My Profile → API Tokens → Create Token** (use the "Edit Cloudflare
Workers" template), then `export CLOUDFLARE_API_TOKEN=<token>` before running wrangler commands.

Verify it worked:

```bash
npx wrangler whoami
```

## 2. Create the D1 database

```bash
npx wrangler d1 create math_teacher_db
```

This prints a block like:

```toml
[[d1_databases]]
binding = "DB"
database_name = "math_teacher_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id` value and paste it into `worker/wrangler.toml`, replacing
`REPLACE_WITH_D1_DATABASE_ID`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "math_teacher_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # <- your real id
migrations_dir = "migrations"
```

Run the schema migration against the **real, remote** database (this is separate from the local
one `wrangler dev` uses — `--local` and `--remote` are genuinely different databases):

```bash
npm run db:migrate:remote
```

## 3. Create the R2 bucket

Unlike D1, R2 is not automatically active on a new account — it needs a one-time enable step:

1. Go to https://dash.cloudflare.com → select your account → **R2 Object Storage** in the
   sidebar.
2. Click **Enable R2** (wording varies: "Purchase R2 Plan" / "Get started"). This activates the
   free tier (10GB storage, no egress fees — see [Costs](#costs-what-tier-do-i-need)). Cloudflare
   may ask for a payment method for overage protection; you won't be charged within the free tier.

Skipping this step gives a `10042` error (`Please enable R2 through the Cloudflare Dashboard`)
when you try to create the bucket — see [Troubleshooting](#troubleshooting).

Then create the bucket:

```bash
npx wrangler r2 bucket create math-teacher-images
```

The bucket name already matches what's in `wrangler.toml` (`bucket_name = "math-teacher-images"`),
so no further config is needed unless you want a different name — if you do, update both the
`wrangler r2 bucket create` command and the `bucket_name` in `wrangler.toml` to match.

R2 buckets are private by default, which is what we want: uploaded question images are never
served over a public URL, only read back by the Worker itself.

## 4. Set the AI provider's API key as a secret

The backend defaults to OpenAI (`AI_PROVIDER = "openai"` in `wrangler.toml`); Anthropic is also
supported — see [Switching AI providers](#switching-ai-providers) below. You only need to set the
secret matching whichever one is active.

Secrets are encrypted and never appear in `wrangler.toml` or git history — this is different from
the plain `[vars]` block already in `wrangler.toml` (model name, upload limit, rate limit), which
are non-sensitive config and fine to keep in plain text.

```bash
npx wrangler secret put OPENAI_API_KEY
```

This prompts you to paste the key **into your terminal**, not into a chat window, an IDE
assistant, a Slack message, or anywhere else that isn't the `wrangler` prompt itself. Anywhere
else the key gets typed, treat it as compromised and rotate it immediately at
https://platform.openai.com/api-keys — a key that's been pasted somewhere it can be logged or
retained isn't safe to keep using even if you immediately delete the message.

To confirm the secret is set (without revealing the value):

```bash
npx wrangler secret list
```

## 5. Deploy

```bash
npm run deploy
```

Wrangler prints the live URL on success, something like:

```
https://math-teacher-worker.<your-subdomain>.workers.dev
```

(`<your-subdomain>` is assigned to your Cloudflare account the first time you deploy any Worker —
it's free and shared across all your Workers.)

## 6. Verify the deployment

```bash
curl https://math-teacher-worker.<your-subdomain>.workers.dev/health
# {"ok":true}
```

Then do a real end-to-end check with an actual image:

```bash
curl -X POST https://math-teacher-worker.<your-subdomain>.workers.dev/api/questions \
  -F "image=@/path/to/a/math-question.jpg"
```

You should get back a full JSON result (classification, optional geometry, solution). If you get
an error, see [Troubleshooting](#troubleshooting) below.

## 7. Point the Expo app at the deployed Worker

Edit `app/.env` (create it from `app/.env.example` if you haven't already):

```bash
EXPO_PUBLIC_API_URL=https://math-teacher-worker.<your-subdomain>.workers.dev
```

Restart the Expo dev server (`npm start` in `app/`) after changing this — `EXPO_PUBLIC_*` vars are
baked in at bundle time, so a running Metro instance won't pick up the change automatically.

This is also the point where testing on a physical device over Expo Go stops needing your laptop
and phone to be on the same Wi-Fi network — with a deployed Worker, any internet connection works.

## 8. (Optional) Custom domain

If you have a domain on Cloudflare, you can route the Worker to it instead of the
`workers.dev` subdomain:

1. Cloudflare dashboard → **Workers & Pages** → your worker → **Settings → Domains & Routes**.
2. Add a custom domain (e.g. `api.yourdomain.com`) — Cloudflare handles the DNS and TLS cert
   automatically since the domain is already on Cloudflare.
3. Update `EXPO_PUBLIC_API_URL` to the new domain.

Not required for the MVP — the free `workers.dev` subdomain works fine for development and
early testing.

## Switching AI providers

The backend supports two AI providers behind one interface (`worker/src/ai/provider.ts`) — see
[docs/DECISIONS.md](DECISIONS.md) for why it's built this way. Switching is a config change, not
a code change:

```toml
# worker/wrangler.toml
[vars]
AI_PROVIDER = "openai"      # or "anthropic"
```

Then make sure the matching secret is set (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY` — see step 4)
and redeploy:

```bash
npx wrangler secret put ANTHROPIC_API_KEY   # if switching to anthropic
npm run deploy
```

Both secrets can be set at once with no harm — only the one matching `AI_PROVIDER` is read.

## Ongoing operations

**Tail live logs** (useful since the Worker sanitizes error responses — full diagnostic detail is
only in `console.error` output, by design, see [docs/DECISIONS.md](DECISIONS.md)):

```bash
npx wrangler tail
```

**Apply a new migration** after adding a file to `worker/migrations/`:

```bash
npm run db:migrate:remote
```

**Update the secret** if the key rotates:

```bash
npx wrangler secret put OPENAI_API_KEY   # or ANTHROPIC_API_KEY, whichever is active
```

**Inspect remote D1 data** (e.g. to debug a specific question):

```bash
npx wrangler d1 execute math_teacher_db --remote --command \
  "SELECT id, status, topic, created_at FROM questions ORDER BY created_at DESC LIMIT 10;"
```

**Redeploy** after any code change:

```bash
npm run deploy
```

## Costs: what tier do I need?

The Cloudflare **Workers Free** plan covers this MVP for development and light real usage:

| Resource | Free tier | This app's usage |
|---|---|---|
| Worker requests | 100,000/day | One request per question submission |
| D1 storage | 5 GB, 25M row reads/day | A few rows per question — trivial |
| R2 storage | 10 GB, no egress fees | One image per question (~100-500KB after client-side compression) |

The AI provider (OpenAI or Anthropic, whichever is active) is billed separately and is the actual
cost driver (one vision + one-or-two text calls per question) — see
https://openai.com/api/pricing/ or https://www.anthropic.com/pricing for current rates.
`RATE_LIMIT_PER_HOUR` in `wrangler.toml` (default 10/IP/hour) exists specifically to bound this
exposure; lower it if you want a tighter cap before opening this up to real users.

If you outgrow the free tier (heavy usage, need Workers' paid-plan longer CPU-time limits, etc.),
Cloudflare's **Workers Paid** plan is $5/month base + usage — see
https://developers.cloudflare.com/workers/platform/pricing/ for current numbers.

## Troubleshooting

**`wrangler r2 bucket create` fails with `Please enable R2 through the Cloudflare Dashboard. [code: 10042]`**
R2 isn't activated on your account yet — it's a separate opt-in from Workers/D1. Go to
https://dash.cloudflare.com → **R2 Object Storage** → **Enable R2**, then retry the command. See
step 3 above for detail.

**"AI provider is not configured on the server" (500, `provider_unconfigured`)**
The secret matching `AI_PROVIDER` (`OPENAI_API_KEY` by default, or `ANTHROPIC_API_KEY` if you
switched — see [Switching AI providers](#switching-ai-providers)) isn't set on the deployed
Worker. Local `.dev.vars` only applies to `wrangler dev` — it is never deployed. Run
`npx wrangler secret put OPENAI_API_KEY` (or the Anthropic equivalent) again and confirm with
`npx wrangler secret list`.

**`wrangler deploy` fails with a D1/R2 "not found" error**
The `database_id` in `wrangler.toml` doesn't match a real database in your account (still has the
placeholder, or you copy-pasted it wrong), or the R2 bucket name doesn't match what you created.
Run `npx wrangler d1 list` / `npx wrangler r2 bucket list` to check the real names/ids.

**Migrations "already applied" but the remote schema looks empty**
You likely ran `npm run db:migrate:local` (local emulated DB) instead of
`npm run db:migrate:remote` (the real one). They're tracked independently.

**The app can't reach the Worker from a physical device**
Check `EXPO_PUBLIC_API_URL` in `app/.env` — if it's still `http://localhost:8787`, that only
resolves on the machine running the Worker, not on a phone. Use the deployed `workers.dev` URL
(or your custom domain) once you've deployed, per step 7 above.
