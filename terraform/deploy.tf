# Client (Vercel) + server (Render), git-native auto-deploy on push to the
# production branch. Neon DB is in neon.tf.
#
# Render's FREE tier cannot be managed by the Terraform provider (no "free"
# plan), so the Render service is OFF by default (manage_render = false) and
# created manually in the dashboard — see terraform/README.md. Set
# manage_render = true only on a paid plan (starter+).
#
# Real deploy URLs are passed in as variables (var.api_url, var.client_origins)
# because the platforms append a random suffix to the hostname, so they can't be
# derived from the names.

locals {
  repo_url = "https://github.com/${var.github_repo}"
}

# ---------------------------------------------------------------------------
# Client: Next.js on Vercel (always managed)
# ---------------------------------------------------------------------------

resource "vercel_project" "client" {
  name           = var.vercel_project_name
  framework      = "nextjs"
  root_directory = "client"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = var.production_branch
  }

  environment = [
    {
      key    = "NEXT_PUBLIC_API_URL"
      value  = var.api_url
      target = ["production", "preview"]
    },
  ]
}

# ---------------------------------------------------------------------------
# Server: Express API on Render (paid plans only; manage_render = true)
# ---------------------------------------------------------------------------

resource "render_web_service" "server" {
  count = var.manage_render ? 1 : 0

  name               = var.render_service_name
  plan               = var.render_plan
  region             = var.render_region
  root_directory     = "server"
  start_command      = "npm start"
  pre_deploy_command = "npx prisma db push"

  runtime_source = {
    native_runtime = {
      auto_deploy   = true
      branch        = var.production_branch
      build_command = "npm ci && npx prisma generate && npm run build"
      repo_url      = local.repo_url
      runtime       = "node"
    }
  }

  env_vars = {
    DATABASE_URL        = { value = neon_project.db.connection_uri_pooler }
    JWT_SECRET          = { value = var.jwt_secret }
    CLIENT_ORIGIN       = { value = var.client_origins }
    CLIENT_ORIGIN_REGEX = { value = var.client_origin_regex }
    NODE_VERSION        = { value = "20" }
    env_type            = { value = "production" }
  }
}
