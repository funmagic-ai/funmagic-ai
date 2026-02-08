# FunMagic AI - Terraform Infrastructure

AWS infrastructure for FunMagic AI using Terraform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE DNS                               │
│  funmagic.ai → App Runner    api.funmagic.ai → App Runner           │
│  admin.funmagic.ai → App Runner    cdn.funmagic.ai → CloudFront     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴───────────────────────────────────┐
│                    APPLICATION VPC (10.0.0.0/16)                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Private Subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24      │  │
│  │  • App Runner VPC Connector (web, admin, backend)               │  │
│  │  • ECS Fargate (worker, admin-worker)                           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │ VPC Peering                            │
└──────────────────────────────┼────────────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       DATA VPC (10.1.0.0/16)                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Private Subnets: 10.1.1.0/24, 10.1.2.0/24, 10.1.3.0/24         │  │
│  │  • RDS PostgreSQL (Multi-AZ optional)                           │  │
│  │  • ElastiCache Redis                                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** v1.0+
3. **Cloudflare Account** with API token
4. **AWS CLI** configured with credentials

## Directory Structure

```
terraform/
├── environments/
│   ├── staging/          # Staging environment
│   └── production/       # Production environment
├── modules/
│   ├── networking/       # VPC, peering, security groups
│   ├── data/             # RDS, ElastiCache, S3
│   ├── compute/          # App Runner, ECS
│   ├── cdn/              # CloudFront, ACM
│   └── security/         # IAM, Secrets Manager
└── global/
    ├── state/            # Terraform state backend
    └── ecr/              # ECR repositories
```

## Quick Start

### 1. Bootstrap State Backend

First, create the S3 bucket and DynamoDB table for Terraform state:

```bash
cd terraform/global/state

# Initialize with local state first
terraform init

# Apply to create state backend
terraform apply

# After apply, migrate to S3 backend
# Add backend config to main.tf, then:
terraform init -migrate-state
```

### 2. Create ECR Repositories

```bash
cd terraform/global/ecr
terraform init
terraform apply
```

Note the repository URLs from the output.

### 3. Deploy Environment

```bash
cd terraform/environments/staging  # or production

# Copy and edit terraform.tfvars
cp terraform.tfvars terraform.tfvars.local
# Edit terraform.tfvars.local with your values

# Set Cloudflare API token
export TF_VAR_cloudflare_api_token="your-token"

# Initialize
terraform init

# Plan
terraform plan

# Apply
terraform apply
```

## Configuration

### Required Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `cloudflare_api_token` | Cloudflare API token | Cloudflare Dashboard → API Tokens |
| `cloudflare_zone_id` | Zone ID for funmagic.ai | Cloudflare Dashboard → Zone Overview |
| `ecr_repository_urls` | ECR repository URLs | Output from `global/ecr` |

### Environment Variables

Set these in your shell or CI/CD:

```bash
export TF_VAR_cloudflare_api_token="your-cloudflare-api-token"
export AWS_ACCESS_KEY_ID="your-aws-access-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
export AWS_REGION="us-east-2"
```

## Cost Tiers

### Starter (~$120/month)
- Single environment
- Minimal instances
- Single NAT Gateway
- No Multi-AZ

### Growth (~$350/month)
- Staging + Production
- Larger instance sizes
- Still single NAT Gateway

### Scale (~$700/month)
- Multi-AZ RDS
- Redis replicas
- Multiple NAT Gateways
- Larger capacity

## GitHub Actions Integration

The infrastructure includes IAM roles for GitHub Actions OIDC:

1. **Configure GitHub Secrets:**
   - `AWS_ROLE_ARN`: From terraform output `github_actions_role_arn`
   - `AWS_TERRAFORM_ROLE_ARN`: Role for terraform operations
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API token

2. **Workflows:**
   - `.github/workflows/deploy.yml`: Build and deploy on push
   - `.github/workflows/terraform.yml`: Infrastructure changes

## Secrets Management

Secrets are stored in AWS Secrets Manager:

| Secret Path | Contents |
|-------------|----------|
| `funmagic/{env}/database` | DATABASE_URL |
| `funmagic/{env}/redis` | REDIS_URL |
| `funmagic/{env}/auth` | SECRET_KEY, BETTER_AUTH_SECRET |
| `funmagic/{env}/s3` | S3 credentials |
| `funmagic/{env}/cloudfront` | CloudFront key pair |

## Database Migrations

After deployment, run migrations:

```bash
# Get database URL from Secrets Manager
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id "funmagic/production/database" \
  --query 'SecretString' \
  --output text)

# Run migrations
cd packages/database
bun run db:migrate
```

## Troubleshooting

### App Runner not starting
- Check CloudWatch Logs: `/aws/apprunner/funmagic-{service}-{env}`
- Verify ECR image exists and is accessible
- Check VPC connector security groups

### ECS tasks failing
- Check CloudWatch Logs: `/ecs/funmagic-{service}-{env}`
- Verify secrets are accessible
- Check task IAM role permissions

### Database connection issues
- Verify VPC peering is active
- Check security group rules allow traffic on port 5432
- Ensure RDS is in the correct subnets

### Redis connection issues
- Check security group allows traffic on port 6379
- For TLS, ensure using `rediss://` protocol
- Verify auth token is correct

## Cleanup

To destroy an environment:

```bash
cd terraform/environments/staging

# Review what will be destroyed
terraform plan -destroy

# Destroy (requires confirmation)
terraform destroy
```

**Warning:** Production has deletion protection enabled on RDS. You must disable it first:

```bash
terraform apply -var="rds_deletion_protection=false"
terraform destroy
```
