#!/bin/bash

# Script to deploy DeGeNz Lounge to GitHub Codespaces

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

section "Deploying DeGeNz Lounge to GitHub Codespaces"

# Check if running in GitHub Codespaces
if [ -z "${CODESPACES}" ]; then
  echo -e "${RED}Error: This script should be run in GitHub Codespaces environment.${NC}"
  echo "Please open this repository in GitHub Codespaces and try again."
  exit 1
fi

# Copy devcontainer configuration if not already in place
section "Setting up devcontainer configuration"
if [ ! -d "/.devcontainer" ]; then
  echo "Creating .devcontainer directory..."
  mkdir -p ./.devcontainer
  
  echo "Copying devcontainer configuration files..."
  cp ./deployment/codespaces/devcontainer.json ./.devcontainer/
  cp ./deployment/codespaces/setup-codespace.sh ./.devcontainer/
  chmod +x ./.devcontainer/setup-codespace.sh
fi

# Create .env file if it doesn't exist
section "Setting up environment variables"
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please update the .env file with your actual credentials"
fi

# Install dependencies
section "Installing dependencies"
echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Installing backend dependencies..."
cd ../backend
pip install -r requirements.txt

# Start the application
section "Starting the application"
echo "Starting the backend server..."
cd ../backend
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

echo "Starting the frontend server..."
cd ../frontend
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 5

# Check if servers are running
if ps -p $BACKEND_PID > /dev/null; then
  echo -e "${GREEN}Backend server is running (PID: $BACKEND_PID)${NC}"
else
  echo -e "${RED}Backend server failed to start. Check backend.log for details.${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${GREEN}Frontend server is running (PID: $FRONTEND_PID)${NC}"
else
  echo -e "${RED}Frontend server failed to start. Check frontend.log for details.${NC}"
fi

section "Deployment complete!"
echo -e "${GREEN}DeGeNz Lounge has been deployed to GitHub Codespaces!${NC}"
echo -e "You can access the application at:"
echo -e "  Frontend: https://$CODESPACE_NAME-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
echo -e "  Backend API: https://$CODESPACE_NAME-8000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
echo -e "\nTo stop the servers, run: kill $BACKEND_PID $FRONTEND_PID"
echo -e "To view logs:"
echo -e "  Backend: cat backend.log"
echo -e "  Frontend: cat frontend.log"
