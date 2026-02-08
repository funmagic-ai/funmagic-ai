# ACM Certificate Module

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "funmagic.ai"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for DNS validation"
  type        = string
}

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Certificate for *.funmagic.ai (us-east-1 for CloudFront)
resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "funmagic-${var.environment}"
    Environment = var.environment
  }
}

# Cloudflare DNS records for validation
resource "cloudflare_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  content = each.value.record
  type    = each.value.type
  ttl     = 60
  proxied = false

  lifecycle {
    create_before_destroy = true
  }
}

# Wait for certificate validation
resource "aws_acm_certificate_validation" "main" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in cloudflare_record.acm_validation : record.hostname]
}

output "certificate_arn" {
  value = aws_acm_certificate.main.arn
}

output "certificate_validated_arn" {
  value = aws_acm_certificate_validation.main.certificate_arn
}
