# ECS Fargate Module for Workers

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
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "ecr_repository_urls" {
  description = "Map of service names to ECR repository URLs"
  type        = map(string)
}

variable "task_execution_role_arn" {
  description = "IAM role ARN for ECS task execution"
  type        = string
}

variable "task_role_arn" {
  description = "IAM role ARN for ECS tasks"
  type        = string
}

variable "secrets_arns" {
  description = "Map of secret names to ARNs"
  type        = map(string)
}

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

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "funmagic-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "funmagic-${var.environment}"
    Environment = var.environment
  }
}

# Capacity providers for Fargate and Fargate Spot
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
    base              = 0
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/funmagic-worker-${var.environment}"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Service     = "worker"
  }
}

resource "aws_cloudwatch_log_group" "admin_worker" {
  name              = "/ecs/funmagic-admin-worker-${var.environment}"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Service     = "admin-worker"
  }
}

# Task Definition for Worker
resource "aws_ecs_task_definition" "worker" {
  family                   = "funmagic-worker-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.worker_config.cpu
  memory                   = var.worker_config.memory
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = "${var.ecr_repository_urls["funmagic/worker"]}:latest"
      essential = true

      environment = [
        { name = "NODE_ENV", value = var.environment == "production" ? "production" : "development" }
      ]

      secrets = [
        { name = "DATABASE_URL", valueFrom = var.secrets_arns["database"] },
        { name = "REDIS_URL", valueFrom = var.secrets_arns["redis"] },
        { name = "S3_ACCESS_KEY", valueFrom = "${var.secrets_arns["s3"]}:S3_ACCESS_KEY::" },
        { name = "S3_SECRET_KEY", valueFrom = "${var.secrets_arns["s3"]}:S3_SECRET_KEY::" },
        { name = "S3_BUCKET", valueFrom = "${var.secrets_arns["s3"]}:S3_BUCKET::" },
        { name = "S3_REGION", valueFrom = "${var.secrets_arns["s3"]}:S3_REGION::" },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.worker.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "exit 0"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "funmagic-worker-${var.environment}"
    Environment = var.environment
    Service     = "worker"
  }
}

# Task Definition for Admin Worker
resource "aws_ecs_task_definition" "admin_worker" {
  family                   = "funmagic-admin-worker-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.admin_worker_config.cpu
  memory                   = var.admin_worker_config.memory
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "admin-worker"
      image     = "${var.ecr_repository_urls["funmagic/admin-worker"]}:latest"
      essential = true

      environment = [
        { name = "NODE_ENV", value = var.environment == "production" ? "production" : "development" }
      ]

      secrets = [
        { name = "DATABASE_URL", valueFrom = var.secrets_arns["database"] },
        { name = "REDIS_URL", valueFrom = var.secrets_arns["redis"] },
        { name = "S3_ACCESS_KEY", valueFrom = "${var.secrets_arns["s3"]}:S3_ACCESS_KEY::" },
        { name = "S3_SECRET_KEY", valueFrom = "${var.secrets_arns["s3"]}:S3_SECRET_KEY::" },
        { name = "S3_BUCKET", valueFrom = "${var.secrets_arns["s3"]}:S3_BUCKET::" },
        { name = "S3_REGION", valueFrom = "${var.secrets_arns["s3"]}:S3_REGION::" },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.admin_worker.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "exit 0"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "funmagic-admin-worker-${var.environment}"
    Environment = var.environment
    Service     = "admin-worker"
  }
}

# ECS Service for Worker
resource "aws_ecs_service" "worker" {
  name            = "funmagic-worker-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = var.worker_config.desired_count
  launch_type     = var.worker_config.use_spot ? null : "FARGATE"

  dynamic "capacity_provider_strategy" {
    for_each = var.worker_config.use_spot ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 1
    }
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Name        = "funmagic-worker-${var.environment}"
    Environment = var.environment
    Service     = "worker"
  }
}

# ECS Service for Admin Worker
resource "aws_ecs_service" "admin_worker" {
  name            = "funmagic-admin-worker-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.admin_worker.arn
  desired_count   = var.admin_worker_config.desired_count
  launch_type     = var.admin_worker_config.use_spot ? null : "FARGATE"

  dynamic "capacity_provider_strategy" {
    for_each = var.admin_worker_config.use_spot ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 1
    }
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Name        = "funmagic-admin-worker-${var.environment}"
    Environment = var.environment
    Service     = "admin-worker"
  }
}

output "cluster_id" {
  value = aws_ecs_cluster.main.id
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "worker_service_name" {
  value = aws_ecs_service.worker.name
}

output "admin_worker_service_name" {
  value = aws_ecs_service.admin_worker.name
}
