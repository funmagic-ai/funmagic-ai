# App Runner Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "vpc_id" {
  description = "VPC ID for VPC connector"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for VPC connector"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for VPC connector"
  type        = string
}

variable "ecr_repository_urls" {
  description = "Map of service names to ECR repository URLs"
  type        = map(string)
}

variable "ecr_access_role_arn" {
  description = "IAM role ARN for ECR access"
  type        = string
}

variable "instance_role_arn" {
  description = "IAM role ARN for App Runner instances"
  type        = string
}

variable "secrets_arns" {
  description = "Map of secret names to ARNs"
  type        = map(string)
}

variable "api_url" {
  description = "API URL for frontend services"
  type        = string
  default     = "https://api.funmagic.ai"
}

variable "cdn_base_url" {
  description = "CDN base URL"
  type        = string
  default     = "https://cdn.funmagic.ai"
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = string
  default     = "https://funmagic.ai,https://admin.funmagic.ai"
}

variable "web_instance_config" {
  description = "Instance configuration for web service"
  type = object({
    cpu               = string
    memory            = string
    min_instances     = number
    max_instances     = number
    max_concurrency   = number
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
    cpu               = string
    memory            = string
    min_instances     = number
    max_instances     = number
    max_concurrency   = number
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
    cpu               = string
    memory            = string
    min_instances     = number
    max_instances     = number
    max_concurrency   = number
  })
  default = {
    cpu             = "256"
    memory          = "512"
    min_instances   = 1
    max_instances   = 10
    max_concurrency = 100
  }
}

# VPC Connector for all App Runner services
resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "funmagic-${var.environment}"
  subnets            = var.subnet_ids
  security_groups    = [var.security_group_id]

  tags = {
    Name        = "funmagic-${var.environment}"
    Environment = var.environment
  }
}

# Auto-scaling configuration
resource "aws_apprunner_auto_scaling_configuration_version" "web" {
  auto_scaling_configuration_name = "funmagic-web-${var.environment}"
  min_size                        = var.web_instance_config.min_instances
  max_size                        = var.web_instance_config.max_instances
  max_concurrency                 = var.web_instance_config.max_concurrency

  tags = {
    Name        = "funmagic-web-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_apprunner_auto_scaling_configuration_version" "admin" {
  auto_scaling_configuration_name = "funmagic-admin-${var.environment}"
  min_size                        = var.admin_instance_config.min_instances
  max_size                        = var.admin_instance_config.max_instances
  max_concurrency                 = var.admin_instance_config.max_concurrency

  tags = {
    Name        = "funmagic-admin-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_apprunner_auto_scaling_configuration_version" "backend" {
  auto_scaling_configuration_name = "funmagic-backend-${var.environment}"
  min_size                        = var.backend_instance_config.min_instances
  max_size                        = var.backend_instance_config.max_instances
  max_concurrency                 = var.backend_instance_config.max_concurrency

  tags = {
    Name        = "funmagic-backend-${var.environment}"
    Environment = var.environment
  }
}

# Web Service (Next.js)
resource "aws_apprunner_service" "web" {
  service_name = "funmagic-web-${var.environment}"

  source_configuration {
    authentication_configuration {
      access_role_arn = var.ecr_access_role_arn
    }

    image_repository {
      image_identifier      = "${var.ecr_repository_urls["funmagic/web"]}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV            = var.environment == "production" ? "production" : "development"
          NEXT_PUBLIC_API_URL = var.api_url
          CDN_BASE_URL        = var.cdn_base_url
        }
      }
    }

    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu               = var.web_instance_config.cpu
    memory            = var.web_instance_config.memory
    instance_role_arn = var.instance_role_arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.web.arn

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = {
    Name        = "funmagic-web-${var.environment}"
    Environment = var.environment
    Service     = "web"
  }
}

# Admin Service (Next.js)
resource "aws_apprunner_service" "admin" {
  service_name = "funmagic-admin-${var.environment}"

  source_configuration {
    authentication_configuration {
      access_role_arn = var.ecr_access_role_arn
    }

    image_repository {
      image_identifier      = "${var.ecr_repository_urls["funmagic/admin"]}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "3001"
        runtime_environment_variables = {
          NODE_ENV            = var.environment == "production" ? "production" : "development"
          NEXT_PUBLIC_API_URL = var.api_url
          CDN_BASE_URL        = var.cdn_base_url
        }
      }
    }

    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu               = var.admin_instance_config.cpu
    memory            = var.admin_instance_config.memory
    instance_role_arn = var.instance_role_arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.admin.arn

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = {
    Name        = "funmagic-admin-${var.environment}"
    Environment = var.environment
    Service     = "admin"
  }
}

# Backend Service (Hono.js)
resource "aws_apprunner_service" "backend" {
  service_name = "funmagic-backend-${var.environment}"

  source_configuration {
    authentication_configuration {
      access_role_arn = var.ecr_access_role_arn
    }

    image_repository {
      image_identifier      = "${var.ecr_repository_urls["funmagic/backend"]}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "8000"
        runtime_environment_variables = {
          NODE_ENV     = var.environment == "production" ? "production" : "development"
          CORS_ORIGINS = var.cors_origins
          CDN_BASE_URL = var.cdn_base_url
        }
        runtime_environment_secrets = {
          DATABASE_URL       = var.secrets_arns["database"]
          REDIS_URL          = var.secrets_arns["redis"]
          SECRET_KEY         = var.secrets_arns["auth"]
          BETTER_AUTH_SECRET = var.secrets_arns["auth"]
        }
      }
    }

    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu               = var.backend_instance_config.cpu
    memory            = var.backend_instance_config.memory
    instance_role_arn = var.instance_role_arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.backend.arn

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = {
    Name        = "funmagic-backend-${var.environment}"
    Environment = var.environment
    Service     = "backend"
  }
}

output "vpc_connector_arn" {
  value = aws_apprunner_vpc_connector.main.arn
}

output "web_service_url" {
  value = aws_apprunner_service.web.service_url
}

output "web_service_arn" {
  value = aws_apprunner_service.web.arn
}

output "admin_service_url" {
  value = aws_apprunner_service.admin.service_url
}

output "admin_service_arn" {
  value = aws_apprunner_service.admin.arn
}

output "backend_service_url" {
  value = aws_apprunner_service.backend.service_url
}

output "backend_service_arn" {
  value = aws_apprunner_service.backend.arn
}
