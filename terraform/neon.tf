# Neon Postgres. The project auto-creates a default branch, database, role and
# pooled connection string, which is what the API uses (see outputs.tf and the
# render_web_service env_vars -> connection_uri_pooler).
resource "neon_project" "db" {
  name      = var.project_name
  region_id = var.region
}
