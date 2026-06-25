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
- **CD (deferred):** intended to be platform-native — Vercel (client) + Render
  (server) auto-deploy on push once the repo is connected; Neon hosts Postgres.
  Not wired up yet. GitHub Actions deliberately does CI only.

## Security note

`terraform/terraform.tfstate` previously contained a live Neon DB password and
was committed. State files and `terraform/.terraform/` are now gitignored —
**never commit tfstate or `.terraform/`**. The `.terraform.lock.hcl` lock file
*should* stay tracked.

## Known gaps (intentional, for later)

- `client/Dockerfile` & `server/Dockerfile` are broken (Node 16; server image
  never builds `dist/` or runs `prisma generate`). Unused under platform-native
  CD — remove or fix before any Docker-based deploy.
- `terraform/` only defines Neon resources; Vercel/Render providers are declared
  but have no resources, and `providers.tf` configures only Neon. Finish when
  wiring up CD.
- Server CORS origin is hardcoded to `http://localhost:3000` in `server/app.ts`;
  make it configurable before production.
