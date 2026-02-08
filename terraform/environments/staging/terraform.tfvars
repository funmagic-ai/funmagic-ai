# Staging Environment Configuration
# Copy this file and fill in the values

region             = "us-east-2"
availability_zones = ["us-east-2a", "us-east-2b", "us-east-2c"]

# Cloudflare (set via environment variable TF_VAR_cloudflare_api_token)
# cloudflare_api_token = ""
cloudflare_zone_id = "" # Get from Cloudflare dashboard

# GitHub
github_org  = "funmagic"
github_repo = "funmagic-ai"

# ECR Repository URLs (update after running global/ecr)
ecr_repository_urls = {
  "funmagic/web"          = ""
  "funmagic/admin"        = ""
  "funmagic/backend"      = ""
  "funmagic/worker"       = ""
  "funmagic/admin-worker" = ""
}

# Starter tier - minimal resources
rds_instance_class        = "db.t4g.micro"
rds_allocated_storage     = 20
rds_max_allocated_storage = 50
redis_node_type           = "cache.t3.micro"
