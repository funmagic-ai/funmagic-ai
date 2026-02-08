# Secrets Manager Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection URL"
  type        = string
  sensitive   = true
}

variable "s3_config" {
  description = "S3 configuration"
  type = object({
    access_key = string
    secret_key = string
    bucket     = string
    region     = string
    endpoint   = string
  })
  sensitive = true
}

variable "auth_secrets" {
  description = "Authentication secrets"
  type = object({
    secret_key         = string
    better_auth_secret = string
  })
  sensitive = true
  default = {
    secret_key         = ""
    better_auth_secret = ""
  }
}

variable "cloudfront_config" {
  description = "CloudFront signed URL configuration"
  type = object({
    key_pair_id = string
    private_key = string
  })
  sensitive = true
  default = {
    key_pair_id = ""
    private_key = ""
  }
}

# Generate auth secrets if not provided
resource "random_password" "secret_key" {
  count   = var.auth_secrets.secret_key == "" ? 1 : 0
  length  = 64
  special = true
}

resource "random_password" "better_auth_secret" {
  count   = var.auth_secrets.better_auth_secret == "" ? 1 : 0
  length  = 64
  special = true
}

locals {
  secret_key         = var.auth_secrets.secret_key != "" ? var.auth_secrets.secret_key : random_password.secret_key[0].result
  better_auth_secret = var.auth_secrets.better_auth_secret != "" ? var.auth_secrets.better_auth_secret : random_password.better_auth_secret[0].result
}

# Database Secret
resource "aws_secretsmanager_secret" "database" {
  name        = "funmagic/${var.environment}/database"
  description = "Database connection URL for FunMagic ${var.environment}"

  tags = {
    Environment = var.environment
    Component   = "database"
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id     = aws_secretsmanager_secret.database.id
  secret_string = var.database_url
}

# Redis Secret
resource "aws_secretsmanager_secret" "redis" {
  name        = "funmagic/${var.environment}/redis"
  description = "Redis connection URL for FunMagic ${var.environment}"

  tags = {
    Environment = var.environment
    Component   = "redis"
  }
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id     = aws_secretsmanager_secret.redis.id
  secret_string = var.redis_url
}

# Auth Secrets
resource "aws_secretsmanager_secret" "auth" {
  name        = "funmagic/${var.environment}/auth"
  description = "Authentication secrets for FunMagic ${var.environment}"

  tags = {
    Environment = var.environment
    Component   = "auth"
  }
}

resource "aws_secretsmanager_secret_version" "auth" {
  secret_id = aws_secretsmanager_secret.auth.id
  secret_string = jsonencode({
    SECRET_KEY         = local.secret_key
    BETTER_AUTH_SECRET = local.better_auth_secret
  })
}

# S3 Secrets
resource "aws_secretsmanager_secret" "s3" {
  name        = "funmagic/${var.environment}/s3"
  description = "S3 configuration for FunMagic ${var.environment}"

  tags = {
    Environment = var.environment
    Component   = "s3"
  }
}

resource "aws_secretsmanager_secret_version" "s3" {
  secret_id = aws_secretsmanager_secret.s3.id
  secret_string = jsonencode({
    S3_ACCESS_KEY = var.s3_config.access_key
    S3_SECRET_KEY = var.s3_config.secret_key
    S3_BUCKET     = var.s3_config.bucket
    S3_REGION     = var.s3_config.region
    S3_ENDPOINT   = var.s3_config.endpoint
  })
}

# CloudFront Secrets (for signed URLs)
resource "aws_secretsmanager_secret" "cloudfront" {
  name        = "funmagic/${var.environment}/cloudfront"
  description = "CloudFront signed URL configuration for FunMagic ${var.environment}"

  tags = {
    Environment = var.environment
    Component   = "cloudfront"
  }
}

resource "aws_secretsmanager_secret_version" "cloudfront" {
  secret_id = aws_secretsmanager_secret.cloudfront.id
  secret_string = jsonencode({
    CLOUDFRONT_KEY_PAIR_ID = var.cloudfront_config.key_pair_id
    CLOUDFRONT_PRIVATE_KEY = var.cloudfront_config.private_key
  })
}

output "database_secret_arn" {
  value = aws_secretsmanager_secret.database.arn
}

output "redis_secret_arn" {
  value = aws_secretsmanager_secret.redis.arn
}

output "auth_secret_arn" {
  value = aws_secretsmanager_secret.auth.arn
}

output "s3_secret_arn" {
  value = aws_secretsmanager_secret.s3.arn
}

output "cloudfront_secret_arn" {
  value = aws_secretsmanager_secret.cloudfront.arn
}

output "all_secret_arns" {
  value = [
    aws_secretsmanager_secret.database.arn,
    aws_secretsmanager_secret.redis.arn,
    aws_secretsmanager_secret.auth.arn,
    aws_secretsmanager_secret.s3.arn,
    aws_secretsmanager_secret.cloudfront.arn,
  ]
}

output "secrets_map" {
  value = {
    database   = aws_secretsmanager_secret.database.arn
    redis      = aws_secretsmanager_secret.redis.arn
    auth       = aws_secretsmanager_secret.auth.arn
    s3         = aws_secretsmanager_secret.s3.arn
    cloudfront = aws_secretsmanager_secret.cloudfront.arn
  }
}
