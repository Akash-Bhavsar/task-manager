variable "neon_api_key" {
  type        = string
  description = "API key for Neon access"
  sensitive   = true
}

variable "project_name" {
  type        = string
  default     = "task-manager-db"
  description = "Name of the Neon project"
}

variable "region" {
  type        = string
  default     = "aws-ap-southeast-2"
  description = "Region ID for Neon (e.g., aws-us-east-1, aws-ap-southeast-2)"
}

# ---------------------------------------------------------------------------
# GitHub
# ---------------------------------------------------------------------------

variable "github_repo" {
  type        = string
  default     = "Akash-Bhavsar/task-manager"
  description = "owner/repo used for git-native auto-deploy on both platforms"
}

variable "production_branch" {
  type        = string
  default     = "main"
  description = "Branch that triggers production deploys"
}

# ---------------------------------------------------------------------------
# Vercel (client)
# ---------------------------------------------------------------------------

variable "vercel_api_token" {
  type        = string
  sensitive   = true
  description = "Vercel API token (Account Settings > Tokens)"
}

variable "vercel_team_id" {
  type        = string
  default     = null
  description = "Vercel team slug/ID if the project lives under a team (optional)"
}

variable "vercel_project_name" {
  type        = string
  default     = "task-manager-client"
  description = "Vercel project name. Production URL is https://<name>.vercel.app"
}

# ---------------------------------------------------------------------------
# Render (server)
# ---------------------------------------------------------------------------

variable "render_api_key" {
  type        = string
  sensitive   = true
  description = "Render API key (Account Settings > API Keys)"
}

variable "render_owner_id" {
  type        = string
  description = "Render owner/team ID that owns the service"
}

variable "render_service_name" {
  type        = string
  default     = "task-manager-api"
  description = "Render web service name. Public URL is https://<name>.onrender.com"
}

variable "render_region" {
  type        = string
  default     = "singapore"
  description = "Render region (frankfurt|ohio|oregon|singapore|virginia). singapore is closest to Neon ap-southeast-2."
}

variable "render_plan" {
  type        = string
  default     = "starter"
  description = "Render plan (starter|standard|pro|...)"
}

# ---------------------------------------------------------------------------
# Application secrets
# ---------------------------------------------------------------------------

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "JWT signing secret for the API"
}
