# Security Groups Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_vpc_id" {
  description = "Application VPC ID"
  type        = string
}

variable "data_vpc_id" {
  description = "Data VPC ID"
  type        = string
}

variable "app_vpc_cidr" {
  description = "Application VPC CIDR"
  type        = string
}

variable "data_vpc_cidr" {
  description = "Data VPC CIDR"
  type        = string
}

# App Runner VPC Connector Security Group
resource "aws_security_group" "apprunner" {
  name        = "funmagic-apprunner-${var.environment}"
  description = "Security group for App Runner VPC connector"
  vpc_id      = var.app_vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "funmagic-apprunner-${var.environment}"
    Environment = var.environment
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs" {
  name        = "funmagic-ecs-${var.environment}"
  description = "Security group for ECS tasks"
  vpc_id      = var.app_vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "funmagic-ecs-${var.environment}"
    Environment = var.environment
  }
}

# RDS Security Group (in Data VPC)
resource "aws_security_group" "rds" {
  name        = "funmagic-rds-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.data_vpc_id

  # Allow PostgreSQL from App VPC
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.app_vpc_cidr]
    description = "PostgreSQL from App VPC"
  }

  # Allow from within Data VPC
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.data_vpc_cidr]
    description = "PostgreSQL from Data VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "funmagic-rds-${var.environment}"
    Environment = var.environment
  }
}

# ElastiCache Security Group (in Data VPC)
resource "aws_security_group" "redis" {
  name        = "funmagic-redis-${var.environment}"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.data_vpc_id

  # Allow Redis from App VPC
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.app_vpc_cidr]
    description = "Redis from App VPC"
  }

  # Allow from within Data VPC
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.data_vpc_cidr]
    description = "Redis from Data VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "funmagic-redis-${var.environment}"
    Environment = var.environment
  }
}

# VPC Endpoints Security Group (in Data VPC)
resource "aws_security_group" "vpc_endpoints" {
  name        = "funmagic-vpc-endpoints-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = var.data_vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.app_vpc_cidr, var.data_vpc_cidr]
    description = "HTTPS from VPCs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "funmagic-vpc-endpoints-${var.environment}"
    Environment = var.environment
  }
}

output "apprunner_security_group_id" {
  value = aws_security_group.apprunner.id
}

output "ecs_security_group_id" {
  value = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  value = aws_security_group.rds.id
}

output "redis_security_group_id" {
  value = aws_security_group.redis.id
}

output "vpc_endpoints_security_group_id" {
  value = aws_security_group.vpc_endpoints.id
}
