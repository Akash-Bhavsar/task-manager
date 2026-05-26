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

variable "branch_name" {
  type        = string
  default     = "main"
  description = "Branch name"
}

variable "database_name" {
  type        = string
  default     = "taskmanager"
  description = "Database name"
}

variable "role_name" {
  type        = string
  default     = "appuser"
  description = "PostgreSQL role for the application"
}

variable "role_password" {
  type        = string
  sensitive   = true
  description = "Password for the app role"
}
