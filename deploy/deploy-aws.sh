#!/bin/bash
# =============================================================================
# FunMagic AI - Automated AWS Deployment Script
# =============================================================================
# This script automates the entire deployment process:
# 1. Collects credentials (AWS, Cloudflare)
# 2. Creates AWS infrastructure via Terraform
# 3. Configures Cloudflare DNS + SSL
# 4. Generates production environment file
# 5. Deploys application to EC2
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_input() { echo -e "${CYAN}[INPUT]${NC} $1"; }

# Project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Generated values
EC2_IP=""
SSH_KEY_PATH="$HOME/.ssh/funmagic-key.pem"

# =============================================================================
# STEP 1: Collect Credentials
# =============================================================================
collect_credentials() {
    log_step "Step 1: Collecting credentials"
    echo ""

    # AWS Credentials
    log_input "Enter AWS Access Key ID:"
    read -r AWS_ACCESS_KEY_ID

    log_input "Enter AWS Secret Access Key:"
    read -rs AWS_SECRET_ACCESS_KEY
    echo ""

    log_input "Enter AWS Region [us-east-2]:"
    read -r AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-2}

    # Cloudflare Credentials
    log_input "Enter Cloudflare API Token:"
    read -rs CLOUDFLARE_API_TOKEN
    echo ""

    log_input "Enter Cloudflare Zone ID:"
    read -r CLOUDFLARE_ZONE_ID

    # Domain
    log_input "Enter your domain [funmagic.ai]:"
    read -r DOMAIN
    DOMAIN=${DOMAIN:-funmagic.ai}

    # GitHub repo URL
    log_input "Enter GitHub repo URL (SSH format, e.g., git@github.com:org/repo.git):"
    read -r GITHUB_REPO_URL

    log_info "Credentials collected"
}

# =============================================================================
# STEP 2: Configure AWS CLI
# =============================================================================
configure_aws() {
    log_step "Step 2: Configuring AWS CLI"

    aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
    aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
    aws configure set region "$AWS_REGION"
    aws configure set output json

    # Verify
    if aws sts get-caller-identity > /dev/null 2>&1; then
        log_info "AWS CLI configured successfully"
    else
        log_error "AWS CLI configuration failed"
        exit 1
    fi
}

# =============================================================================
# STEP 3: Create SSH Key Pair
# =============================================================================
create_ssh_key() {
    log_step "Step 3: Creating SSH key pair"

    # Delete existing key if exists
    aws ec2 delete-key-pair --key-name funmagic-key 2>/dev/null || true
    rm -f "$SSH_KEY_PATH"

    # Create new key
    aws ec2 create-key-pair \
        --key-name funmagic-key \
        --key-type rsa \
        --query 'KeyMaterial' \
        --output text > "$SSH_KEY_PATH"

    chmod 400 "$SSH_KEY_PATH"

    if [ -s "$SSH_KEY_PATH" ]; then
        log_info "SSH key created at $SSH_KEY_PATH"
    else
        log_error "SSH key creation failed"
        exit 1
    fi
}

# =============================================================================
# STEP 4: Create Default VPC (if needed)
# =============================================================================
ensure_default_vpc() {
    log_step "Step 4: Ensuring default VPC exists"

    if ! aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text | grep -q "vpc-"; then
        log_info "Creating default VPC..."
        aws ec2 create-default-vpc --region "$AWS_REGION" || true
    fi

    log_info "Default VPC ready"
}

# =============================================================================
# STEP 5: Run Terraform
# =============================================================================
run_terraform() {
    log_step "Step 5: Creating AWS infrastructure with Terraform"

    cd "$PROJECT_ROOT/terraform/environments/minimal"

    # Initialize
    terraform init

    # Apply
    terraform apply \
        -var="ssh_key_name=funmagic-key" \
        -var="region=$AWS_REGION" \
        -var="domain_name=$DOMAIN" \
        -auto-approve

    # Get outputs
    EC2_IP=$(terraform output -raw elastic_ip)
    S3_BUCKET=$(terraform output -raw s3_bucket)

    log_info "Infrastructure created"
    log_info "EC2 IP: $EC2_IP"
    log_info "S3 Bucket: $S3_BUCKET"

    cd "$PROJECT_ROOT"
}

# =============================================================================
# STEP 6: Create S3 Buckets with CORS
# =============================================================================
create_s3_buckets() {
    log_step "Step 6: Creating S3 buckets with CORS"

    CORS_CONFIG='{
        "CORSRules": [{
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": ["https://'"$DOMAIN"'", "https://admin.'"$DOMAIN"'"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3600
        }]
    }'

    for bucket in "funmagic-public-prod" "funmagic-private-prod" "funmagic-admin-prod"; do
        aws s3 mb "s3://$bucket" --region "$AWS_REGION" 2>/dev/null || true
        aws s3api put-bucket-cors --bucket "$bucket" --cors-configuration "$CORS_CONFIG"
        log_info "Bucket $bucket configured"
    done
}

# =============================================================================
# STEP 7: Configure Cloudflare
# =============================================================================
configure_cloudflare() {
    log_step "Step 7: Configuring Cloudflare DNS"

    # Create/update DNS records
    for record in "@" "www" "admin" "api"; do
        name="$record"
        [ "$record" = "@" ] && name="$DOMAIN" || name="$record.$DOMAIN"

        # Check if record exists
        existing=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?type=A&name=$name" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" | jq -r '.result[0].id // empty')

        if [ -n "$existing" ]; then
            # Update
            curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$existing" \
                -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
                -H "Content-Type: application/json" \
                --data "{\"type\":\"A\",\"name\":\"$record\",\"content\":\"$EC2_IP\",\"ttl\":1,\"proxied\":true}" > /dev/null
        else
            # Create
            curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
                -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
                -H "Content-Type: application/json" \
                --data "{\"type\":\"A\",\"name\":\"$record\",\"content\":\"$EC2_IP\",\"ttl\":1,\"proxied\":true}" > /dev/null
        fi
        log_info "DNS record $name -> $EC2_IP"
    done

    # Set SSL mode to Full (strict)
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"strict"}' > /dev/null

    # Enable Always HTTPS
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/always_use_https" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}' > /dev/null

    log_info "Cloudflare configured"
}

# =============================================================================
# STEP 8: Generate .env.production
# =============================================================================
generate_env_file() {
    log_step "Step 8: Generating .env.production"

    POSTGRES_PASSWORD=$(openssl rand -hex 24)
    SECRET_KEY=$(openssl rand -base64 32)
    BETTER_AUTH_SECRET=$(openssl rand -base64 32)

    cat > "$PROJECT_ROOT/deploy/.env.production" << EOF
# =============================================================================
# FunMagic AI - Production Environment Variables
# Generated: $(date)
# =============================================================================

# Database
POSTGRES_USER=funmagic
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=funmagic

# AWS
AWS_REGION=$AWS_REGION
S3_ACCESS_KEY=$AWS_ACCESS_KEY_ID
S3_SECRET_KEY=$AWS_SECRET_ACCESS_KEY
S3_BUCKET_PUBLIC=funmagic-public-prod
S3_BUCKET_PRIVATE=funmagic-private-prod
S3_BUCKET_ADMIN=funmagic-admin-prod

# Security
SECRET_KEY=$SECRET_KEY
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

# URLs
VITE_API_URL=https://api.$DOMAIN
VITE_APP_URL=https://$DOMAIN
VITE_ADMIN_URL=https://admin.$DOMAIN
BETTER_AUTH_URL=https://api.$DOMAIN
CORS_ORIGINS=https://$DOMAIN,https://admin.$DOMAIN
TRUSTED_ORIGINS=https://$DOMAIN,https://admin.$DOMAIN

# Contact
NEXT_PUBLIC_SUPPORT_EMAIL=support@$DOMAIN
EOF

    log_info ".env.production generated"
}

# =============================================================================
# STEP 9: Wait for EC2 to be ready
# =============================================================================
wait_for_ec2() {
    log_step "Step 9: Waiting for EC2 to be ready"

    log_info "Waiting for SSH to be available..."
    for i in {1..30}; do
        if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@"$EC2_IP" "echo ready" 2>/dev/null; then
            log_info "EC2 is ready"
            return 0
        fi
        echo -n "."
        sleep 10
    done

    log_error "EC2 not ready after 5 minutes"
    exit 1
}

# =============================================================================
# STEP 10: Setup EC2 and Deploy
# =============================================================================
deploy_to_ec2() {
    log_step "Step 10: Deploying to EC2"

    SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP"
    SCP_CMD="scp -i $SSH_KEY_PATH -o StrictHostKeyChecking=no"

    # Wait for user-data to complete
    log_info "Waiting for EC2 setup to complete..."
    for i in {1..30}; do
        if $SSH_CMD "test -f /home/ec2-user/setup-complete.txt" 2>/dev/null; then
            break
        fi
        echo -n "."
        sleep 10
    done
    echo ""

    # Install docker-compose
    log_info "Installing docker-compose..."
    $SSH_CMD "sudo curl -sL https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m) -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"

    # Install docker buildx
    log_info "Installing docker buildx..."
    $SSH_CMD "sudo mkdir -p /usr/local/lib/docker/cli-plugins && sudo curl -sL https://github.com/docker/buildx/releases/download/v0.19.3/buildx-v0.19.3.linux-amd64 -o /usr/local/lib/docker/cli-plugins/docker-buildx && sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx"

    # Create SSL directory
    $SSH_CMD "sudo mkdir -p /etc/ssl/cloudflare"

    # Clone repo
    log_info "Cloning repository..."
    $SSH_CMD "sudo rm -rf /opt/funmagic && sudo mkdir -p /opt/funmagic && sudo chown ec2-user:ec2-user /opt/funmagic && git clone $GITHUB_REPO_URL /opt/funmagic"

    # Copy .env.production
    log_info "Copying environment file..."
    $SCP_CMD "$PROJECT_ROOT/deploy/.env.production" "ec2-user@$EC2_IP:/opt/funmagic/deploy/.env.production"

    # Copy deploy folder (in case not in repo)
    log_info "Copying deploy folder..."
    $SCP_CMD -r "$PROJECT_ROOT/deploy" "ec2-user@$EC2_IP:/opt/funmagic/"

    log_info "Deployment files copied"
}

# =============================================================================
# STEP 11: Create Cloudflare Origin Certificate
# =============================================================================
create_origin_cert() {
    log_step "Step 11: Creating Cloudflare Origin Certificate"

    echo ""
    log_warn "Manual step required: Create Origin Certificate in Cloudflare"
    echo ""
    echo "1. Go to: https://dash.cloudflare.com"
    echo "2. Select: $DOMAIN → SSL/TLS → Origin Server"
    echo "3. Click: Create Certificate"
    echo "4. Hostnames: $DOMAIN, *.$DOMAIN"
    echo "5. Validity: 15 years"
    echo "6. Click: Create"
    echo ""
    log_input "Paste the CERTIFICATE (PEM format), then press Enter twice:"

    CERT=""
    while IFS= read -r line; do
        [ -z "$line" ] && break
        CERT="$CERT$line\n"
    done

    log_input "Paste the PRIVATE KEY (PEM format), then press Enter twice:"

    KEY=""
    while IFS= read -r line; do
        [ -z "$line" ] && break
        KEY="$KEY$line\n"
    done

    SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP"

    echo -e "$CERT" | $SSH_CMD "sudo tee /etc/ssl/cloudflare/$DOMAIN.pem > /dev/null"
    echo -e "$KEY" | $SSH_CMD "sudo tee /etc/ssl/cloudflare/$DOMAIN.key > /dev/null"
    $SSH_CMD "sudo chmod 644 /etc/ssl/cloudflare/$DOMAIN.pem && sudo chmod 600 /etc/ssl/cloudflare/$DOMAIN.key"

    log_info "Origin certificate installed"
}

# =============================================================================
# STEP 12: Build and Start Docker
# =============================================================================
start_docker() {
    log_step "Step 12: Building and starting Docker containers"

    SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP"

    $SSH_CMD "cd /opt/funmagic && sudo usermod -aG docker ec2-user && newgrp docker && docker-compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d --build"

    log_info "Docker containers started"
}

# =============================================================================
# STEP 13: Run Database Migrations
# =============================================================================
run_migrations() {
    log_step "Step 13: Running database migrations"

    SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP"

    # Wait for postgres
    log_info "Waiting for PostgreSQL..."
    sleep 30

    # Get password
    PGPASS=$($SSH_CMD "grep POSTGRES_PASSWORD /opt/funmagic/deploy/.env.production | cut -d= -f2")

    # Run drizzle push
    $SSH_CMD "docker run --rm --network funmagic-prod_funmagic-network -v /opt/funmagic/packages/database:/app/packages/database -w /app/packages/database oven/bun:1.3.8-alpine sh -c \"bun install && bunx drizzle-kit push --schema=./src/schema/index.ts --dialect=postgresql --url='postgres://funmagic:$PGPASS@postgres:5432/funmagic' --force\""

    log_info "Database migrations complete"
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    echo ""
    echo "============================================"
    echo "  FunMagic AI - Automated AWS Deployment"
    echo "============================================"
    echo ""

    collect_credentials
    configure_aws
    create_ssh_key
    ensure_default_vpc
    run_terraform
    create_s3_buckets
    configure_cloudflare
    generate_env_file
    wait_for_ec2
    deploy_to_ec2
    create_origin_cert
    start_docker
    run_migrations

    echo ""
    echo "============================================"
    log_info "Deployment Complete!"
    echo "============================================"
    echo ""
    log_info "Your FunMagic AI is live:"
    echo "  🌐 Web:   https://$DOMAIN"
    echo "  🔧 Admin: https://admin.$DOMAIN"
    echo "  🔌 API:   https://api.$DOMAIN"
    echo ""
    log_info "EC2 IP: $EC2_IP"
    log_info "SSH:    ssh -i $SSH_KEY_PATH ec2-user@$EC2_IP"
    echo ""
}

main "$@"
