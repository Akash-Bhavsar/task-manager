# Client (Vercel) + server (Render) with git-native auto-deploy on push to the
# production branch. The Neon database is defined in neon.tf.
#
# URLs are derived deterministically from the project/service names so the two
# sides can reference each other without a dependency cycle. If a name is already
# taken, the platform appends a suffix and these URLs will be wrong — keep names
# unique, or override them after the first apply.

locals {
  repo_url   = "https://github.com/${var.github_repo}"
  server_url = "https://${var.render_service_name}.onrender.com"
  client_url = "https://${var.vercel_project_name}.vercel.app"
}

# ---------------------------------------------------------------------------
# Client: Next.js on Vercel
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
      value  = local.server_url
      target = ["production", "preview"]
    },
  ]
}

# ---------------------------------------------------------------------------
# Server: Express API on Render (native Node runtime, builds from repo)
# ---------------------------------------------------------------------------

resource "render_web_service" "server" {
  name               = var.render_service_name
  plan               = var.render_plan
  region             = var.render_region
  start_command      = "cd server && npm start"
  pre_deploy_command = "cd server && npx prisma db push"

  runtime_source = {
    native_runtime = {
      auto_deploy   = true
      branch        = var.production_branch
      build_command = "cd server && npm ci && npx prisma generate && npm run build"
      repo_url      = local.repo_url
      runtime       = "node"
    }
  }

  env_vars = {
    DATABASE_URL = { value = neon_project.db.connection_uri_pooler }
    JWT_SECRET   = { value = var.jwt_secret }
    CLIENT_ORIGIN = { value = local.client_url }
    NODE_VERSION = { value = "20" }
    env_type     = { value = "production" }
  }
}
