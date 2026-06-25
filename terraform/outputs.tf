output "client_url" {
  value       = local.client_url
  description = "Production URL of the Vercel client"
}

output "server_url" {
  value       = local.server_url
  description = "Public URL of the Render API"
}

output "database_url" {
  value       = neon_project.db.connection_uri_pooler
  description = "Pooled Neon connection string used by the API"
  sensitive   = true
}
