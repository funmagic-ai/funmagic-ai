#!/bin/bash
# =============================================================================
# FunMagic AI - EC2 Setup Script
# =============================================================================
# This script sets up a fresh EC2 instance for running FunMagic AI
# Using Cloudflare for DNS and Origin Certificates (no certbot needed)
# Supports: Amazon Linux 2023, Ubuntu 22.04/24.04
# Usage: curl -sSL https://raw.githubusercontent.com/yourorg/funmagic-ai/master/deploy/setup.sh | bash
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        log_error "Cannot detect OS"
        exit 1
    fi
    log_info "Detected OS: $OS $VERSION"
}

# Install Docker on Amazon Linux 2023
install_docker_amazon_linux() {
    log_info "Installing Docker on Amazon Linux..."

    sudo dnf update -y
    sudo dnf install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER

    # Install Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    log_info "Docker installed successfully"
}

# Install Docker on Ubuntu
install_docker_ubuntu() {
    log_info "Installing Docker on Ubuntu..."

    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg

    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository to Apt sources
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    sudo usermod -aG docker $USER

    log_info "Docker installed successfully"
}

# Install additional tools
install_tools() {
    log_info "Installing additional tools..."

    if [ "$OS" == "amzn" ]; then
        sudo dnf install -y git htop vim jq
    elif [ "$OS" == "ubuntu" ]; then
        sudo apt-get install -y git htop vim jq
    fi

    log_info "Tools installed successfully"
}

# Setup firewall
setup_firewall() {
    log_info "Configuring firewall..."

    if [ "$OS" == "ubuntu" ]; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable
    fi

    log_info "Firewall configured"
}

# Create deployment directories
create_directories() {
    log_info "Creating directories..."

    sudo mkdir -p /etc/ssl/cloudflare
    sudo mkdir -p /opt/funmagic
    sudo chown $USER:$USER /opt/funmagic

    log_info "Directories created"
}

# Main installation
main() {
    log_info "Starting FunMagic AI EC2 setup..."

    detect_os

    if [ "$OS" == "amzn" ]; then
        install_docker_amazon_linux
    elif [ "$OS" == "ubuntu" ]; then
        install_docker_ubuntu
    else
        log_error "Unsupported OS: $OS"
        exit 1
    fi

    install_tools
    setup_firewall
    create_directories

    log_info ""
    log_info "============================================"
    log_info "Setup complete!"
    log_info "============================================"
    log_info ""
    log_info "Next steps:"
    log_info "1. Log out and log back in (for Docker group)"
    log_info ""
    log_info "2. Clone the repository:"
    log_info "   git clone https://github.com/yourorg/funmagic-ai.git /opt/funmagic"
    log_info ""
    log_info "3. Create .env.production:"
    log_info "   cd /opt/funmagic"
    log_info "   cp deploy/.env.production.example .env.production"
    log_info "   vim .env.production"
    log_info ""
    log_info "4. Setup Cloudflare (DNS + Origin Certificate):"
    log_info "   export CLOUDFLARE_API_TOKEN='your-token'"
    log_info "   export CLOUDFLARE_ZONE_ID='your-zone-id'"
    log_info "   export EC2_IP='$(curl -s ifconfig.me)'"
    log_info "   ./deploy/cloudflare-setup.sh"
    log_info ""
    log_info "5. Build and start services:"
    log_info "   docker compose -f deploy/docker-compose.prod.yml up -d --build"
    log_info ""
    log_info "6. Run database migrations:"
    log_info "   docker compose -f deploy/docker-compose.prod.yml exec backend bun run db:migrate"
    log_info ""
}

main
