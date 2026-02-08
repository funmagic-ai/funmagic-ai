# Production Environment Configuration
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

# Networking - single NAT for cost savings (set to false for HA)
single_nat_gateway = true

# Starter tier - growth tier resources
rds_instance_class        = "db.t4g.small"
rds_allocated_storage     = 50
rds_max_allocated_storage = 200
rds_multi_az              = false # Set to true for high availability

redis_node_type       = "cache.t4g.micro"
redis_num_cache_nodes = 1 # Set to 2 for high availability

cloudfront_price_class = "PriceClass_100" # US, Canada, Europe

# App Runner configurations
web_instance_config = {
  cpu             = "256"
  memory          = "512"
  min_instances   = 0   # Scale to zero when idle
  max_instances   = 5
  max_concurrency = 100
}

admin_instance_config = {
  cpu             = "256"
  memory          = "512"
  min_instances   = 0
  max_instances   = 3
  max_concurrency = 100
}

backend_instance_config = {
  cpu             = "256"
  memory          = "512"
  min_instances   = 1   # Always keep 1 instance running
  max_instances   = 10
  max_concurrency = 100
}

# ECS Worker configurations
worker_config = {
  cpu           = 256
  memory        = 512
  desired_count = 1
  use_spot      = true # Use Spot for cost savings
}

admin_worker_config = {
  cpu           = 256
  memory        = 512
  desired_count = 1
  use_spot      = true
}
