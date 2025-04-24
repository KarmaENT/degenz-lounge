#!/bin/bash

# Script to run tests for DeGeNz Lounge

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

# Check if .env.test file exists
if [ ! -f ".env.test" ]; then
  echo -e "${YELLOW}Warning: .env.test file not found. Creating default test environment...${NC}"
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

# Load test environment variables
source .env.test

section "Starting test databases"
# Start PostgreSQL and Redis for testing
echo "Starting PostgreSQL and Redis containers..."
docker-compose -f docker-compose.test.yml up -d postgres redis

# Wait for databases to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "Creating test database..."
docker-compose -f docker-compose.test.yml exec -T postgres psql -U postgres -c "CREATE DATABASE degenz_test;" || true

section "Running backend tests"
# Run backend tests
echo "Running backend tests..."
cd backend
python -m pytest -v

section "Running frontend tests"
# Run frontend tests
echo "Running frontend tests..."
cd ../frontend
npm test

section "Running end-to-end tests"
# Run end-to-end tests
echo "Running end-to-end tests..."
cd ..
npm run test:e2e

section "Running linting"
# Run linting
echo "Running backend linting..."
cd backend
flake8

echo "Running frontend linting..."
cd ../frontend
npm run lint

section "Tests completed"
# Clean up
echo "Cleaning up test containers..."
docker-compose -f docker-compose.test.yml down

echo -e "\n${GREEN}All tests completed successfully!${NC}"
