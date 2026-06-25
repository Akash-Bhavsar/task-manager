# Infrastructure (Terraform)

Provisions task-manager deploy. **Path A (free)** — Terraform manages Neon +
Vercel; Render runs on its **free tier**, which the Render Terraform provider
cannot manage, so the Render service is created manually (once).

| Component | Hosting | Managed by |
|-----------|---------|------------|
| Postgres  | Neon    | Terraform (`neon.tf`) |
| Client    | Vercel  | Terraform (`deploy.tf`) |
| API       | Render (free, Docker) | **Manual** (dashboard) |

Once provisioned, **deploys are automatic**: push to `main` → Vercel and Render
rebuild. Terraform is only for provisioning/config.

## Why Render is manual

Render's Terraform provider rejects the free plan: `no such plan free for service
type web`. Only `starter`+ work in Terraform. So free tier = dashboard. To put
Render under Terraform later, set `manage_render = true` on a paid plan.

## One-time manual steps

1. **GitHub app installs** (Terraform can't do the OAuth):
   - Vercel: install the Vercel GitHub app, grant access to `task-manager`.
   - Render: connect GitHub, grant access to `task-manager`.
2. **API tokens**: Vercel API token; Neon API key.
3. **Render service** (free, Docker) — create manually:
   - Runtime: **Docker**, Root Directory: `server`, Dockerfile Path: `./Dockerfile`
   - Branch: `main`, Auto-Deploy: On, Pre-Deploy Command: *empty*
   - Env vars: `DATABASE_URL` (Neon pooler string), `JWT_SECRET`, `env_type=production`,
     `CLIENT_ORIGIN` (comma list incl. the Vercel URL),
     `CLIENT_ORIGIN_REGEX` (`^https://task-manager-[a-z0-9-]+\.vercel\.app$`)
   - Don't set `PORT` (Render injects it).
   - Note the resulting URL (e.g. `https://task-manager-n1hi.onrender.com`).

## Configure

```bash
cp terraform.tfvars.example terraform.tfvars
# fill in: neon_api_key, vercel_api_token, api_url (the Render URL from step 3)
# leave manage_render = false
```

## Apply

```bash
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

Outputs: `api_url`, `database_url` (sensitive), `render_service_url`
(`(unmanaged …)` on Path A).

## URL wiring (manual, because hosts get random suffixes)

The platforms append a random suffix to hostnames, so URLs can't be derived from
names. Set them by hand:

- Vercel `NEXT_PUBLIC_API_URL` = Render URL → `var.api_url` (Terraform sets it).
- Render `CLIENT_ORIGIN` = Vercel URL → set in the Render dashboard.

They must point at each other or auth/CORS breaks.

## Going full IaC later (Path B)

Upgrade Render to `starter`, then in `terraform.tfvars`:

```hcl
manage_render       = true
render_api_key      = "rnd_…"
render_owner_id     = "tea-…"
jwt_secret          = "…"
client_origins      = "https://<vercel-url>"
client_origin_regex = "^https://task-manager-[a-z0-9-]+\\.vercel\\.app$"
```

`terraform apply` then creates/manages the Render web service (native Node
runtime). Verify `render_web_service.server.url` resolves on the first plan.

## Notes

- **State is local** and gitignored (contains secrets). For team/CI use a remote
  backend (Terraform Cloud, S3+DynamoDB). Never commit state.
- Schema syncs via `prisma db push` (container CMD). Move to Prisma migrations
  (`migrate deploy`) for production.
- Render free spins down when idle (cold start); region `singapore` ≠ Neon
  `ap-southeast-2` adds some DB latency.
