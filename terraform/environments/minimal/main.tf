# =============================================================================
# FunMagic AI - Minimal EC2 Deployment
# =============================================================================
# Single EC2 instance setup for testing and low-traffic production
# Estimated cost: ~$40/month
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # For minimal setup, use local state or configure S3 backend
  # backend "s3" {
  #   bucket         = "funmagic-terraform-state"
  #   key            = "minimal/terraform.tfstate"
  #   region         = "us-east-2"
  #   encrypt        = true
  # }
}

# =============================================================================
# VARIABLES
# =============================================================================

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "minimal"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0"
}

variable "domain_name" {
  description = "Base domain name (e.g., funmagic.ai)"
  type        = string
  default     = "funmagic.ai"
}

variable "ebs_volume_size" {
  description = "Size of EBS volume in GB"
  type        = number
  default     = 50
}

# =============================================================================
# PROVIDER
# =============================================================================

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "funmagic"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# VPC (Default VPC for simplicity)
# =============================================================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# =============================================================================
# SECURITY GROUP
# =============================================================================

resource "aws_security_group" "funmagic" {
  name        = "funmagic-${var.environment}"
  description = "Security group for FunMagic AI EC2 instance"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH access"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "funmagic-${var.environment}-sg"
  }
}

# =============================================================================
# IAM ROLE FOR EC2
# =============================================================================

resource "aws_iam_role" "ec2_role" {
  name = "funmagic-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# S3 access policy
resource "aws_iam_role_policy" "s3_access" {
  name = "s3-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      }
    ]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "funmagic-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# =============================================================================
# EC2 INSTANCE
# =============================================================================

resource "aws_instance" "funmagic" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.ssh_key_name
  vpc_security_group_ids = [aws_security_group.funmagic.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  subnet_id              = tolist(data.aws_subnets.default.ids)[0]

  root_block_device {
    volume_size           = var.ebs_volume_size
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    encrypted             = true
    delete_on_termination = true
  }

  user_data = <<-EOF
    #!/bin/bash
    # Install Docker
    dnf update -y
    dnf install -y docker git
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Install Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/$${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Install certbot
    dnf install -y certbot python3-certbot-nginx

    # Create app directory
    mkdir -p /opt/funmagic
    chown ec2-user:ec2-user /opt/funmagic

    # Signal completion
    echo "Setup complete" > /home/ec2-user/setup-complete.txt
  EOF

  tags = {
    Name = "funmagic-${var.environment}"
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# =============================================================================
# ELASTIC IP
# =============================================================================

resource "aws_eip" "funmagic" {
  instance = aws_instance.funmagic.id
  domain   = "vpc"

  tags = {
    Name = "funmagic-${var.environment}-eip"
  }
}

# =============================================================================
# S3 BUCKET FOR UPLOADS
# =============================================================================

resource "aws_s3_bucket" "uploads" {
  bucket = "funmagic-uploads-${var.environment}"

  tags = {
    Name = "funmagic-uploads-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORS configuration for presigned URLs
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = [
      "https://${var.domain_name}",
      "https://admin.${var.domain_name}"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.funmagic.id
}

output "elastic_ip" {
  description = "Elastic IP address"
  value       = aws_eip.funmagic.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${var.ssh_key_name}.pem ec2-user@${aws_eip.funmagic.public_ip}"
}

output "s3_bucket" {
  description = "S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "dns_configuration" {
  description = "DNS records to configure in Cloudflare"
  value = {
    funmagic_ai       = "A record -> ${aws_eip.funmagic.public_ip}"
    admin_funmagic_ai = "A record -> ${aws_eip.funmagic.public_ip}"
    api_funmagic_ai   = "A record -> ${aws_eip.funmagic.public_ip}"
  }
}

output "next_steps" {
  description = "Next steps after Terraform apply"
  value = <<-EOT
    1. Configure DNS in Cloudflare:
       - funmagic.ai      -> A record -> ${aws_eip.funmagic.public_ip}
       - admin.funmagic.ai -> A record -> ${aws_eip.funmagic.public_ip}
       - api.funmagic.ai   -> A record -> ${aws_eip.funmagic.public_ip}

    2. SSH to the instance:
       ssh -i ${var.ssh_key_name}.pem ec2-user@${aws_eip.funmagic.public_ip}

    3. Clone and configure:
       git clone https://github.com/yourorg/funmagic-ai.git /opt/funmagic
       cd /opt/funmagic
       cp .env.example .env.production
       vim .env.production

    4. Start services:
       docker compose -f deploy/docker-compose.prod.yml up -d --build

    5. Get SSL certificates:
       sudo certbot --nginx -d funmagic.ai -d www.funmagic.ai -d admin.funmagic.ai -d api.funmagic.ai
  EOT
}
