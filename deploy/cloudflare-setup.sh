#!/bin/bash
# =============================================================================
# FunMagic AI - Cloudflare Setup Script
# =============================================================================
# This script configures Cloudflare DNS and Origin Certificates
# Usage: ./cloudflare-setup.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration (set these or pass as environment variables)
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
EC2_IP="${EC2_IP:-}"
DOMAIN="funmagic.ai"

# Validate inputs
validate_inputs() {
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        log_error "CLOUDFLARE_API_TOKEN is required"
        echo "Get your API token from: https://dash.cloudflare.com/profile/api-tokens"
        echo "Required permissions: Zone:DNS:Edit, Zone:SSL and Certificates:Edit"
        exit 1
    fi

    if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
        log_error "CLOUDFLARE_ZONE_ID is required"
        echo "Find your Zone ID in Cloudflare Dashboard → Overview (right sidebar)"
        exit 1
    fi

    if [ -z "$EC2_IP" ]; then
        log_error "EC2_IP is required"
        echo "Pass your EC2 Elastic IP address"
        exit 1
    fi

    log_info "Configuration validated"
    log_info "  Domain: $DOMAIN"
    log_info "  Zone ID: $CLOUDFLARE_ZONE_ID"
    log_info "  EC2 IP: $EC2_IP"
}

# Create DNS A record
create_dns_record() {
    local name=$1
    local proxied=$2

    log_step "Creating DNS record: $name.$DOMAIN → $EC2_IP (proxied: $proxied)"

    # Check if record exists
    existing=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?type=A&name=$name.$DOMAIN" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")

    record_id=$(echo "$existing" | jq -r '.result[0].id // empty')

    if [ -n "$record_id" ]; then
        # Update existing record
        curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$record_id" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"A\",\"name\":\"$name\",\"content\":\"$EC2_IP\",\"ttl\":1,\"proxied\":$proxied}" | jq -r '.success'
        log_info "  Updated existing record"
    else
        # Create new record
        curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"A\",\"name\":\"$name\",\"content\":\"$EC2_IP\",\"ttl\":1,\"proxied\":$proxied}" | jq -r '.success'
        log_info "  Created new record"
    fi
}

# Create root domain record (@)
create_root_dns_record() {
    local proxied=$1

    log_step "Creating DNS record: $DOMAIN → $EC2_IP (proxied: $proxied)"

    existing=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?type=A&name=$DOMAIN" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")

    record_id=$(echo "$existing" | jq -r '.result[0].id // empty')

    if [ -n "$record_id" ]; then
        curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$record_id" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$EC2_IP\",\"ttl\":1,\"proxied\":$proxied}" | jq -r '.success'
        log_info "  Updated existing record"
    else
        curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$EC2_IP\",\"ttl\":1,\"proxied\":$proxied}" | jq -r '.success'
        log_info "  Created new record"
    fi
}

# Create all DNS records
setup_dns() {
    log_info "Setting up DNS records..."

    create_root_dns_record true      # funmagic.ai (proxied)
    create_dns_record "www" true     # www.funmagic.ai (proxied)
    create_dns_record "admin" true   # admin.funmagic.ai (proxied)
    create_dns_record "api" true     # api.funmagic.ai (proxied)

    log_info "DNS records configured"
}

# Set SSL mode to Full (strict)
set_ssl_mode() {
    log_step "Setting SSL mode to Full (strict)..."

    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"strict"}' | jq -r '.success'

    log_info "SSL mode set to Full (strict)"
}

# Generate Origin Certificate
generate_origin_certificate() {
    log_step "Generating Cloudflare Origin Certificate..."

    # Create certificate request
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/origin_tls_client_auth/hostnames/certificates" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"hostnames\": [\"$DOMAIN\", \"*.$DOMAIN\"],
            \"requested_validity\": 5475,
            \"request_type\": \"origin-rsa\",
            \"csr\": \"\"
        }" 2>/dev/null) || true

    # If the above doesn't work, use the certificates endpoint
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/certificates" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"hostnames\": [\"$DOMAIN\", \"*.$DOMAIN\"],
            \"requested_validity\": 5475,
            \"request_type\": \"origin-rsa\"
        }")

    success=$(echo "$response" | jq -r '.success')

    if [ "$success" == "true" ]; then
        # Extract certificate and key
        cert=$(echo "$response" | jq -r '.result.certificate')
        key=$(echo "$response" | jq -r '.result.private_key')

        # Save to files
        sudo mkdir -p /etc/ssl/cloudflare
        echo "$cert" | sudo tee /etc/ssl/cloudflare/funmagic.ai.pem > /dev/null
        echo "$key" | sudo tee /etc/ssl/cloudflare/funmagic.ai.key > /dev/null
        sudo chmod 600 /etc/ssl/cloudflare/funmagic.ai.key
        sudo chmod 644 /etc/ssl/cloudflare/funmagic.ai.pem

        log_info "Origin certificate saved to /etc/ssl/cloudflare/"
    else
        log_warn "Could not auto-generate certificate via API"
        log_info ""
        log_info "Please manually create Origin Certificate in Cloudflare Dashboard:"
        log_info "1. Go to: SSL/TLS → Origin Server → Create Certificate"
        log_info "2. Hostnames: $DOMAIN, *.$DOMAIN"
        log_info "3. Validity: 15 years"
        log_info "4. Save certificate to: /etc/ssl/cloudflare/funmagic.ai.pem"
        log_info "5. Save private key to: /etc/ssl/cloudflare/funmagic.ai.key"
        log_info ""
        log_info "Then run: sudo chmod 600 /etc/ssl/cloudflare/funmagic.ai.key"
    fi
}

# Enable Always Use HTTPS
enable_always_https() {
    log_step "Enabling Always Use HTTPS..."

    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/always_use_https" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}' | jq -r '.success'

    log_info "Always Use HTTPS enabled"
}

# Enable automatic HTTPS rewrites
enable_https_rewrites() {
    log_step "Enabling Automatic HTTPS Rewrites..."

    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/automatic_https_rewrites" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}' | jq -r '.success'

    log_info "Automatic HTTPS Rewrites enabled"
}

# Main
main() {
    echo ""
    echo "============================================"
    echo "  FunMagic AI - Cloudflare Setup"
    echo "============================================"
    echo ""

    validate_inputs
    setup_dns
    set_ssl_mode
    enable_always_https
    enable_https_rewrites
    generate_origin_certificate

    echo ""
    echo "============================================"
    log_info "Cloudflare setup complete!"
    echo "============================================"
    echo ""
    log_info "DNS Records created (all proxied through Cloudflare):"
    log_info "  • funmagic.ai → $EC2_IP"
    log_info "  • www.funmagic.ai → $EC2_IP"
    log_info "  • admin.funmagic.ai → $EC2_IP"
    log_info "  • api.funmagic.ai → $EC2_IP"
    echo ""
    log_info "SSL Settings:"
    log_info "  • Mode: Full (strict)"
    log_info "  • Always Use HTTPS: On"
    log_info "  • Automatic HTTPS Rewrites: On"
    echo ""
    log_info "Next steps:"
    log_info "  1. Verify Origin Certificate is in /etc/ssl/cloudflare/"
    log_info "  2. Start Docker services:"
    log_info "     docker compose -f deploy/docker-compose.prod.yml up -d"
    echo ""
}

# Show help
show_help() {
    echo "Usage: CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ZONE_ID=xxx EC2_IP=x.x.x.x ./cloudflare-setup.sh"
    echo ""
    echo "Required environment variables:"
    echo "  CLOUDFLARE_API_TOKEN  - API token with Zone:DNS:Edit and Zone:SSL:Edit permissions"
    echo "  CLOUDFLARE_ZONE_ID    - Zone ID from Cloudflare Dashboard"
    echo "  EC2_IP                - Elastic IP of your EC2 instance"
    echo ""
    echo "Get API Token: https://dash.cloudflare.com/profile/api-tokens"
    echo "Find Zone ID: Cloudflare Dashboard → Your Domain → Overview (right sidebar)"
}

case "${1:-}" in
    -h|--help)
        show_help
        ;;
    *)
        main
        ;;
esac
