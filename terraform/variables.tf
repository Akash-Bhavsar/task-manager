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

variable "api_url" {
  type        = string
  description = "Render API base URL, injected into the client as NEXT_PUBLIC_API_URL (e.g. https://task-manager-n1hi.onrender.com)"
}

# ---------------------------------------------------------------------------
# Render (server). manage_render = false (default) => Render is created manually
# in the dashboard (required for the free tier). render_* creds are only needed
# when manage_render = true.
# ---------------------------------------------------------------------------

variable "manage_render" {
  type        = bool
  default     = false
  description = "Manage the Render web service via Terraform. Requires a paid plan (starter+); free tier is unsupported by the provider."
}

variable "client_origins" {
  type        = string
  default     = ""
  description = "Comma-separated CORS allowlist for the API (CLIENT_ORIGIN). Only used when manage_render = true."
}

variable "client_origin_regex" {
  type        = string
  default     = ""
  description = "Regex of allowed origins for preview URLs (CLIENT_ORIGIN_REGEX). Only used when manage_render = true."
}

variable "render_api_key" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Render API key (Account Settings > API Keys). Needed only when manage_render = true."
}

variable "render_owner_id" {
  type        = string
  default     = ""
  description = "Render owner/team ID. Needed only when manage_render = true."
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
  description = "Render plan. The provider does NOT support free-tier web services; starter is the cheapest."

  validation {
    condition     = contains(["starter", "standard", "pro", "pro_plus", "pro_max", "pro_ultra"], var.render_plan)
    error_message = "render_plan must be one of starter, standard, pro, pro_plus, pro_max, pro_ultra. 'free' is not supported by the Render Terraform provider — create a free service in the dashboard instead."
  }
}

# ---------------------------------------------------------------------------
# Application secrets
# ---------------------------------------------------------------------------

variable "jwt_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "JWT signing secret for the API. Only used when manage_render = true (otherwise set it in the Render dashboard)."
}
