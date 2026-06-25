# Infrastructure (Terraform)

Provisions the deployment for task-manager:

- **Neon** — Postgres (`neon.tf`)
- **Vercel** — Next.js client, git-native auto-deploy (`deploy.tf`)
- **Render** — Express API, native Node runtime, git-native auto-deploy (`deploy.tf`)

Pushing to the production branch (`main`) makes Vercel and Render rebuild and
deploy automatically — that's the CD. Terraform just declares the projects, env
vars, and the GitHub link reproducibly.

## One-time manual prerequisites

Terraform can declare the projects, but the **GitHub ↔ platform connection is an
OAuth/app install that must be done once in each dashboard first**:

1. **Vercel**: log in, install the Vercel GitHub app, and grant it access to the
   `task-manager` repo. Create an API token (Account Settings → Tokens).
2. **Render**: log in, connect your GitHub account, grant access to the repo.
   Create an API key (Account Settings → API Keys) and note your **owner ID**
   (team `tea-…` or user `usr-…`).
3. **Neon**: create an API key (Account Settings → API Keys). The project already
   exists in state.

## Configure

```bash
cp terraform.tfvars.example terraform.tfvars
# fill in tokens/keys/owner id  (terraform.tfvars is gitignored)
```

## Apply

```bash
terraform init      # downloads providers for your OS (the old linux-only
                    # .terraform/ cache is gitignored and can be deleted)
terraform fmt
terraform validate
terraform plan
terraform apply
```

Outputs after apply:

- `client_url`  → `https://<vercel_project_name>.vercel.app`
- `server_url`  → `https://<render_service_name>.onrender.com`
- `database_url` (sensitive)

## How the two sides find each other

URLs are derived deterministically from the project/service **names**, so there's
no dependency cycle:

- Vercel gets `NEXT_PUBLIC_API_URL = https://<render_service_name>.onrender.com`
- Render gets `CLIENT_ORIGIN = https://<vercel_project_name>.vercel.app` (used by
  the API's CORS config)

⚠️ If a chosen name is already taken, the platform appends a suffix and the
derived URL will be wrong. Keep names unique, or set the env var to the real URL
after the first apply.

## Notes / future work

- **State is local.** `terraform.tfstate` is gitignored (it contains secrets).
  For team use or CI, move to a remote backend (Terraform Cloud, S3+DynamoDB,
  etc.). Never commit state.
- **Schema changes** are applied via `prisma db push` in Render's pre-deploy
  command. For production you'll eventually want real Prisma migrations
  (`prisma migrate deploy`) instead.
- **Render free/starter** services spin down when idle (cold starts) and the
  region (`singapore`) differs from Neon (`ap-southeast-2`), adding some DB
  latency. Adjust `render_plan` / `render_region` as needed.
