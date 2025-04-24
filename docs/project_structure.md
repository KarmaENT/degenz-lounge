# DeGeNz Lounge - Project Structure

This document outlines the folder structure of the DeGeNz Lounge AI Agent Builder & Library project.

## Root Directory Structure

```
degenz-lounge/
├── backend/                 # FastAPI backend application
├── frontend/                # Next.js frontend application
├── deployment/              # Deployment configurations and scripts
│   ├── kubernetes/          # Kubernetes manifests for GCP deployment
│   ├── codespaces/          # GitHub Codespaces configuration
│   ├── streamlit/           # Streamlit deployment configuration
│   └── scripts/             # Deployment scripts for various platforms
├── docs/                    # Project documentation
│   ├── architecture/        # System architecture documentation
│   ├── api/                 # API documentation
│   └── tutorials/           # Step-by-step deployment tutorials
├── scripts/                 # Utility scripts for development and testing
├── .github/                 # GitHub configuration (workflows, templates)
│   └── workflows/           # CI/CD pipeline configurations
└── docker-compose files     # Docker Compose configurations for different environments
```

## Backend Structure

```
backend/
├── app/                     # Main application package
│   ├── auth/                # Authentication module
│   ├── agents/              # Agents module
│   ├── prompts/             # Prompts module
│   ├── marketplace/         # Marketplace module
│   ├── sandbox/             # Multi-agent sandbox module
│   ├── chat/                # Real-time chat module
│   ├── models.py            # Database models
│   ├── database.py          # Database connection
│   └── main.py              # FastAPI application entry point
├── tests/                   # Test suite
├── Dockerfile               # Docker configuration for backend
├── requirements.txt         # Python dependencies
└── pyproject.toml           # Python project configuration
```

## Frontend Structure

```
frontend/
├── public/                  # Static assets
├── src/                     # Source code
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React context providers
│   ├── lib/                 # Utility functions and API clients
│   ├── pages/               # Next.js pages
│   │   ├── agents/          # Agent management pages
│   │   ├── prompts/         # Prompt management pages
│   │   ├── sandbox/         # Sandbox pages
│   │   ├── marketplace/     # Marketplace pages
│   │   └── api/             # API routes
│   └── styles/              # CSS and styling
├── Dockerfile               # Docker configuration for frontend
└── package.json             # Node.js dependencies and scripts
```

## Deployment Structure

```
deployment/
├── kubernetes/              # Kubernetes configuration
│   ├── manifests.yaml       # Main Kubernetes manifests
│   ├── database.yaml        # Database service manifests
│   └── secrets-template.yaml # Template for Kubernetes secrets
├── codespaces/              # GitHub Codespaces configuration
│   ├── devcontainer.json    # Dev container configuration
│   └── setup-codespace.sh   # Codespace setup script
├── streamlit/               # Streamlit deployment
│   ├── app.py               # Streamlit application
│   ├── requirements.txt     # Streamlit-specific dependencies
│   └── Dockerfile           # Streamlit Docker configuration
└── scripts/                 # Deployment scripts
    ├── deploy-gcp.sh        # GCP deployment script
    ├── deploy-termux.sh     # Termux deployment script
    ├── deploy-codespaces.sh # GitHub Codespaces deployment script
    └── deploy-streamlit.sh  # Streamlit deployment script
```

## Documentation Structure

```
docs/
├── architecture/            # System architecture documentation
│   ├── system_architecture.md  # Overall system architecture
│   └── architecture_diagram.md # Architecture diagrams
├── api/                     # API documentation
│   └── api_reference.md     # API endpoints reference
└── tutorials/               # Deployment tutorials
    ├── gcp_kubernetes.md    # GCP with Kubernetes deployment tutorial
    ├── termux.md            # Termux deployment tutorial
    ├── codespaces.md        # GitHub Codespaces deployment tutorial
    └── streamlit.md         # Streamlit deployment tutorial
```
