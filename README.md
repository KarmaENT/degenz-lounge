# DeGeNz Lounge - Updated README

## AI Agent Builder & Library

DeGeNz Lounge is a custom AI Agent Builder & Library with a multi-agent sandbox, prompt repository, and agent+prompt marketplace.

## Core Features

### Multi-Agent Sandbox
- Manager Agent decomposes tasks and assigns subtasks using LangChain
- Real-time chat with conflict resolution (Gemini-scored auto-resolve/user toggle)
- Support for multiple AI models including Gemini, OpenAI, Claude, MistralAI, DeepSeek, Grok, Huggingface, Openrouter, and Perplexity

### Agent Library
- Save agents with custom system prompts
- Marketplace for buying/selling (10% commission)
- Comprehensive agent management

### Authentication
- Supabase RBAC (Role-Based Access Control)
- Universal authentication for all subscription tiers

### Payment Processing
- Stripe integration for credit card payments
- PayPal integration for subscription payments
- Secure webhook handling for real-time updates

## Tech Stack

### Frontend
- React/Next.js
- Tailwind CSS (with #0EA5E9/#111827 color scheme)
- WebSocket for real-time communication

### Backend
- FastAPI
- PostgreSQL for persistent storage
- Redis for caching and real-time features

### AI Integration
- LangChain for agent orchestration
- Gemini as the default AI model
- Support for multiple AI models

### Deployment Options
- Docker containers
- Kubernetes on GCP
- GitHub Codespaces
- Streamlit
- Termux for mobile deployment

## Getting Started

### Prerequisites
- Node.js 20.x
- Python 3.10+
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 6+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/degenz-lounge.git
cd degenz-lounge
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development environment:
```bash
docker-compose up -d
```

4. Access the application:
```
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Documentation: http://localhost:8000/docs
```

## Deployment

See the deployment documentation for detailed instructions:
- [GCP Kubernetes Deployment](./docs/tutorials/gcp_kubernetes.md)
- [GitHub Codespaces Deployment](./docs/tutorials/codespaces.md)
- [Streamlit Deployment](./docs/tutorials/streamlit.md)
- [Termux Deployment](./docs/tutorials/termux.md)

## Documentation

- [System Architecture](./docs/system_architecture.md)
- [AI Model Integration](./docs/ai_model_integration.md)
- [Payment Integration](./docs/payment_integration.md)
- [Feature Updates](./docs/feature_updates.md)
- [API Documentation](./docs/api_documentation.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with LangChain and Gemini
- Powered by React, FastAPI, PostgreSQL, and Redis
- Deployed with Docker and Kubernetes
