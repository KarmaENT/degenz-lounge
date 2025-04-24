#!/bin/bash

# Script to deploy DeGeNz Lounge to GCP with Kubernetes

# Exit on error
set -e

# Check if required tools are installed
command -v gcloud >/dev/null 2>&1 || { echo "gcloud is required but not installed. Aborting."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker is required but not installed. Aborting."; exit 1; }

# Configuration
PROJECT_ID=${PROJECT_ID:-"degenz-lounge"}
CLUSTER_NAME=${CLUSTER_NAME:-"degenz-lounge-cluster"}
REGION=${REGION:-"us-central1"}
ZONE=${ZONE:-"us-central1-a"}
CLUSTER_VERSION=${CLUSTER_VERSION:-"1.25"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
section() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Check if secrets file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}Error: .env file not found. Please create it from .env.example${NC}"
  exit 1
fi

# Load environment variables
source .env

section "Setting up GCP project"
# Set GCP project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required GCP APIs..."
gcloud services enable container.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com

section "Creating GKE cluster"
# Create GKE cluster if it doesn't exist
if ! gcloud container clusters describe $CLUSTER_NAME --region $REGION &>/dev/null; then
  echo "Creating Kubernetes cluster $CLUSTER_NAME in $REGION..."
  gcloud container clusters create $CLUSTER_NAME \
    --region $REGION \
    --cluster-version $CLUSTER_VERSION \
    --machine-type "e2-standard-2" \
    --num-nodes 1 \
    --enable-autoscaling \
    --min-nodes 1 \
    --max-nodes 3 \
    --enable-autorepair \
    --enable-autoupgrade
else
  echo "Cluster $CLUSTER_NAME already exists."
fi

# Get cluster credentials
echo "Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION

section "Building and pushing Docker images"
# Build and push frontend image
echo "Building frontend image..."
docker build -t gcr.io/$PROJECT_ID/frontend:latest ./frontend
echo "Pushing frontend image to GCR..."
docker push gcr.io/$PROJECT_ID/frontend:latest

# Build and push backend image
echo "Building backend image..."
docker build -t gcr.io/$PROJECT_ID/backend:latest ./backend
echo "Pushing backend image to GCR..."
docker push gcr.io/$PROJECT_ID/backend:latest

section "Creating Kubernetes secrets"
# Create secrets from template
echo "Creating Kubernetes secrets..."
envsubst < ./deployment/kubernetes/secrets-template.yaml > ./deployment/kubernetes/secrets.yaml
kubectl apply -f ./deployment/kubernetes/secrets.yaml
rm ./deployment/kubernetes/secrets.yaml  # Remove secrets file for security

section "Deploying database services"
# Deploy PostgreSQL and Redis
echo "Deploying PostgreSQL and Redis..."
kubectl apply -f ./deployment/kubernetes/database.yaml

section "Deploying application"
# Deploy application
echo "Deploying application..."
kubectl apply -f ./deployment/kubernetes/manifests.yaml

section "Waiting for deployments to be ready"
# Wait for deployments to be ready
echo "Waiting for frontend deployment to be ready..."
kubectl rollout status deployment/degenz-lounge-frontend

echo "Waiting for backend deployment to be ready..."
kubectl rollout status deployment/degenz-lounge-backend

section "Deployment complete"
# Get the external IP
echo "Getting external IP..."
EXTERNAL_IP=$(kubectl get ingress degenz-lounge-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if [ -n "$EXTERNAL_IP" ]; then
  echo -e "${GREEN}DeGeNz Lounge has been successfully deployed!${NC}"
  echo -e "Frontend URL: ${GREEN}https://degenz-lounge.com${NC}"
  echo -e "API URL: ${GREEN}https://api.degenz-lounge.com${NC}"
  echo -e "External IP: ${GREEN}$EXTERNAL_IP${NC}"
  echo -e "\nPlease update your DNS records to point to this IP address."
else
  echo -e "${YELLOW}Deployment completed, but external IP is not yet available.${NC}"
  echo -e "Run the following command to check the status of the ingress:"
  echo -e "  kubectl get ingress degenz-lounge-ingress"
fi

echo -e "\n${GREEN}Thank you for using DeGeNz Lounge deployment script!${NC}"
