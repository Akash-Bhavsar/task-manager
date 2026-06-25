output "api_url" {
  value       = var.api_url
  description = "Render API base URL injected into the client"
}

output "database_url" {
  value       = neon_project.db.connection_uri_pooler
  description = "Pooled Neon connection string used by the API"
  sensitive   = true
}

output "render_service_url" {
  value       = coalesce(one(render_web_service.server[*].url), "(unmanaged — created in Render dashboard)")
  description = "Render service URL when managed by Terraform"
}
