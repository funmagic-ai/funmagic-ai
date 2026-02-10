#!/bin/bash
# =============================================================================
# FunMagic AI - Update Deployment Script
# =============================================================================
# Run this after pushing code changes to rebuild and redeploy
# Usage: ./deploy/update.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration
EC2_IP="${EC2_IP:-16.58.167.229}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/funmagic-key.pem}"
SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP"

echo ""
echo "============================================"
echo "  FunMagic AI - Update Deployment"
echo "============================================"
echo ""

# Step 1: Pull latest code on EC2
log_step "Step 1: Pulling latest code on EC2"
$SSH_CMD "cd /opt/funmagic && git pull"

# Step 2: Rebuild and restart all services
log_step "Step 2: Rebuilding and restarting all services"
$SSH_CMD "cd /opt/funmagic && docker-compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d --build"

# Step 3: Check status
log_step "Step 3: Checking service status"
sleep 10
$SSH_CMD "cd /opt/funmagic && docker-compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production ps"

echo ""
log_info "Update complete!"
echo ""
log_info "Services:"
echo "  🌐 Web:   https://funmagic.ai"
echo "  🔧 Admin: https://admin.funmagic.ai"
echo "  🔌 API:   https://api.funmagic.ai"
echo ""
