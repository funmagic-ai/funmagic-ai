# ECR Repositories for FunMagic AI

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "funmagic-terraform-state"
    key            = "global/ecr/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "funmagic-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-2"

  default_tags {
    tags = {
      Project   = "funmagic"
      ManagedBy = "terraform"
    }
  }
}

locals {
  repositories = [
    "funmagic/web",
    "funmagic/admin",
    "funmagic/backend",
    "funmagic/worker",
    "funmagic/admin-worker",
  ]
}

resource "aws_ecr_repository" "repos" {
  for_each = toset(local.repositories)

  name                 = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

# Lifecycle policy to keep only last 10 images
resource "aws_ecr_lifecycle_policy" "repos" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

output "repository_urls" {
  value = {
    for name, repo in aws_ecr_repository.repos : name => repo.repository_url
  }
  description = "Map of repository names to URLs"
}
