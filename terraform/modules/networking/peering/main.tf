# VPC Peering Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_vpc_id" {
  description = "Application VPC ID"
  type        = string
}

variable "data_vpc_id" {
  description = "Data VPC ID"
  type        = string
}

variable "app_vpc_cidr" {
  description = "Application VPC CIDR block"
  type        = string
}

variable "data_vpc_cidr" {
  description = "Data VPC CIDR block"
  type        = string
}

variable "app_route_table_ids" {
  description = "Application VPC private route table IDs"
  type        = list(string)
}

variable "data_route_table_ids" {
  description = "Data VPC private route table IDs"
  type        = list(string)
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "app_to_data" {
  vpc_id      = var.app_vpc_id
  peer_vpc_id = var.data_vpc_id
  auto_accept = true

  accepter {
    allow_remote_vpc_dns_resolution = true
  }

  requester {
    allow_remote_vpc_dns_resolution = true
  }

  tags = {
    Name        = "funmagic-app-to-data-${var.environment}"
    Environment = var.environment
  }
}

# Routes from App VPC to Data VPC
resource "aws_route" "app_to_data" {
  count                     = length(var.app_route_table_ids)
  route_table_id            = var.app_route_table_ids[count.index]
  destination_cidr_block    = var.data_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.app_to_data.id
}

# Routes from Data VPC to App VPC
resource "aws_route" "data_to_app" {
  count                     = length(var.data_route_table_ids)
  route_table_id            = var.data_route_table_ids[count.index]
  destination_cidr_block    = var.app_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.app_to_data.id
}

output "peering_connection_id" {
  value = aws_vpc_peering_connection.app_to_data.id
}
