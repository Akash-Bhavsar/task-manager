# Task Manager

Full-stack task manager: JWT auth + task CRUD with role-based access (ADMIN/USER).

🔗 **Live demo:** https://task-manager-phi-eight-69.vercel.app

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Akash-Bhavsar/task-manager&root-directory=client&env=NEXT_PUBLIC_API_URL&envDescription=Base%20URL%20of%20the%20API%20server&project-name=task-manager&repository-name=task-manager)
[![Create a Neon Postgres DB](https://img.shields.io/badge/Neon-Create%20Postgres-00E599?logo=postgresql&logoColor=white)](https://console.neon.tech/signup)

1. **Neon** → create a free serverless Postgres and copy its `DATABASE_URL`.
2. **Vercel** → deploys the Next.js client (`client/`); set `NEXT_PUBLIC_API_URL`
   to your API URL.
3. **API** → deploy `server/` (Docker runtime, `server/Dockerfile`) on Render and
   set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`.

See the [`## Deploy`](#deploy) section and `terraform/README.md` for the full,
Terraform-driven setup.

## Stack

- **Client** (`client/`) — Next.js 16, React 19, TypeScript, Tailwind. Auth via httpOnly cookie.
- **Server** (`server/`) — Express 5, TypeScript, Prisma, PostgreSQL, JWT, Winston.
- **Infra** (`terraform/`) — Neon (Postgres) + Vercel (client). Render (API) on free tier, manual.
- **CI** (`.github/workflows/ci.yml`) — lint/build client, build/test server on a Postgres service.

Node 20. See `CLAUDE.md` for architecture and command details.

## Local dev

```bash
# server
cd server
cp .env.example .env          # set DATABASE_URL, JWT_SECRET
npm ci
npx prisma generate && npx prisma db push
npm run dev                   # API on PORT (default 4000)

# client
cd client
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm ci
npm run dev                   # http://localhost:3000
```

Needs a Postgres DB (local or Neon).

## Test

```bash
cd server && npm test         # Vitest + Supertest, needs a live Postgres
```

## API

| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/users/register` | create user |
| POST | `/api/users/login` | sets `accessToken` cookie |
| POST | `/api/users/logout` | clears cookie |
| GET | `/api/users/me` | current user (auth) |
| GET/POST | `/api/tasks` | list (own; ADMIN sees all) / create |
| GET | `/api/tasks/my-tasks` | own tasks |
| PUT/DELETE | `/api/tasks/:id` | update / delete |

Full collection: `server/Node API.postman_collection.json`.

## Deploy

Git-native CD — push to `main` → Vercel (client) + Render (API) rebuild; Neon hosts Postgres.

- Provisioning + manual steps: `terraform/README.md` (Path A = free).
- Render free service runs the `server/Dockerfile` (Docker runtime).

## Screenshots

| | |
|---|---|
| Homepage | ![Homepage](/public/Homepage.webp) |
| Kanban board | ![Kanban board](/public/Dashboard.webp) |
| List view & filters | ![List view and filters](/public/Filters.webp) |
| Login | ![Login](/public/LoginPage.webp) |
| Signup | ![Signup](/public/SignupPage.webp) |
| Create task | ![Create Task](/public/CreateTask.webp) |
| Edit task | ![Edit Task](/public/EditTask.webp) |

## License

MIT — see `LICENSE`.
