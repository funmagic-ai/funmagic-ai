# RDS PostgreSQL Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for RDS"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for RDS subnet group"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "funmagic"
}

variable "master_username" {
  description = "Master username"
  type        = string
  default     = "funmagic_admin"
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = false
}

# Generate random password
resource "random_password" "master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "funmagic-${var.environment}"
  description = "Subnet group for FunMagic RDS"
  subnet_ids  = var.subnet_ids

  tags = {
    Name        = "funmagic-${var.environment}"
    Environment = var.environment
  }
}

# Parameter Group for PostgreSQL 17
resource "aws_db_parameter_group" "main" {
  name        = "funmagic-pg17-${var.environment}"
  family      = "postgres17"
  description = "Parameter group for FunMagic PostgreSQL 17"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name        = "funmagic-pg17-${var.environment}"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "funmagic-${var.environment}"
  engine         = "postgres"
  engine_version = "17"

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.master_username
  password = random_password.master.result

  multi_az               = var.multi_az
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "funmagic-${var.environment}-final"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "funmagic-${var.environment}"
    Environment = var.environment
  }
}

output "endpoint" {
  value = aws_db_instance.main.endpoint
}

output "address" {
  value = aws_db_instance.main.address
}

output "port" {
  value = aws_db_instance.main.port
}

output "database_name" {
  value = aws_db_instance.main.db_name
}

output "master_username" {
  value     = aws_db_instance.main.username
  sensitive = true
}

output "master_password" {
  value     = random_password.master.result
  sensitive = true
}

output "database_url" {
  value     = "postgresql://${aws_db_instance.main.username}:${random_password.master.result}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive = true
}
