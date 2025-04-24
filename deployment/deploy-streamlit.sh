#!/bin/bash

# Script to deploy DeGeNz Lounge to Streamlit

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

section "Deploying DeGeNz Lounge to Streamlit"

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { echo "docker is required but not installed. Aborting."; exit 1; }

# Create .env file for Streamlit if it doesn't exist
section "Setting up environment variables"
if [ ! -f "./deployment/streamlit/.env" ]; then
  echo "Creating .env file for Streamlit..."
  cat > ./deployment/streamlit/.env << EOL
API_URL=http://backend:8000/api
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_HEADLESS=true
STREAMLIT_SERVER_ENABLE_CORS=true
EOL
  echo "Please update the ./deployment/streamlit/.env file with your actual configuration"
fi

# Build Streamlit Docker image
section "Building Streamlit Docker image"
echo "Building Streamlit Docker image..."
docker build -t degenz-lounge-streamlit -f ./deployment/streamlit/Dockerfile ./deployment/streamlit

# Run Streamlit container
section "Running Streamlit container"
echo "Running Streamlit container..."
docker run -d --name degenz-lounge-streamlit \
  -p 8501:8501 \
  --env-file ./deployment/streamlit/.env \
  degenz-lounge-streamlit

# Check if container is running
if docker ps | grep -q degenz-lounge-streamlit; then
  echo -e "${GREEN}Streamlit container is running!${NC}"
else
  echo -e "${RED}Streamlit container failed to start.${NC}"
  echo "Checking container logs:"
  docker logs degenz-lounge-streamlit
  exit 1
fi

section "Deployment complete!"
echo -e "${GREEN}DeGeNz Lounge Streamlit interface has been deployed!${NC}"
echo -e "You can access the Streamlit interface at: http://localhost:8501"
echo -e "\nTo stop the container, run: docker stop degenz-lounge-streamlit"
echo -e "To view logs, run: docker logs degenz-lounge-streamlit"
echo -e "\nNote: This deployment only includes the Streamlit interface."
echo -e "To use it with the full application, make sure the backend API is running and accessible."
