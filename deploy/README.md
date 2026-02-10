# FunMagic AI - Deployment Guide

## Overview

This directory contains all files needed to deploy FunMagic AI on a single EC2 instance with Docker Compose.

**Estimated Cost:** ~$40/month

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE DNS                               │
│  funmagic.ai → EC2 Public IP    admin.funmagic.ai → EC2 Public IP   │
│  api.funmagic.ai → EC2 Public IP                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    SINGLE EC2 INSTANCE (t3.medium)                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Docker Compose                                                   │  │
│  │  ├── nginx (reverse proxy) → ports 80, 443                     │  │
│  │  ├── funmagic-web-vue3    → port 3002                          │  │
│  │  ├── funmagic-admin-vue3  → port 3003                          │  │
│  │  ├── funmagic-backend     → port 8000                          │  │
│  │  ├── worker               → BullMQ processor                   │  │
│  │  ├── admin-worker         → BullMQ processor                   │  │
│  │  ├── postgres             → port 5432                          │  │
│  │  └── redis                → port 6379                          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Storage: EBS (50GB gp3)                                             │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                              AWS S3                                   │
│  • funmagic-uploads (user uploads, presigned URLs)                   │
└───────────────────────────────────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production Docker Compose configuration |
| `nginx/nginx.conf` | Main nginx configuration |
| `nginx/sites/funmagic.conf` | Virtual host configurations |
| `setup.sh` | EC2 initialization script |
| `.env.production.example` | Environment variables template |

## Quick Start

### Option 1: Using Terraform (Recommended)

```bash
cd terraform/environments/minimal
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply
```

### Option 2: Manual EC2 Setup

1. **Launch EC2 Instance**
   - Type: t3.medium (2 vCPU, 4GB RAM)
   - AMI: Amazon Linux 2023
   - Storage: 50GB gp3
   - Security Group: Allow ports 22, 80, 443

2. **Configure DNS in Cloudflare**
   ```
   funmagic.ai       → A record → <EC2-IP>
   admin.funmagic.ai → A record → <EC2-IP>
   api.funmagic.ai   → A record → <EC2-IP>
   ```

3. **SSH to Instance and Setup**
   ```bash
   ssh -i key.pem ec2-user@<ec2-ip>

   # Run setup script
   curl -sSL https://raw.githubusercontent.com/yourorg/funmagic-ai/master/deploy/setup.sh | bash

   # Logout and login for Docker group
   exit
   ssh -i key.pem ec2-user@<ec2-ip>
   ```

4. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/yourorg/funmagic-ai.git /opt/funmagic
   cd /opt/funmagic

   # Configure environment
   cp deploy/.env.production.example .env.production
   vim .env.production  # Fill in your values

   # Build and start
   docker compose -f deploy/docker-compose.prod.yml up -d --build
   ```

5. **Setup SSL Certificates**
   ```bash
   sudo certbot --nginx \
     -d funmagic.ai \
     -d www.funmagic.ai \
     -d admin.funmagic.ai \
     -d api.funmagic.ai

   # Restart nginx to apply certificates
   docker compose -f deploy/docker-compose.prod.yml restart nginx
   ```

6. **Run Database Migrations**
   ```bash
   docker compose -f deploy/docker-compose.prod.yml exec backend bun run db:migrate
   ```

## Common Commands

```bash
# View all containers
docker compose -f deploy/docker-compose.prod.yml ps

# View logs
docker compose -f deploy/docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f deploy/docker-compose.prod.yml logs -f backend

# Restart a service
docker compose -f deploy/docker-compose.prod.yml restart backend

# Rebuild and restart
docker compose -f deploy/docker-compose.prod.yml up -d --build backend

# Stop all services
docker compose -f deploy/docker-compose.prod.yml down

# Stop and remove volumes (DATA LOSS!)
docker compose -f deploy/docker-compose.prod.yml down -v
```

## Updating

```bash
cd /opt/funmagic
git pull origin master
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

## Backups

### Database Backup
```bash
docker compose -f deploy/docker-compose.prod.yml exec postgres \
  pg_dump -U funmagic funmagic > backup-$(date +%Y%m%d).sql
```

### Database Restore
```bash
cat backup.sql | docker compose -f deploy/docker-compose.prod.yml exec -T postgres \
  psql -U funmagic funmagic
```

## SSL Certificate Renewal

Certificates auto-renew via cron. To manually renew:

```bash
sudo certbot renew
docker compose -f deploy/docker-compose.prod.yml exec nginx nginx -s reload
```

## Troubleshooting

### Services not starting
```bash
# Check container logs
docker compose -f deploy/docker-compose.prod.yml logs backend

# Check container status
docker compose -f deploy/docker-compose.prod.yml ps -a
```

### Database connection issues
```bash
# Verify postgres is running
docker compose -f deploy/docker-compose.prod.yml exec postgres pg_isready

# Check environment variables
docker compose -f deploy/docker-compose.prod.yml exec backend env | grep DATABASE
```

### SSL certificate issues
```bash
# Verify certificate files exist
sudo ls -la /etc/letsencrypt/live/funmagic.ai/

# Test nginx configuration
docker compose -f deploy/docker-compose.prod.yml exec nginx nginx -t
```

## Scaling Up

When ready for production scale, migrate to the full setup:
- `terraform/environments/production/` - App Runner + ECS Fargate (~$120/month)
- `terraform/environments/staging/` - Staging environment

Key upgrades:
1. PostgreSQL → RDS (Multi-AZ)
2. Redis → ElastiCache
3. Containers → App Runner (auto-scaling)
4. Workers → ECS Fargate
5. Add CloudFront CDN
