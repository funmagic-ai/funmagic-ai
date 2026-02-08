# VPC Module

variable "name" {
  description = "Name prefix for resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

variable "create_public_subnets" {
  description = "Whether to create public subnets"
  type        = bool
  default     = false
}

variable "create_nat_gateway" {
  description = "Whether to create NAT gateway"
  type        = bool
  default     = false
}

variable "single_nat_gateway" {
  description = "Use single NAT gateway for cost savings"
  type        = bool
  default     = true
}

locals {
  # Calculate subnet CIDRs
  # For 10.0.0.0/16: public = 10.0.1-3.0/24, private = 10.0.11-13.0/24
  # For 10.1.0.0/16: private = 10.1.1-3.0/24
  base_cidr_prefix = split(".", var.cidr_block)[0]
  second_octet     = split(".", var.cidr_block)[1]

  public_subnets = var.create_public_subnets ? [
    for i, az in var.availability_zones : cidrsubnet(var.cidr_block, 8, i + 1)
  ] : []

  private_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.cidr_block, 8, i + 11)
  ]
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway (only for VPCs with public subnets)
resource "aws_internet_gateway" "main" {
  count  = var.create_public_subnets ? 1 : 0
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.name}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(local.public_subnets)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.name}-public-${var.availability_zones[count.index]}"
    Environment = var.environment
    Type        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(local.private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.name}-private-${var.availability_zones[count.index]}"
    Environment = var.environment
    Type        = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.create_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  domain = "vpc"

  tags = {
    Name        = "${var.name}-nat-eip-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.create_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.name}-nat-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  count  = var.create_public_subnets ? 1 : 0
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name        = "${var.name}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = length(local.public_subnets)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = var.create_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 1
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.name}-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

# Private routes through NAT Gateway
resource "aws_route" "private_nat" {
  count                  = var.create_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[var.single_nat_gateway ? 0 : count.index].id
}

resource "aws_route_table_association" "private" {
  count          = length(local.private_subnets)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : count.index].id
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "private_route_table_ids" {
  value = aws_route_table.private[*].id
}

output "nat_gateway_ids" {
  value = aws_nat_gateway.main[*].id
}
