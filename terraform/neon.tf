resource "neon_project" "db" {
  name   = var.project_name
  region_id = var.region
}

resource "neon_branch" "main" {
  project_id = neon_project.db.id
  name       = var.branch_name
}

resource "neon_role" "appuser" {
  project_id = neon_project.db.id
  branch_id  = neon_branch.main.id
  name       = var.role_name
}

resource "neon_database" "main" {
  project_id  = neon_project.db.id
  branch_id   = neon_branch.main.id
  name        = var.database_name
  owner_name  = neon_role.appuser.name  # ✅ REQUIRED
}

output "neon_db_connection_hint" {
  value = "postgres://<user>:<password>@${neon_branch.main.host}/${neon_database.main.name}?sslmode=require"
}
