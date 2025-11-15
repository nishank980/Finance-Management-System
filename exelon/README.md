# Personal Finance Management Application

A production-ready microservices-based personal finance management application built with Node.js, Express, MySQL, Redis, RabbitMQ, and Nginx.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running the Application

1. **Clone and navigate to the project:**
```bash
git clone <repository-url>
cd exelon
```

2. **Start all services with Docker Compose:**
```bash
docker-compose up -d
```

3. **Access the application:**
- API Gateway: `http://localhost:8000`
- RabbitMQ Management: `http://localhost:15672` (admin/password)

### Alternative Setup

You can also use the setup script:

```bash
./setup.sh
```

## Architecture Overview

### Microservices Design

The application follows a microservices architecture with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐
│   Client Apps   │────│  Nginx Gateway   │
└─────────────────┘    └──────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │Wallet Service│ │Transaction │
        │   :3001      │ │    :3002     │ │Service:3003│
        └──────────────┘ └──────────────┘ └────────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │Budget Service│ │Report Service│ │    Docs    │
        │    :3004     │ │    :3005     │ │  :8080     │
        └──────────────┘ └──────────────┘ └────────────┘
```

### Service Communication

**RPC Communication (Request-Response):**
- Transaction Service ↔ Wallet Service (balance validation)
- Budget Service ↔ Transaction Service (spending calculation)
- Report Service ↔ Transaction Service (financial data)

**Event-Driven Communication (Pub/Sub):**
- RabbitMQ for asynchronous wallet balance updates
- Redis for distributed caching

### Data Architecture

**Database per Service Pattern:**
- `auth_db` - User authentication data
- `wallet_db` - Wallet information and balances
- `transaction_db` - Transaction records
- `budget_db` - Budget definitions and limits

**Shared Infrastructure:**
- Redis - Distributed caching layer
- RabbitMQ - Message broker for async communication


### Base URL
`http://localhost:8000`

### Authentication
All endpoints (except auth) require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Wallets
- `POST /api/wallets` - Create wallet
- `GET /api/wallets` - Get user wallets
- `DELETE /api/wallets/:walletId` - Delete wallet

#### Transactions
- `POST /api/transactions` - Add transaction (validates wallet balance)
- `GET /api/transactions` - Get transactions with optional date filters
- `DELETE /api/transactions/:transactionId` - Delete transaction

#### Budgets
- `POST /api/budgets` - Set monthly budget for category
- `GET /api/budgets` - Get budgets with current spending

#### Reports
- `GET /api/report?month=<timestamp>` - Get financial summary for month


## Key Features

### Financial Management
- **Multi-wallet support** - Users can create multiple wallets
- **Real-time balance validation** - Prevents overdrafts
- **Budget tracking** - Set monthly spending limits by category
- **Financial reporting** - Income, expenses, and category breakdowns

### Technical Features
- **Microservices architecture** - Scalable and maintainable
- **JWT authentication** - Secure user sessions
- **Redis caching** - Improved performance for frequently accessed data
- **RabbitMQ messaging** - Reliable async communication
- **Docker containerization** - Easy deployment and scaling
- **Nginx load balancing** - API gateway with rate limiting
- **Database per service** - Data isolation and independence

### Business Logic
- **Insufficient funds protection** - Transactions rejected if wallet balance is too low
- **Budget warnings** - Alerts when spending approaches limits
- **Transaction categorization** - Organize expenses by category
- **Monthly reporting** - Financial summaries by time period

## Service Details

### Auth Service (Port 3001)
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt

### Wallet Service (Port 3002)
- Wallet CRUD operations
- Balance management via RPC
- Redis caching for performance

### Transaction Service (Port 3003)
- Transaction recording and retrieval
- Wallet balance validation via RPC
- Budget limit checking via RPC
- Provides spending data to other services

### Budget Service (Port 3004)
- Budget creation and management
- Spending calculation via RPC
- Budget limit enforcement

### Report Service (Port 3005)
- Financial report generation
- Data aggregation via RPC
- Monthly/period-based summaries

## Technology Stack

**Backend:**
- Node.js 18 & Express.js
- MySQL 8.0 (Database per service)
- Redis 7 (Caching)
- RabbitMQ 3 (Message broker)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (API Gateway)
- JWT (Authentication)

**Development:**
- Postman Collection (API Testing)

## Monitoring & Health Checks

Each service exposes health check endpoints:
- `GET /health` - Service health status
- `GET /health/auth` - Auth service health
- `GET /health/wallet` - Wallet service health
- etc.

## Environment Configuration

Key environment variables:
- `DB_HOST` - Database host
- `REDIS_HOST` - Redis host
- `RABBITMQ_URL` - RabbitMQ connection string
- `JWT_SECRET` - JWT signing secret

## Testing

Use the included Postman collection: `Personal_Finance_API.postman_collection.json`

Or test via curl:
```bash
# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```