# Restaurant Auth Microservice

Authentication and user management microservice using **gRPC**, **NestJS**, **PostgreSQL**, and **Redis**.

## 🚀 Quick Start

### Environment Configuration

Create `.env` file:

```env
# gRPC Server
GRPC_PORT=50051

# PostgreSQL Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=restaurant_auth
DB_SYNCHRONIZE=true

# Redis Cache
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Security
JWT_SECRET=your_super_secret_change_in_production

# Email Service (Mailtrap)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM=noreply@restaurant-auth.com

# URLs for email links
BASE_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
```

### Run Services

```bash
# Start all containers
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker logs restaurant-auth-microservice -f

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 📡 gRPC Services

### AuthService (Port 50051)

**Public endpoints** (no token required):

- `Register` - Create new user account
- `Login` - Authenticate and get JWT token
- `ConfirmEmail` - Verify email with token
- `RequestPasswordReset` - Request password reset email
- `ResetPassword` - Reset password with token
- `RequestUnlock` - Request account unlock email
- `UnlockAccount` - Unlock account with token
- `ConfirmEmailUpdate` - Confirm email change
- `RevertEmail` - Revert email change

### UsersService (Port 50051)

**Protected endpoints** (require JWT token in metadata):

- `GetMyProfile` - Get current user profile
- `UpdateProfile` - Update user name
- `UpdatePassword` - Change password
- `RequestEmailUpdate` - Request email change
- `DeleteAccount` - Delete user account

## 🧪 Testing with grpcurl

### Register User

```bash
grpcurl -plaintext -d '{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}' localhost:50051 auth.AuthService/Register
```

### Login

```bash
grpcurl -plaintext -d '{
  "email": "user@example.com",
  "password": "Password123!"
}' localhost:50051 auth.AuthService/Login
```

Response: `{ "accessToken": "eyJhbGc..." }`

### Get Profile (with JWT)

```bash
grpcurl -plaintext \
  -H "authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}' \
  localhost:50051 users.UsersService/GetMyProfile
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Single-use tokens for email confirmation
- Account lockout after 5 failed login attempts
- Automatic cleanup of unconfirmed accounts (24 hours)
- Email validation on JWT (tokens invalidated after email change)

## 🏗️ Architecture

```
restaurant-auth/
├── proto/                   # Protocol Buffer definitions
│   ├── auth.proto          # Authentication service
│   └── users.proto         # User management service
├── src/
│   ├── auth/               # Authentication module
│   ├── users/              # User management module
│   ├── jwt/                # JWT service
│   ├── mail/               # Email service
│   ├── redis/              # Cache layer
│   └── common/             # Shared utilities
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Container definition
└── .env                    # Environment variables
```

## 🛠️ Development

```bash
# View real-time logs
docker logs restaurant-auth-microservice -f

# Restart microservice only
docker compose restart microservice

# Access PostgreSQL
docker exec -it restaurant-auth-postgres psql -U postgres -d restaurant_auth

# Access Redis
docker exec -it restaurant-auth-redis redis-cli
```

## 🔗 Integration

This microservice is designed to be consumed by an API Gateway that:
- Receives HTTP/GraphQL requests from frontend
- Converts them to gRPC calls to this microservice
- Handles CORS and HTTP authentication
- Exposes REST or GraphQL endpoints

Email links should point to the API Gateway, not directly to this microservice.
