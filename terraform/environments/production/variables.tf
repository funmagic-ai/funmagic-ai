# Production Environment Variables

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

# Networking
variable "single_nat_gateway" {
  description = "Use single NAT gateway for cost savings"
  type        = bool
  default     = true
}

# RDS Configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.small"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 50
}

variable "rds_max_allocated_storage" {
  description = "RDS max allocated storage in GB"
  type        = number
  default     = 200
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

# ElastiCache Configuration
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

# CloudFront
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

# App Runner Instance Configurations
variable "web_instance_config" {
  description = "Instance configuration for web service"
  type = object({
    cpu             = string
    memory          = string
    min_instances   = number
    max_instances   = number
    max_concurrency = number
  })
  default = {
    cpu             = "256"
    memory          = "512"
    min_instances   = 0
    max_instances   = 5
    max_concurrency = 100
  }
}

variable "admin_instance_config" {
  description = "Instance configuration for admin service"
  type = object({
    cpu             = string
    memory          = string
    min_instances   = number
    max_instances   = number
    max_concurrency = number
  })
  default = {
    cpu             = "256"
    memory          = "512"
    min_instances   = 0
    max_instances   = 3
    max_concurrency = 100
  }
}

variable "backend_instance_config" {
  description = "Instance configuration for backend service"
  type = object({
    cpu             = string
    memory          = string
    min_instances   = number
    max_instances   = number
    max_concurrency = number
  })
  default = {
    cpu             = "256"
    memory          = "512"
    min_instances   = 1
    max_instances   = 10
    max_concurrency = 100
  }
}

# ECS Worker Configurations
variable "worker_config" {
  description = "Configuration for worker service"
  type = object({
    cpu           = number
    memory        = number
    desired_count = number
    use_spot      = bool
  })
  default = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    use_spot      = true
  }
}

variable "admin_worker_config" {
  description = "Configuration for admin-worker service"
  type = object({
    cpu           = number
    memory        = number
    desired_count = number
    use_spot      = bool
  })
  default = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    use_spot      = true
  }
}
