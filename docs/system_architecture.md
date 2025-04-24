# DeGeNz Lounge System Architecture

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'basic',
  stripe_customer_id TEXT,
  settings JSONB DEFAULT '{}'
);
```

### Agents Table
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}'
);
```

### Prompts Table
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false
);
```

### Marketplace Listings Table
```sql
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL NOT NULL,
  item_type TEXT NOT NULL, -- 'agent' or 'prompt'
  item_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  tags TEXT[],
  preview_data JSONB
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES marketplace_listings(id),
  amount DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sandbox Sessions Table
```sql
CREATE TABLE sandbox_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  configuration JSONB DEFAULT '{}'
);
```

### Sandbox Agents Table
```sql
CREATE TABLE sandbox_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  configuration JSONB DEFAULT '{}'
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'user' or 'agent'
  sender_id TEXT NOT NULL, -- user_id or agent_id
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `POST /auth/logout` - Logout a user
- `GET /auth/user` - Get current user information
- `PUT /auth/user` - Update user information

### Agents
- `GET /agents` - List user's agents
- `POST /agents` - Create a new agent
- `GET /agents/{id}` - Get agent details
- `PUT /agents/{id}` - Update an agent
- `DELETE /agents/{id}` - Delete an agent
- `POST /agents/{id}/duplicate` - Duplicate an agent

### Prompts
- `GET /prompts` - List user's prompts
- `POST /prompts` - Create a new prompt
- `GET /prompts/{id}` - Get prompt details
- `PUT /prompts/{id}` - Update a prompt
- `DELETE /prompts/{id}` - Delete a prompt
- `POST /prompts/{id}/duplicate` - Duplicate a prompt

### Marketplace
- `GET /marketplace/listings` - List marketplace items
- `POST /marketplace/listings` - Create a new listing
- `GET /marketplace/listings/{id}` - Get listing details
- `PUT /marketplace/listings/{id}` - Update a listing
- `DELETE /marketplace/listings/{id}` - Delete a listing
- `POST /marketplace/purchase/{id}` - Purchase an item
- `GET /marketplace/purchases` - List user's purchases
- `GET /marketplace/sales` - List user's sales

### Sandbox
- `GET /sandbox/sessions` - List user's sandbox sessions
- `POST /sandbox/sessions` - Create a new sandbox session
- `GET /sandbox/sessions/{id}` - Get session details
- `PUT /sandbox/sessions/{id}` - Update a session
- `DELETE /sandbox/sessions/{id}` - Delete a session
- `POST /sandbox/sessions/{id}/agents` - Add agent to sandbox
- `DELETE /sandbox/sessions/{id}/agents/{agent_id}` - Remove agent from sandbox
- `PUT /sandbox/sessions/{id}/agents/{agent_id}/position` - Update agent position

### Chat
- `GET /chat/{session_id}/messages` - Get chat messages for a session
- `POST /chat/{session_id}/messages` - Send a new message
- `GET /chat/{session_id}/stream` - WebSocket endpoint for real-time chat

### Billing
- `GET /billing/subscription` - Get subscription details
- `POST /billing/subscription` - Create/update subscription
- `GET /billing/payment-methods` - Get payment methods
- `POST /billing/payment-methods` - Add payment method
- `GET /billing/invoices` - Get invoices

## Component Architecture

### Frontend Components

#### Core Components
- `Layout` - Main application layout with navigation
- `AuthGuard` - Protect routes that require authentication
- `Navbar` - Top navigation bar
- `Sidebar` - Side navigation menu
- `Footer` - Application footer

#### Authentication Components
- `LoginForm` - User login form
- `RegisterForm` - User registration form
- `ForgotPasswordForm` - Password recovery form
- `ProfileSettings` - User profile settings

#### Agent Components
- `AgentList` - List of user's agents
- `AgentCard` - Card displaying agent information
- `AgentForm` - Form for creating/editing agents
- `AgentDetail` - Detailed view of an agent

#### Prompt Components
- `PromptList` - List of user's prompts
- `PromptCard` - Card displaying prompt information
- `PromptForm` - Form for creating/editing prompts
- `PromptDetail` - Detailed view of a prompt

#### Marketplace Components
- `MarketplaceList` - List of marketplace items
- `MarketplaceFilters` - Filters for marketplace items
- `ListingCard` - Card displaying listing information
- `ListingDetail` - Detailed view of a listing
- `PurchaseModal` - Modal for purchasing items
- `SalesReport` - Report of user's sales

#### Sandbox Components
- `SandboxList` - List of user's sandbox sessions
- `SandboxCanvas` - Canvas for agent interaction
- `AgentNode` - Draggable agent node in sandbox
- `ChatPanel` - Chat interface for sandbox
- `ConflictResolutionModal` - Modal for resolving conflicts

#### Billing Components
- `SubscriptionPlans` - Display subscription plans
- `PaymentMethodForm` - Form for adding payment methods
- `InvoiceList` - List of user's invoices

### Backend Components

#### Core Modules
- `main.py` - Application entry point
- `config.py` - Configuration settings
- `database.py` - Database connection and models
- `dependencies.py` - Dependency injection

#### Authentication Module
- `auth/router.py` - Authentication routes
- `auth/service.py` - Authentication business logic
- `auth/models.py` - Authentication data models
- `auth/dependencies.py` - Authentication dependencies

#### Agents Module
- `agents/router.py` - Agent routes
- `agents/service.py` - Agent business logic
- `agents/models.py` - Agent data models

#### Prompts Module
- `prompts/router.py` - Prompt routes
- `prompts/service.py` - Prompt business logic
- `prompts/models.py` - Prompt data models

#### Marketplace Module
- `marketplace/router.py` - Marketplace routes
- `marketplace/service.py` - Marketplace business logic
- `marketplace/models.py` - Marketplace data models

#### Sandbox Module
- `sandbox/router.py` - Sandbox routes
- `sandbox/service.py` - Sandbox business logic
- `sandbox/models.py` - Sandbox data models
- `sandbox/manager.py` - Manager agent implementation
- `sandbox/conflict_resolution.py` - Conflict resolution logic

#### Chat Module
- `chat/router.py` - Chat routes
- `chat/service.py` - Chat business logic
- `chat/models.py` - Chat data models
- `chat/websocket.py` - WebSocket implementation

#### Billing Module
- `billing/router.py` - Billing routes
- `billing/service.py` - Billing business logic
- `billing/models.py` - Billing data models
- `billing/stripe.py` - Stripe integration

## Integration Architecture

### External Services Integration

#### Supabase Integration
- Authentication and user management
- Database storage
- Row-level security policies

#### Stripe Integration
- Payment processing
- Subscription management
- Marketplace transactions

#### LangChain Integration
- Task decomposition
- Agent orchestration
- Tool integration

#### Gemini Integration
- Conflict resolution scoring
- Content generation
- Agent responses

## Deployment Architecture

### GCP Deployment

#### Kubernetes Cluster
- Frontend deployment
- Backend deployment
- Database service
- Redis service

#### Cloud Storage
- Static assets
- User uploads

#### Cloud SQL
- PostgreSQL database

#### Memorystore
- Redis cache

#### Cloud Build
- CI/CD pipeline

#### Cloud IAM
- Service accounts
- Access control

## Security Architecture

### Authentication Security
- JWT-based authentication
- Refresh token rotation
- Password hashing with bcrypt

### Authorization Security
- Role-based access control
- Row-level security in Supabase
- API endpoint protection

### Data Security
- HTTPS encryption
- Database encryption
- Sensitive data handling

### Payment Security
- PCI compliance via Stripe
- Secure webhook handling
- Fraud prevention

## Monitoring and Logging

### Application Monitoring
- Error tracking
- Performance monitoring
- User activity tracking

### Infrastructure Monitoring
- Kubernetes monitoring
- Database monitoring
- Cache monitoring

### Logging
- Application logs
- Access logs
- Error logs

## Backup and Recovery

### Database Backup
- Automated daily backups
- Point-in-time recovery

### Application Backup
- Configuration backups
- User data backups

### Disaster Recovery
- Multi-zone deployment
- Failover procedures
