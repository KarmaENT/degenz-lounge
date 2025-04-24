#!/bin/bash

# Script to deploy DeGeNz Lounge to Termux

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
section() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { echo "docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "docker-compose is required but not installed. Aborting."; exit 1; }

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}Error: .env file not found. Please create it from .env.example${NC}"
  exit 1
fi

# Load environment variables
source .env

section "Building Docker images"
# Build Docker images
echo "Building Docker images..."
docker-compose build

section "Starting services"
# Start services
echo "Starting services..."
docker-compose up -d

section "Checking service status"
# Check if services are running
echo "Checking if services are running..."
docker-compose ps

section "Deployment complete"
# Get the local IP address
LOCAL_IP=$(ip addr show | grep -E "inet .* scope global" | awk '{print $2}' | cut -d/ -f1 | head -n1)

if [ -n "$LOCAL_IP" ]; then
  echo -e "${GREEN}DeGeNz Lounge has been successfully deployed!${NC}"
  echo -e "Frontend URL: ${GREEN}http://$LOCAL_IP:3000${NC}"
  echo -e "API URL: ${GREEN}http://$LOCAL_IP:8000${NC}"
else
  echo -e "${YELLOW}Deployment completed, but could not determine local IP address.${NC}"
  echo -e "You can access the application at:"
  echo -e "  Frontend: http://localhost:3000"
  echo -e "  API: http://localhost:8000"
fi

echo -e "\n${GREEN}Thank you for using DeGeNz Lounge deployment script!${NC}"
echo -e "To stop the services, run: docker-compose down"
