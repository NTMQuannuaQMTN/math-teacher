# Putting the backend on Cloudflare (database, image storage, secrets)

The backend is one Cloudflare Worker (`worker/`). In production it needs:

| What | Cloudflare product | Binding in `wrangler.toml` | Holds |
|---|---|---|---|
| Database | **D1** (SQLite) | `DB` → `math_teacher_db` | scans, questions, solved lessons (shared library), rate limits |
| Image storage | **R2** | `IMAGES` → `math-teacher-images` | uploaded photos |
| Secrets | Worker secrets | — | `GEMINI_API_KEY`, `IMAGE_URL_SECRET` |

Locally, `wrangler dev` simulates D1 and R2 in `worker/.wrangler/state`, so none of this is needed for development.

All commands below run from `worker/`.

## 1. Log in

```sh
cd worker
npx wrangler login          # opens the browser; pick your Cloudflare account
npx wrangler whoami         # check it worked
```

A free Cloudflare account is enough. D1 free tier: 5 GB, 5M row reads/day and 100k row writes/day.
R2 free tier: 10 GB and no egress fees. Workers free tier: 100k requests/day.

## 2. Create the D1 database

```sh
npx wrangler d1 create math_teacher_db
```

It prints a block like this:

```toml
[[d1_databases]]
binding = "DB"
database_name = "math_teacher_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy **only the `database_id`** into the existing `[[d1_databases]]` block in `worker/wrangler.toml`.
Keep `binding = "DB"` and `migrations_dir = "migrations"` as they are.

> `wrangler.toml` already has a `database_id`. If you created the database earlier and this id is
> yours, skip this step. Check with `npx wrangler d1 list`.

## 3. Create the tables (migrations)

The schema lives in `worker/migrations/` (`0001_scans.sql` … `0004_shared_lessons.sql`). Apply it to the real database:

```sh
npm run db:migrate:remote     # = wrangler d1 migrations apply math_teacher_db --remote
```

Wrangler records applied migrations in a `d1_migrations` table, so running this again only applies new files.
**Every time a new `migrations/000N_*.sql` file is added, run this again before deploying.**

Check it:

```sh
npx wrangler d1 execute math_teacher_db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see `scans`, `solutions`, `rate_limits` and `d1_migrations`.

### If a migration fails with `table … already exists`

The database already has tables from something else (an older prototype, for example). Look at them first:

```sh
npx wrangler d1 execute math_teacher_db --remote --command "SELECT name, sql FROM sqlite_master WHERE type='table'"
```

If they aren't used by this app, back up, drop them and run the migrations again:

```sh
npx wrangler d1 export math_teacher_db --remote --output backup.sql
npx wrangler d1 execute math_teacher_db --remote --command "DROP TABLE IF EXISTS <old_table>;"
npm run db:migrate:remote
```

Or use a fresh database instead: `wrangler d1 create`, with a new name, and put the new id in `wrangler.toml`.

## 4. Create the R2 bucket for photos

```sh
npx wrangler r2 bucket create math-teacher-images
```

The name must match `bucket_name` in `wrangler.toml`. The bucket stays private: the app only reads photos through
short-lived signed URLs from the Worker.

## 5. Add the secrets

Secrets are encrypted on Cloudflare and never go in git or the app. `.dev.vars` is only for local dev.

```sh
npx wrangler secret put GEMINI_API_KEY      # paste the key when prompted
npx wrangler secret put IMAGE_URL_SECRET    # any random string of 32+ characters, e.g. from:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Only if you switch a provider back to OpenAI: `npx wrangler secret put OPENAI_API_KEY`.

## 6. Deploy

```sh
npm run deploy
```

Wrangler prints the URL, for example `https://math-teacher-worker.<your-subdomain>.workers.dev`. Test it:

```sh
curl https://math-teacher-worker.<your-subdomain>.workers.dev/health
```

## 7. Point the app at it

In `mobile/.env` (copy it from `mobile/.env.example`):

```sh
EXPO_PUBLIC_API_URL=https://math-teacher-worker.<your-subdomain>.workers.dev
```

Restart Metro (`npx expo start -c`). For Expo web, also add the web origin to `ALLOWED_ORIGINS` in `wrangler.toml` and deploy again.

## Everyday commands

| Task | Command |
|---|---|
| See recent scans | `npx wrangler d1 execute math_teacher_db --remote --command "SELECT id, status, created_at FROM scans ORDER BY created_at DESC LIMIT 10"` |
| Count stored lessons | `npx wrangler d1 execute math_teacher_db --remote --command "SELECT COUNT(*) FROM solutions WHERE status='ready'"` |
| Back up the database | `npx wrangler d1 export math_teacher_db --remote --output backup.sql` |
| Undo recent changes (Time Travel, last 30 days) | `npx wrangler d1 time-travel restore math_teacher_db --timestamp <unix-time>` |
| Live logs (includes the `≈ $` cost lines) | `npx wrangler tail` |
| Pause all AI spending | set `SOLVER_PROVIDER = "off"` in `wrangler.toml`, then `npm run deploy` |

## Before real users: Gemini billing

The Gemini key is on the **free tier**: about 5 requests per minute per model, a daily cap, and Google may use the
prompts to improve its products. For production, enable billing on the Google AI Studio project. Costs stay small
(measured: about $0.0008 per photo OCR and $0.004 per algebra lesson). Lessons are stored in D1 and reused, so
each distinct problem is paid for only once.
