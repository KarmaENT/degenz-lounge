#!/bin/bash

# Setup script for GitHub Codespaces

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print section header
section() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

section "Setting up GitHub Codespace for DeGeNz Lounge"

# Install frontend dependencies
section "Installing frontend dependencies"
cd /workspaces/degenz-lounge/frontend
npm install

# Install backend dependencies
section "Installing backend dependencies"
cd /workspaces/degenz-lounge/backend
pip install -r requirements.txt

# Create .env file if it doesn't exist
section "Setting up environment variables"
cd /workspaces/degenz-lounge
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example"
  cp .env.example .env
  echo "Please update the .env file with your actual credentials"
fi

# Create .env.test file if it doesn't exist
if [ ! -f ".env.test" ]; then
  echo "Creating .env.test file"
  cat > .env.test << EOL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/degenz_test
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=test_jwt_secret
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_KEY=test_service_key
STRIPE_PUBLIC_KEY=pk_test_example
STRIPE_SECRET_KEY=sk_test_example
STRIPE_WEBHOOK_SECRET=whsec_example
GEMINI_API_KEY=test_gemini_key
TESTING=true
EOL
fi

# Make scripts executable
section "Making scripts executable"
chmod +x ./scripts/run-tests.sh
chmod +x ./deployment/deploy-gcp.sh
chmod +x ./deployment/deploy-termux.sh
chmod +x ./deployment/deploy-codespaces.sh
chmod +x ./deployment/deploy-streamlit.sh

section "Setup complete!"
echo -e "${GREEN}DeGeNz Lounge development environment is ready!${NC}"
echo -e "To start the application:"
echo -e "  1. Start the backend: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo -e "  2. Start the frontend: cd frontend && npm run dev"
echo -e "  3. Access the application at: http://localhost:3000"
echo -e "\nHappy coding!"
