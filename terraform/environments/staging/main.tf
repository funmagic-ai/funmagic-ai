# FunMagic AI - Staging Environment

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket         = "funmagic-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "funmagic-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "funmagic"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

# Provider for ACM certificates (must be us-east-1 for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "funmagic"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "aws_caller_identity" "current" {}

# ============================================================================
# NETWORKING
# ============================================================================

# Application VPC
module "app_vpc" {
  source = "../../modules/networking/vpc"

  name                  = "funmagic-app-staging"
  environment           = "staging"
  cidr_block            = "10.0.0.0/16"
  availability_zones    = var.availability_zones
  create_public_subnets = true
  create_nat_gateway    = true
  single_nat_gateway    = true
}

# Data VPC
module "data_vpc" {
  source = "../../modules/networking/vpc"

  name                  = "funmagic-data-staging"
  environment           = "staging"
  cidr_block            = "10.1.0.0/16"
  availability_zones    = var.availability_zones
  create_public_subnets = false
  create_nat_gateway    = false
}

# VPC Peering
module "vpc_peering" {
  source = "../../modules/networking/peering"

  environment          = "staging"
  app_vpc_id           = module.app_vpc.vpc_id
  data_vpc_id          = module.data_vpc.vpc_id
  app_vpc_cidr         = module.app_vpc.vpc_cidr
  data_vpc_cidr        = module.data_vpc.vpc_cidr
  app_route_table_ids  = module.app_vpc.private_route_table_ids
  data_route_table_ids = module.data_vpc.private_route_table_ids
}

# Security Groups
module "security_groups" {
  source = "../../modules/networking/security-groups"

  environment  = "staging"
  app_vpc_id   = module.app_vpc.vpc_id
  data_vpc_id  = module.data_vpc.vpc_id
  app_vpc_cidr = module.app_vpc.vpc_cidr
  data_vpc_cidr = module.data_vpc.vpc_cidr
}

# ============================================================================
# DATA LAYER
# ============================================================================

# RDS PostgreSQL
module "rds" {
  source = "../../modules/data/rds"

  environment           = "staging"
  vpc_id                = module.data_vpc.vpc_id
  subnet_ids            = module.data_vpc.private_subnet_ids
  security_group_id     = module.security_groups.rds_security_group_id
  instance_class        = var.rds_instance_class
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  multi_az              = false
  deletion_protection   = false
  skip_final_snapshot   = true
}

# ElastiCache Redis
module "elasticache" {
  source = "../../modules/data/elasticache"

  environment       = "staging"
  vpc_id            = module.data_vpc.vpc_id
  subnet_ids        = module.data_vpc.private_subnet_ids
  security_group_id = module.security_groups.redis_security_group_id
  node_type         = var.redis_node_type
  num_cache_nodes   = 1
}

# S3 Buckets
module "s3" {
  source = "../../modules/data/s3"

  environment = "staging"
  region      = var.region
}

# ============================================================================
# SECURITY
# ============================================================================

# Secrets Manager
module "secrets" {
  source = "../../modules/security/secrets"

  environment  = "staging"
  database_url = module.rds.database_url
  redis_url    = module.elasticache.redis_url

  s3_config = {
    access_key = "" # Will be set manually or via IAM role
    secret_key = ""
    bucket     = module.s3.private_bucket_name
    region     = var.region
    endpoint   = "https://s3.${var.region}.amazonaws.com"
  }
}

# IAM Roles
module "iam" {
  source = "../../modules/security/iam"

  environment         = "staging"
  region              = var.region
  account_id          = data.aws_caller_identity.current.account_id
  ecr_repository_arns = [for url in var.ecr_repository_urls : "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/${split("/", url)[1]}/${split("/", url)[2]}"]
  s3_bucket_arns      = module.s3.all_bucket_arns
  secrets_arns        = module.secrets.all_secret_arns
  github_org          = var.github_org
  github_repo         = var.github_repo
}

# ============================================================================
# COMPUTE
# ============================================================================

# App Runner Services
module "app_runner" {
  source = "../../modules/compute/app-runner"

  environment         = "staging"
  region              = var.region
  vpc_id              = module.app_vpc.vpc_id
  subnet_ids          = module.app_vpc.private_subnet_ids
  security_group_id   = module.security_groups.apprunner_security_group_id
  ecr_repository_urls = var.ecr_repository_urls
  ecr_access_role_arn = module.iam.apprunner_ecr_access_role_arn
  instance_role_arn   = module.iam.apprunner_instance_role_arn
  secrets_arns        = module.secrets.secrets_map
  api_url             = "https://api-staging.funmagic.ai"
  cdn_base_url        = "https://cdn-staging.funmagic.ai"
  cors_origins        = "https://staging.funmagic.ai,https://admin-staging.funmagic.ai"

  web_instance_config = {
    cpu             = "256"
    memory          = "512"
    min_instances   = 0
    max_instances   = 3
    max_concurrency = 100
  }

  admin_instance_config = {
    cpu             = "256"
    memory          = "512"
    min_instances   = 0
    max_instances   = 2
    max_concurrency = 100
  }

  backend_instance_config = {
    cpu             = "256"
    memory          = "512"
    min_instances   = 1
    max_instances   = 5
    max_concurrency = 100
  }
}

# ECS Workers
module "ecs" {
  source = "../../modules/compute/ecs"

  environment             = "staging"
  region                  = var.region
  vpc_id                  = module.app_vpc.vpc_id
  subnet_ids              = module.app_vpc.private_subnet_ids
  security_group_id       = module.security_groups.ecs_security_group_id
  ecr_repository_urls     = var.ecr_repository_urls
  task_execution_role_arn = module.iam.ecs_execution_role_arn
  task_role_arn           = module.iam.ecs_task_role_arn
  secrets_arns            = module.secrets.secrets_map

  worker_config = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    use_spot      = true
  }

  admin_worker_config = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    use_spot      = true
  }
}

# ============================================================================
# CDN
# ============================================================================

# ACM Certificate
module "acm" {
  source = "../../modules/cdn/acm"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  environment        = "staging"
  domain_name        = "funmagic.ai"
  cloudflare_zone_id = var.cloudflare_zone_id
}

# CloudFront Distribution
module "cloudfront" {
  source = "../../modules/cdn/cloudfront"

  environment         = "staging"
  domain_name         = "cdn-staging.funmagic.ai"
  s3_bucket_domain    = module.s3.public_bucket_domain
  s3_bucket_arn       = module.s3.public_bucket_arn
  s3_bucket_id        = module.s3.public_bucket_name
  acm_certificate_arn = module.acm.certificate_validated_arn
}

# ============================================================================
# CLOUDFLARE DNS
# ============================================================================

# Web App
resource "cloudflare_record" "web_staging" {
  zone_id = var.cloudflare_zone_id
  name    = "staging"
  content = module.app_runner.web_service_url
  type    = "CNAME"
  proxied = false
  ttl     = 300
}

# Admin App
resource "cloudflare_record" "admin_staging" {
  zone_id = var.cloudflare_zone_id
  name    = "admin-staging"
  content = module.app_runner.admin_service_url
  type    = "CNAME"
  proxied = false
  ttl     = 300
}

# API
resource "cloudflare_record" "api_staging" {
  zone_id = var.cloudflare_zone_id
  name    = "api-staging"
  content = module.app_runner.backend_service_url
  type    = "CNAME"
  proxied = false
  ttl     = 300
}

# CDN
resource "cloudflare_record" "cdn_staging" {
  zone_id = var.cloudflare_zone_id
  name    = "cdn-staging"
  content = module.cloudfront.distribution_domain_name
  type    = "CNAME"
  proxied = false # DNS only for CloudFront
  ttl     = 300
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "web_url" {
  value = "https://staging.funmagic.ai"
}

output "admin_url" {
  value = "https://admin-staging.funmagic.ai"
}

output "api_url" {
  value = "https://api-staging.funmagic.ai"
}

output "cdn_url" {
  value = "https://cdn-staging.funmagic.ai"
}

output "app_runner_web_url" {
  value = module.app_runner.web_service_url
}

output "app_runner_admin_url" {
  value = module.app_runner.admin_service_url
}

output "app_runner_backend_url" {
  value = module.app_runner.backend_service_url
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "redis_endpoint" {
  value = module.elasticache.primary_endpoint
}

output "github_actions_role_arn" {
  value = module.iam.github_actions_role_arn
}
