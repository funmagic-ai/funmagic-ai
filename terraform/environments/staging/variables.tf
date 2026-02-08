# Staging Environment Variables

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

# Cloudflare
variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for funmagic.ai"
  type        = string
}

# GitHub
variable "github_org" {
  description = "GitHub organization"
  type        = string
  default     = "funmagic"
}

variable "github_repo" {
  description = "GitHub repository"
  type        = string
  default     = "funmagic-ai"
}

# ECR Repository URLs (from global/ecr output)
variable "ecr_repository_urls" {
  description = "Map of ECR repository URLs"
  type        = map(string)
}

# RDS Configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "RDS max allocated storage in GB"
  type        = number
  default     = 50
}

# ElastiCache Configuration
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}
