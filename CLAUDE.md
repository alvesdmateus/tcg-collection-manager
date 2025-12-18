# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TCG Collection Manager is a full-stack web application for managing Trading Card Game collections (Magic: The Gathering, Pokémon, Yu-Gi-Oh). The project consists of:
- **Backend**: Node.js/Express REST API with PostgreSQL
- **Frontend**: React (minimal, in development)
- **External Integration**: Scryfall API for Magic: The Gathering card data

## Repository Structure

```
tcg-collection-manager/
├── backend/           # Express.js REST API
│   └── src/
│       ├── config/    # Database configuration and migrations
│       ├── middleware/  # Auth, validation, error handling
│       ├── modules/   # Feature modules (auth, collections, cards)
│       └── types/     # TypeScript type definitions
└── frontend/          # React application (minimal)
    └── src/
        ├── api/       # Backend API client
        ├── components/  # React components
        ├── contexts/  # React contexts (AuthContext)
        └── types/     # Frontend type definitions
```

## Development Commands

### Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Reset database (WARNING: deletes all data)
npm run migrate -- --reset

# Development server (hot-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Frontend

The frontend is minimal and currently in development. Basic React components exist for authentication and collection management.

## Architecture

### Backend Architecture

The backend follows a **three-layer architecture** pattern:

1. **Routes Layer** (`*.routes.ts`): Defines HTTP endpoints and applies middleware
2. **Controller Layer** (`*.controller.ts`): Handles HTTP requests/responses, calls services
3. **Service Layer** (`*.service.ts`): Contains business logic and database operations

#### Module Organization

Each feature is organized as a self-contained module:

```
modules/
├── auth/
│   ├── auth.service.ts       # Business logic (register, login, verify)
│   ├── auth.controller.ts    # HTTP handlers
│   └── auth.routes.ts        # Endpoint definitions
├── collections/
│   ├── collections.service.ts
│   ├── collections.controller.ts
│   └── collections.routes.ts
└── cards/
    ├── scryfall.service.ts   # External API integration
    ├── cards.service.ts
    ├── cards.controller.ts
    └── cards.routes.ts
```

### Database Schema

Three main tables with cascading relationships:

```sql
users (id, email, password_hash, created_at)
  ↓
collections (id, user_id, name, tcg_type, created_at)
  ↓
cards (id, collection_id, scryfall_id, owner_name, current_deck, is_borrowed, added_at)
```

**Key Design Decisions**:
- UUID primary keys for security
- Cards store `scryfall_id` (reference) instead of full card data
- Card data is enriched with Scryfall API on retrieval
- Cascading deletes maintain referential integrity
- Indexes on foreign keys for query performance

### Authentication Flow

1. User registers/logs in → receives JWT token
2. Token sent in `Authorization: Bearer <token>` header
3. `authenticate` middleware (backend/src/middleware/auth.ts) verifies token
4. User ID attached to request object for authorization checks
5. Service layer verifies resource ownership (collections/cards belong to user)

### Scryfall Integration

The application integrates with the Scryfall API for Magic: The Gathering card data:

- **Service**: `backend/src/modules/cards/scryfall.service.ts`
- **Base URL**: `https://api.scryfall.com`
- **Rate Limit**: 10 requests/second (managed by Scryfall)
- **Caching**: Not implemented yet - recommended for production

**Key Endpoints Used**:
- `/cards/:id` - Get card by Scryfall ID
- `/cards/search` - Search cards by query
- `/cards/named` - Get card by exact name
- `/cards/autocomplete` - Autocomplete suggestions

### Middleware Stack

Middleware order is critical in backend/src/app.ts:

1. **CORS** - Must be first for preflight requests
2. **Body Parsers** - Parse JSON/URL-encoded bodies
3. **Request Logging** - Simple console logging (development only)
4. **Authentication** - Applied per-route via `authenticate` middleware
5. **Validation** - Applied per-route via `validate` middleware
6. **Route Handlers** - Business logic
7. **Error Handler** - Must be LAST to catch all errors

### Error Handling

Centralized error handling via custom `AppError` class:

- **AppError** (backend/src/types/index.ts): Custom error with status code
- **errorHandler** (backend/src/middleware/errorHandler.ts): Global Express error handler
- Controllers throw `AppError` instances
- Error handler catches and formats response consistently

## Environment Configuration

Required environment variables (backend):

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_collection
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Testing the API

The backend README.md (backend/README.md) contains comprehensive API documentation with all endpoints, request/response examples, and curl commands.

**Quick Testing**:
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login` (get token)
3. Create collection: `POST /api/collections` (with Bearer token)
4. Search cards: `GET /api/cards/search?q=lightning+bolt`
5. Add card: `POST /api/collections/:id/cards`

## Key Technical Decisions

### TypeScript Configuration

- **Strict Mode**: Maximum type safety enabled
- **No Implicit Any**: All types must be explicit
- **Return Types**: Required on all functions
- **Unused Variables**: Flagged as errors

### Security Measures

- **Password Hashing**: bcrypt with 10 salt rounds
- **SQL Injection Prevention**: Parameterized queries throughout
- **JWT Expiration**: Configurable token lifetime
- **Ownership Verification**: Users can only access their own resources
- **Input Validation**: express-validator on all endpoints

### Database Patterns

- **Connection Pooling**: Reuse database connections for performance
- **Transactions**: Not implemented yet - needed for complex operations
- **Migrations**: Run via `npm run migrate`, schema in config/migrations.ts
- **Foreign Key Constraints**: Enforce referential integrity at DB level

## Common Development Tasks

### Adding a New API Endpoint

1. Define route in `modules/[feature]/[feature].routes.ts`
2. Add validation middleware if needed
3. Implement controller handler in `[feature].controller.ts`
4. Add business logic in `[feature].service.ts`
5. Update types in `types/index.ts` if needed

### Adding a New Database Table

1. Add CREATE TABLE statement in `config/migrations.ts` → `runMigrations()`
2. Add DROP TABLE statement in `rollbackMigrations()` for cleanup
3. Add indexes for foreign keys and frequently queried columns
4. Run `npm run migrate` to apply changes

### Modifying Authentication

- JWT logic: `modules/auth/auth.service.ts`
- Token verification: `middleware/auth.ts`
- Token payload structure: `types/index.ts` → `AuthTokenPayload`

## Known Limitations

- No rate limiting implemented (needed for production)
- No caching for Scryfall API calls (causes slow responses)
- No pagination on large collections (performance issue)
- No unit/integration tests (needed for reliability)
- Simple console logging (should use Winston/Pino in production)
- Frontend is minimal (React components are placeholder)

## Frontend Architecture

The frontend is currently minimal with basic components:

- **AuthContext**: React context for authentication state
- **Components**: Login, Register, CollectionList, CardList, CardForm
- **API Integration**: Planned but not fully implemented
- **i18n**: Internationalization setup exists

The frontend architecture should follow React best practices when expanded.
