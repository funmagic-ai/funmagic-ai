# AWS Deployment Plan for FunMagic AI

## Overview

Deploy all funmagic-ai services to AWS using Terraform with a dual-VPC architecture, Cloudflare DNS integration, and managed data services.

**Region:** us-east-2 (Ohio)
**Domain:** funmagic.ai (managed by Cloudflare)
**Storage:** AWS S3 + CloudFront CDN

## Services to Deploy

| Service | Type | Port | AWS Resource |
|---------|------|------|--------------|
| funmagic-web | Next.js 16 | 3000 | App Runner |
| funmagic-admin | Next.js 16 | 3001 | App Runner |
| funmagic-backend | Hono.js API | 8000 | App Runner |
| worker | BullMQ | - | ECS Fargate |
| admin-worker | BullMQ | - | ECS Fargate |

## Infrastructure Dependencies

| Component | AWS Service | Configuration |
|-----------|-------------|---------------|
| PostgreSQL | RDS PostgreSQL 17 | db.t4g.medium, Multi-AZ |
| Redis | ElastiCache Redis 7.x | cache.t4g.medium, 1 replica |
| Storage | S3 | 3 buckets + CloudFront CDN |

---

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
│  │  • RDS PostgreSQL (Multi-AZ)                                    │  │
│  │  • ElastiCache Redis (1 replica)                                │  │
│  │  • VPC Endpoints (S3, Secrets Manager, ECR)                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Terraform Structure

```
terraform/
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
├── modules/
│   ├── networking/
│   │   ├── vpc/              # VPC, subnets, NAT gateways
│   │   ├── peering/          # VPC peering connection
│   │   └── security-groups/  # All security groups
│   ├── data/
│   │   ├── rds/              # RDS PostgreSQL
│   │   ├── elasticache/      # ElastiCache Redis
│   │   └── s3/               # S3 buckets + policies
│   ├── compute/
│   │   ├── app-runner/       # App Runner services
│   │   └── ecs/              # ECS cluster + tasks
│   ├── cdn/
│   │   ├── cloudfront/       # CloudFront distributions
│   │   └── acm/              # SSL certificates
│   └── security/
│       ├── iam/              # IAM roles + policies
│       └── secrets/          # Secrets Manager
└── global/
    ├── state/                # S3 + DynamoDB for Terraform state
    └── ecr/                  # ECR repositories
```

---

## Implementation Steps

### Phase 1: Foundation

1. **Create Terraform state backend**
   - S3 bucket: `funmagic-terraform-state`
   - DynamoDB table: `funmagic-terraform-locks`

2. **Create ECR repositories**
   - `funmagic/web`
   - `funmagic/admin`
   - `funmagic/backend`
   - `funmagic/worker`
   - `funmagic/admin-worker`

3. **Create VPCs**
   - Application VPC: 10.0.0.0/16 with public + private subnets
   - Data VPC: 10.1.0.0/16 with private subnets only

4. **Set up VPC peering** between Application and Data VPCs

### Phase 2: Data Layer

5. **Deploy RDS PostgreSQL**
   - Instance: db.t4g.medium
   - Storage: 100GB gp3, auto-scaling
   - Multi-AZ: Yes
   - Extensions: uuid-ossp, pgcrypto

6. **Deploy ElastiCache Redis**
   - Node: cache.t4g.medium
   - Replicas: 1
   - Encryption: in-transit + at-rest

7. **Create S3 buckets**
   - `funmagic-public-{env}` - public read via CloudFront
   - `funmagic-private-{env}` - presigned URLs
   - `funmagic-admin-{env}` - admin presigned URLs

8. **Create VPC endpoints** in Data VPC
   - S3 Gateway endpoint (free)
   - Secrets Manager, ECR, CloudWatch (interface endpoints)

### Phase 3: Security

9. **Create Secrets Manager secrets**
   ```
   funmagic/{env}/database    → DATABASE_URL, credentials
   funmagic/{env}/redis       → REDIS_URL
   funmagic/{env}/auth        → SECRET_KEY, BETTER_AUTH_SECRET
   funmagic/{env}/s3          → S3 credentials
   funmagic/{env}/cloudfront  → Key pair for signed URLs
   ```

10. **Create IAM roles**
    - App Runner execution role (S3, Secrets, ECR, Logs)
    - ECS task role (S3, Secrets, ECR, Logs)
    - GitHub Actions role (OIDC - ECR push, deploy)

### Phase 4: Compute

11. **Deploy App Runner services**
    - funmagic-web (port 3000)
    - funmagic-admin (port 3001)
    - funmagic-backend (port 8000)
    - VPC connector for data layer access

12. **Deploy ECS Fargate cluster**
    - Task definition: worker (1 vCPU, 2GB)
    - Task definition: admin-worker (0.5 vCPU, 1GB)
    - Spot capacity for cost savings

### Phase 5: CDN & DNS

13. **Create ACM certificate** for `*.funmagic.ai`
    - Validate via Cloudflare DNS

14. **Create CloudFront distributions**
    - Public assets: `cdn.funmagic.ai` → S3 public bucket
    - Private assets: signed URLs via CloudFront key pair

15. **Configure Cloudflare DNS**
    ```
    funmagic.ai        → CNAME → App Runner (web)
    admin.funmagic.ai  → CNAME → App Runner (admin)
    api.funmagic.ai    → CNAME → App Runner (backend)
    cdn.funmagic.ai    → CNAME → CloudFront (DNS only)
    ```

### Phase 6: CI/CD

16. **Create GitHub OIDC provider**

17. **Create GitHub Actions workflow**
    - Build Docker images
    - Push to ECR
    - Update App Runner services
    - Update ECS services

---

## App Runner with Bun - Deployment Details

App Runner uses **image-based deployment** (not source-based) to run your Bun-based Dockerfiles directly.

### How It Works

```
GitHub Actions → Build Docker Image → Push to ECR → App Runner pulls & runs
```

### Existing Dockerfiles (Already Compatible)

Your Dockerfiles already use Bun and will work with App Runner:

```dockerfile
# apps/funmagic-web/Dockerfile (excerpt)
FROM oven/bun:1.3.8-alpine AS base
# ... multi-stage build ...
CMD ["bun", "apps/funmagic-web/server.js"]
```

### App Runner Configuration (Terraform)

```hcl
resource "aws_apprunner_service" "web" {
  service_name = "funmagic-web-${var.environment}"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.web.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NEXT_PUBLIC_API_URL = "https://api.funmagic.ai"
          # ... other env vars from Secrets Manager
        }
      }
    }

    auto_deployments_enabled = true  # Auto-deploy on ECR push
  }

  instance_configuration {
    cpu    = "256"   # 0.25 vCPU
    memory = "512"   # 0.5 GB
  }

  # VPC connector for data layer access
  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"  # or "/" for Next.js
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }
}
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions
          aws-region: us-east-2

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push web
        run: |
          docker build -f apps/funmagic-web/Dockerfile \
            --build-arg NEXT_PUBLIC_API_URL=https://api.funmagic.ai \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/web:${{ github.sha }} \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/web:latest .
          docker push ${{ steps.ecr.outputs.registry }}/funmagic/web --all-tags

      - name: Build and push admin
        run: |
          docker build -f apps/funmagic-admin/Dockerfile \
            --build-arg NEXT_PUBLIC_API_URL=https://api.funmagic.ai \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/admin:${{ github.sha }} \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/admin:latest .
          docker push ${{ steps.ecr.outputs.registry }}/funmagic/admin --all-tags

      - name: Build and push backend
        run: |
          docker build -f apps/funmagic-backend/Dockerfile \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/backend:${{ github.sha }} \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/backend:latest .
          docker push ${{ steps.ecr.outputs.registry }}/funmagic/backend --all-tags

      - name: Build and push worker
        run: |
          docker build -f packages/worker/Dockerfile \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/worker:${{ github.sha }} \
            -t ${{ steps.ecr.outputs.registry }}/funmagic/worker:latest .
          docker push ${{ steps.ecr.outputs.registry }}/funmagic/worker --all-tags

      # App Runner auto-deploys when ECR image updates (if auto_deployments_enabled = true)
      # For ECS, trigger new deployment:
      - name: Update ECS workers
        run: |
          aws ecs update-service --cluster funmagic --service worker --force-new-deployment
```

### Key Points

1. **No code changes needed** - Your Dockerfiles already work
2. **Auto-deployment** - App Runner can auto-deploy on ECR push
3. **Health checks** - Already configured at `/health` in backend
4. **VPC access** - VPC connector lets App Runner reach RDS/Redis in Data VPC
5. **Secrets** - Injected as environment variables from Secrets Manager

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `terraform/` (new) | All Terraform modules |
| `.github/workflows/deploy.yml` (new) | CI/CD pipeline |
| `.env.example` | Add AWS-specific variables |

---

## Environment Variables Mapping

### Secrets Manager → Container Environment

| Secret Path | Environment Variable |
|-------------|---------------------|
| `funmagic/{env}/database` | `DATABASE_URL` |
| `funmagic/{env}/redis` | `REDIS_URL` |
| `funmagic/{env}/auth` | `SECRET_KEY`, `BETTER_AUTH_SECRET` |
| `funmagic/{env}/s3` | `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| `funmagic/{env}/cloudfront` | `CLOUDFRONT_KEY_PAIR_ID`, `CLOUDFRONT_PRIVATE_KEY` |

### Static Configuration

| Variable | Production Value |
|----------|-----------------|
| `S3_ENDPOINT` | `https://s3.us-east-2.amazonaws.com` |
| `S3_REGION` | `us-east-2` |
| `NEXT_PUBLIC_API_URL` | `https://api.funmagic.ai` |
| `CDN_BASE_URL` | `https://cdn.funmagic.ai` |
| `BETTER_AUTH_URL` | `https://api.funmagic.ai` |
| `CORS_ORIGINS` | `https://funmagic.ai,https://admin.funmagic.ai` |

---

## Cost Estimate (Monthly) - AWS Region: us-east-2

### Starter (Single Environment) - ~$120/month
Minimal setup for launching and validating the product:

| Component | Configuration | Cost |
|-----------|--------------|------|
| App Runner (web) | 0.25 vCPU, 0.5GB, min=0 | ~$15 |
| App Runner (admin) | 0.25 vCPU, 0.5GB, min=0 | ~$8 |
| App Runner (backend) | 0.25 vCPU, 0.5GB, min=1 | ~$18 |
| ECS Fargate (workers) | 0.25 vCPU, 0.5GB, Spot, 1 task | ~$8 |
| RDS PostgreSQL | db.t4g.micro, 20GB, single-AZ | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| NAT Gateway | 1 (shared subnets) | ~$35 |
| S3 + CloudFront | Light usage | ~$5 |
| Secrets Manager | 5 secrets | ~$2 |
| **Total** | | **~$120/month** |

**Cost savings applied:**
- App Runner min instances = 0 (scales to zero when idle)
- Single NAT Gateway (not HA)
- No VPC interface endpoints (use NAT for AWS services)
- Smallest instance sizes
- Single-AZ database (acceptable for starter)

### Growth (Staging + Production) - ~$350/month
When you need staging environment and higher availability:

| Component | Staging | Production | Total |
|-----------|---------|------------|-------|
| App Runner (3 services) | $25 | $70 | $95 |
| ECS Fargate (workers) | $10 | $25 | $35 |
| RDS PostgreSQL | $15 (micro) | $45 (small) | $60 |
| ElastiCache Redis | $12 | $25 | $37 |
| NAT Gateway | $35 | $35 | $70 |
| S3 + CloudFront | $5 | $15 | $20 |
| Other (Secrets, Logs) | $5 | $10 | $15 |
| **Total** | **~$107** | **~$225** | **~$350/month** |

### Scale (High Availability) - ~$700/month
When you need Multi-AZ and higher capacity:
- RDS Multi-AZ: +$45
- ElastiCache replica: +$25
- 3 NAT Gateways: +$70
- Larger instances: +variable

---

## Verification Plan

1. **Infrastructure**
   - `terraform plan` shows expected resources
   - `terraform apply` completes without errors
   - VPC peering routes traffic correctly

2. **Data Layer**
   - Connect to RDS via bastion/SSM
   - Run Drizzle migrations: `bun run db:migrate`
   - Verify Redis connectivity

3. **Applications**
   - App Runner services show "Running"
   - Health checks pass at `/health`
   - ECS tasks running and processing queue

4. **DNS & SSL**
   - `https://funmagic.ai` loads web app
   - `https://admin.funmagic.ai` loads admin
   - `https://api.funmagic.ai/health` returns OK
   - `https://cdn.funmagic.ai/test.png` serves assets

5. **End-to-End**
   - User can sign up and log in
   - Task creation adds job to Redis queue
   - Worker processes job and uploads to S3
   - Result appears with correct URL
