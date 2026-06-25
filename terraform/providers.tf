provider "neon" {
  api_key = var.neon_api_key
}

provider "vercel" {
  api_token = var.vercel_api_token
  # team    = var.vercel_team_id  # uncomment if the project lives under a team
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}
