# ElastiCache Redis Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ElastiCache subnet group"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (for cluster mode disabled)"
  type        = number
  default     = 1
}

variable "parameter_group_family" {
  description = "Parameter group family"
  type        = string
  default     = "redis7"
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover (requires num_cache_clusters >= 2)"
  type        = bool
  default     = false
}

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

# Generate auth token for Redis
resource "random_password" "auth_token" {
  length           = 32
  special          = false # Redis auth token has limited special char support
}

# Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name        = "funmagic-${var.environment}"
  description = "Subnet group for FunMagic Redis"
  subnet_ids  = var.subnet_ids

  tags = {
    Name        = "funmagic-${var.environment}"
    Environment = var.environment
  }
}

# Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name        = "funmagic-redis7-${var.environment}"
  family      = var.parameter_group_family
  description = "Parameter group for FunMagic Redis"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = {
    Name        = "funmagic-redis7-${var.environment}"
    Environment = var.environment
  }
}

# Replication Group (single node for starter, can scale to replica)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "funmagic-${var.environment}"
  description                = "FunMagic Redis cluster"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_nodes
  port                       = 6379
  engine_version             = var.engine_version
  parameter_group_name       = aws_elasticache_parameter_group.main.name
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [var.security_group_id]

  automatic_failover_enabled = var.automatic_failover_enabled && var.num_cache_nodes >= 2
  multi_az_enabled           = var.automatic_failover_enabled && var.num_cache_nodes >= 2

  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.transit_encryption_enabled ? random_password.auth_token.result : null

  snapshot_retention_limit = 1
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "mon:04:00-mon:05:00"

  apply_immediately = true

  tags = {
    Name        = "funmagic-${var.environment}"
    Environment = var.environment
  }
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint" {
  value = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "port" {
  value = aws_elasticache_replication_group.main.port
}

output "auth_token" {
  value     = random_password.auth_token.result
  sensitive = true
}

output "redis_url" {
  value     = var.transit_encryption_enabled ? "rediss://:${random_password.auth_token.result}@${aws_elasticache_replication_group.main.primary_endpoint_address}:6379" : "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
  sensitive = true
}
