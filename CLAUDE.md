# CLAUDE.md

Guidance for working in this repository. Keep this file current when commands,
structure, or workflows change.

## What this is

A task-manager web app, split into two independently-deployed packages plus IaC:

- **`client/`** — Next.js 16 + React 19 + TypeScript + Tailwind. Login/signup
  (JWT) and a task CRUD dashboard. Talks to the API via `NEXT_PUBLIC_API_URL`.
- **`server/`** — Express 5 + TypeScript + Prisma + PostgreSQL + JWT. REST API
  under `/api/users` and `/api/tasks` with role-based access (ADMIN/USER).
- **`terraform/`** — provisions Neon (Postgres). Vercel + Render providers are
  declared in `versions.tf` but not yet wired up (intended CD targets).

This is a monorepo with **separate `package.json` / `package-lock.json` per
package** — always run npm commands from inside `client/` or `server/`, not root.

## Node

Node **20 LTS** (pinned in `.nvmrc`). Do not use Node 16 — it's EOL and cannot
build Next 16 / React 19. (The Dockerfiles still say Node 16 and are broken; see
"Known gaps".)

## Commands

### Client (`cd client`)
- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build (also type-checks). Needs `NEXT_PUBLIC_API_URL`.
- `npm run lint` — ESLint, **check-only**, fails CI on any error/warning
- `npm run lint:fix` — ESLint with `--fix` (local convenience)
- `npm run format` — Prettier write

### Server (`cd server`)
- `npm run dev` — ts-node-dev watch
- `npm run build` — `tsc` → `dist/`
- `npm start` — `node dist/index.js` (requires a prior build)
- `npm test` — `vitest run` (integration tests; **need a live Postgres**)
- `npx prisma generate` — regenerate the Prisma client
- `npx prisma db push` — sync schema to the DB (no migrations dir exists yet)

## Environment variables

Copy the examples and fill them in (real env files are gitignored):

- `server/.env` (from `server/.env.example`): `DATABASE_URL`, `JWT_SECRET`,
  `PORT`, `env_type`
- `client/.env.local` (from `client/.env.example`): `NEXT_PUBLIC_API_URL`

## Database / Prisma

- Postgres. Schema: `server/prisma/schema.prisma` (`User`, `Task`, `Role` enum).
- No migration history — schema is applied with `prisma db push`.
- `server/scripts/init-db.sh` bootstraps a local DB from `DATABASE_URL`.

## Running the server tests locally

Tests hit a real Postgres via Prisma. Quickest throwaway DB (no Docker needed if
Postgres.app is installed):

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
PGDIR=$(mktemp -d /tmp/tm-pg.XXXXXX)
initdb -D "$PGDIR" -U postgres --auth=trust
pg_ctl -D "$PGDIR" -o "-p 55432 -k $PGDIR -c listen_addresses=localhost" -l "$PGDIR/server.log" start
createdb -h localhost -p 55432 -U postgres taskmanager_test

cd server
export DATABASE_URL="postgresql://postgres:postgres@localhost:55432/taskmanager_test"
export JWT_SECRET="ci-test-secret"
npx prisma generate && npx prisma db push && npm test

# teardown: pg_ctl -D "$PGDIR" stop -m fast && rm -rf "$PGDIR"
```

With Docker available, `postgres:16` on port 5432 works identically (this is what
CI uses).

## CI/CD

- **CI:** `.github/workflows/ci.yml` runs on push to `main` and on PRs. Two
  parallel jobs:
  - `client` — `npm ci`, `npm run lint`, `npm run build`
  - `server` — spins up a `postgres:16` service, then `npm ci`,
    `prisma generate`, `prisma db push`, `npm run build`, `npm test`
  - Least-privilege (`contents: read`), npm caching, concurrency cancel.
- **CD:** platform-native, declared in `terraform/`. Pushing to `main` makes
  **Vercel** (client) and **Render** (server) rebuild and deploy automatically;
  **Neon** hosts Postgres. GitHub Actions does CI only — it does not deploy.
  - `terraform/deploy.tf` manages the Vercel project (always) and the Render web
    service (only when `manage_render = true`, i.e. a paid plan). On the free
    tier (`manage_render = false`, default) Render is created manually — see
    `terraform/README.md`. `NEXT_PUBLIC_API_URL` is set on Vercel via
    `var.api_url`; `CLIENT_ORIGIN`/`CLIENT_ORIGIN_REGEX` are set on Render
    (dashboard on free, Terraform on paid).
  - Setup + apply steps: `terraform/README.md`. Requires a one-time GitHub app
    install in the Vercel and Render dashboards, then `terraform apply` with
    `terraform.tfvars` (gitignored).
  - The API's CORS origin is read from `CLIENT_ORIGIN` (`server/app.ts`), set by
    terraform to the Vercel URL.
  - **Render free tier:** the Render Terraform provider does NOT support free web
    services (`starter` is its cheapest). For a free deploy, create the Render
    service manually in the dashboard using the **Docker** runtime — `server/`
    has a working `server/Dockerfile` (Node 20; runs `prisma db push` then
    starts). Set env vars there: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`.
    Leave Render's pre-deploy command empty (the image's CMD handles db push).

## Security note

`terraform/terraform.tfstate` previously contained a live Neon DB password and
was committed. State files and `terraform/.terraform/` are now gitignored —
**never commit tfstate or `.terraform/`**. The `.terraform.lock.hcl` lock file
*should* stay tracked.

## Known gaps (intentional, for later)

- Terraform state is local and gitignored; move to a remote backend for team/CI
  use. Schema changes deploy via `prisma db push` (Render pre-deploy) — switch to
  real Prisma migrations (`prisma migrate deploy`) for production.
- Render starter plan cold-starts when idle, and its region (`singapore`) differs
  from Neon (`ap-southeast-2`), adding DB latency. Tune in `terraform.tfvars`.
- Deterministic deploy URLs assume the project/service names are free; if taken,
  override the env vars after first apply (see `terraform/README.md`).
