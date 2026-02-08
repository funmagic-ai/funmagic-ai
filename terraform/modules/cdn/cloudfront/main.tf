# CloudFront Distribution Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "CDN domain name"
  type        = string
  default     = "cdn.funmagic.ai"
}

variable "s3_bucket_domain" {
  description = "S3 bucket regional domain name"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN"
  type        = string
}

variable "s3_bucket_id" {
  description = "S3 bucket ID"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe only
}

# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "funmagic-s3-oac-${var.environment}"
  description                       = "OAC for FunMagic S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "FunMagic CDN ${var.environment}"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = [var.domain_name]

  origin {
    domain_name              = var.s3_bucket_domain
    origin_id                = "S3-${var.s3_bucket_id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true

    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors.id
  }

  # Cache behavior for images - longer TTL
  ordered_cache_behavior {
    path_pattern     = "*.jpg"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400     # 1 day
    default_ttl            = 604800    # 1 week
    max_ttl                = 31536000  # 1 year
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "*.png"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "*.webp"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  tags = {
    Name        = "funmagic-cdn-${var.environment}"
    Environment = var.environment
  }
}

# Response headers policy for CORS
resource "aws_cloudfront_response_headers_policy" "cors" {
  name    = "funmagic-cors-${var.environment}"
  comment = "CORS policy for FunMagic CDN"

  cors_config {
    access_control_allow_credentials = false

    access_control_allow_headers {
      items = ["*"]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }

    access_control_allow_origins {
      items = ["https://funmagic.ai", "https://*.funmagic.ai"]
    }

    access_control_max_age_sec = 86400
    origin_override            = true
  }

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
  }
}

# S3 bucket policy for CloudFront OAC
resource "aws_s3_bucket_policy" "cloudfront" {
  bucket = var.s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${var.s3_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

output "distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

output "distribution_domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.main.arn
}
