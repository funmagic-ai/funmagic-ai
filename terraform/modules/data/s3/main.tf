# S3 Buckets Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

locals {
  buckets = {
    public  = "funmagic-public-${var.environment}"
    private = "funmagic-private-${var.environment}"
    admin   = "funmagic-admin-${var.environment}"
  }
}

# Public Assets Bucket
resource "aws_s3_bucket" "public" {
  bucket = local.buckets.public

  tags = {
    Name        = local.buckets.public
    Environment = var.environment
    Access      = "public"
  }
}

resource "aws_s3_bucket_versioning" "public" {
  bucket = aws_s3_bucket.public.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "public" {
  bucket = aws_s3_bucket.public.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS configuration for public bucket
resource "aws_s3_bucket_cors_configuration" "public" {
  bucket = aws_s3_bucket.public.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://funmagic.ai", "https://*.funmagic.ai"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Public bucket policy for CloudFront OAC
resource "aws_s3_bucket_public_access_block" "public" {
  bucket = aws_s3_bucket.public.id

  block_public_acls       = true
  block_public_policy     = false # Allow CloudFront policy
  ignore_public_acls      = true
  restrict_public_buckets = false # Allow CloudFront policy
}

# Private Bucket (presigned URLs)
resource "aws_s3_bucket" "private" {
  bucket = local.buckets.private

  tags = {
    Name        = local.buckets.private
    Environment = var.environment
    Access      = "private"
  }
}

resource "aws_s3_bucket_versioning" "private" {
  bucket = aws_s3_bucket.private.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "private" {
  bucket = aws_s3_bucket.private.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "private" {
  bucket = aws_s3_bucket.private.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "private" {
  bucket = aws_s3_bucket.private.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["https://funmagic.ai", "https://*.funmagic.ai"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Lifecycle rules for private bucket
resource "aws_s3_bucket_lifecycle_configuration" "private" {
  bucket = aws_s3_bucket.private.id

  rule {
    id     = "expire-temp-uploads"
    status = "Enabled"

    filter {
      prefix = "temp/"
    }

    expiration {
      days = 1
    }
  }

  rule {
    id     = "transition-old-files"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

# Admin Bucket (presigned URLs for admin)
resource "aws_s3_bucket" "admin" {
  bucket = local.buckets.admin

  tags = {
    Name        = local.buckets.admin
    Environment = var.environment
    Access      = "admin"
  }
}

resource "aws_s3_bucket_versioning" "admin" {
  bucket = aws_s3_bucket.admin.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "admin" {
  bucket = aws_s3_bucket.admin.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "admin" {
  bucket = aws_s3_bucket.admin.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "admin" {
  bucket = aws_s3_bucket.admin.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["https://admin.funmagic.ai"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

output "public_bucket_name" {
  value = aws_s3_bucket.public.id
}

output "public_bucket_arn" {
  value = aws_s3_bucket.public.arn
}

output "public_bucket_domain" {
  value = aws_s3_bucket.public.bucket_regional_domain_name
}

output "private_bucket_name" {
  value = aws_s3_bucket.private.id
}

output "private_bucket_arn" {
  value = aws_s3_bucket.private.arn
}

output "admin_bucket_name" {
  value = aws_s3_bucket.admin.id
}

output "admin_bucket_arn" {
  value = aws_s3_bucket.admin.arn
}

output "all_bucket_arns" {
  value = [
    aws_s3_bucket.public.arn,
    aws_s3_bucket.private.arn,
    aws_s3_bucket.admin.arn,
  ]
}
