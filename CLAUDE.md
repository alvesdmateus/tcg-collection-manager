# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TCG Collection Manager is a full-stack web application for managing Trading Card Game collections (Magic: The Gathering, Pokémon, Yu-Gi-Oh). Built with TypeScript, Express.js, PostgreSQL backend and React frontend.

**Components**:
- **Backend**: Node.js/Express REST API with PostgreSQL
- **Frontend**: React SPA (minimal, in development)
- **External Integration**: Scryfall API for Magic: The Gathering card data

## Repository Structure

```
tcg-collection-manager/
├── backend/           # Express.js REST API
│   └── src/
│       ├── config/    # Database configuration and migrations
│       ├── middleware/  # Auth, validation, error handling
│       ├── modules/   # Feature modules (auth, collections, cards)
│       ├── types/     # TypeScript type definitions
│       └── __tests__/ # Test suite with Jest
└── frontend/          # React application (minimal)
    └── src/
        ├── components/  # Auth, Collections, Cards components
        ├── contexts/  # AuthContext for global state
        └── i18n/      # Internationalization (pt-BR)
```

## Development Commands

### Backend (Node.js/Express)
```bash
cd backend
npm install                 # Install dependencies
npm run dev                 # Start development server (ts-node-dev with auto-reload)
npm run build               # Compile TypeScript to JavaScript
npm start                   # Run production build
npm run migrate             # Run database migrations
npm test                    # Run test suite
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

### Database Operations
```bash
# Connect to PostgreSQL
psql -U postgres -d tcg_collection

# Run migrations
cd backend && npm run migrate

# Reset database (WARNING: deletes all data)
npm run migrate -- --reset

# Common psql commands once connected:
\dt                         # List all tables
\d users                    # Describe table structure
\d collections
\d cards
```

### Testing API
Use the `backend/api-tests.http` file with VS Code REST Client extension, or use curl/Postman. The file contains complete API examples including auth flow.

## Architecture

### Backend Structure (Three-Layer Architecture)

The backend follows a clean **Service → Controller → Routes** pattern:

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts      # Business logic: password hashing, JWT generation
│   │   ├── auth.controller.ts   # HTTP handlers: parse requests, format responses
│   │   └── auth.routes.ts       # Route definitions + validation rules
│   ├── collections/
│   │   ├── collections.service.ts    # CRUD operations, ownership validation
│   │   ├── collections.controller.ts # HTTP layer
│   │   └── collections.routes.ts     # Protected routes
│   └── cards/
│       ├── scryfall.service.ts       # External API wrapper for Scryfall
│       ├── cards.service.ts          # Card management logic
│       ├── cards.controller.ts       # HTTP layer
│       └── cards.routes.ts           # Protected routes
```

**Key Pattern**: Routes → Controller → Service → Database
- **Routes**: Define endpoints, apply middleware (auth, validation)
- **Controllers**: Handle HTTP concerns (req/res), call services
- **Services**: Contain business logic, interact with database
- **Never bypass layers**: Controllers should not access database directly

### Authentication Flow

1. User registers/logs in → receives JWT token
2. JWT tokens are stored in `Authorization: Bearer <token>` headers
3. The `authenticate` middleware (src/middleware/auth.ts) extracts and verifies tokens
4. Decoded user info is attached to `req.user` for use in controllers
5. All protected routes use the `authenticate` middleware
6. Password hashing uses bcrypt with 10 salt rounds

**Security Notes**:
- Never log JWT tokens or passwords
- All database queries use parameterized queries ($1, $2) to prevent SQL injection
- Resource ownership is verified in service layer before any mutations
- JWT_SECRET must be strong in production (use crypto.randomBytes(64))

### Database Schema

```
users (id, email, password_hash, created_at)
  ↓ 1:N (ON DELETE CASCADE)
collections (id, user_id, name, tcg_type, created_at)
  ↓ 1:N (ON DELETE CASCADE)
cards (id, collection_id, scryfall_id, owner_name, current_deck, is_borrowed, added_at)
```

**Key Design Decisions**:
- UUIDs are used for all primary keys (security + scalability)
- Foreign keys have CASCADE DELETE (deleting a collection deletes all its cards)
- Indexes exist on all foreign keys and email for performance
- Timestamps use PostgreSQL's TIMESTAMP type (timezone-aware)
- Cards store `scryfall_id` (reference) instead of full card data
- Card data is enriched with Scryfall API on retrieval

### Scryfall API Integration

The `scryfall.service.ts` wraps all Scryfall API calls:

**Base URL**: `https://api.scryfall.com`
**Rate Limit**: 10 requests/second (managed by Scryfall)

**Key Endpoints Used**:
- `/cards/:id` - Get card by Scryfall ID
- `/cards/search` - Search cards by query
- `/cards/named` - Get card by exact name
- `/cards/autocomplete` - Autocomplete suggestions

**Important**: When users add cards, the frontend searches Scryfall first, then sends the `scryfall_id` to the backend. The backend validates the card exists via Scryfall before saving to database.

### Middleware Stack

Middleware order is critical in backend/src/app.ts:

1. **CORS** - Must be first for preflight requests
2. **Body Parsers** - Parse JSON/URL-encoded bodies
3. **Request Logging** - Simple console logging (development only)
4. **Authentication** - Applied per-route via `authenticate` middleware
5. **Validation** - Applied per-route via `validate` middleware
6. **Route Handlers** - Business logic
7. **Error Handler** - Must be LAST to catch all errors

### Error Handling Pattern

Centralized error handling via custom `AppError` class:

1. Throw `AppError` for expected operational errors:
```typescript
throw new AppError('User not found', 404);
```

2. **AppError** (backend/src/types/index.ts): Custom error with status code
3. **errorHandler** (backend/src/middleware/errorHandler.ts): Global Express error handler
4. Controllers throw `AppError` instances
5. Error handler catches and formats response consistently
6. Async errors are handled by the `asyncHandler` wrapper (no try-catch needed in routes)

## Common Development Tasks

### Adding a New Protected Route

1. Add route handler in appropriate routes file with `authenticate` middleware:
```typescript
router.get('/endpoint', authenticate, controller.handler);
```

2. Add validation rules using express-validator:
```typescript
import { body, param } from 'express-validator';
router.post('/', authenticate, [
  body('field').notEmpty().withMessage('Required'),
], controller.create);
```

3. Implement controller method (handle HTTP, call service):
```typescript
async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.user!.userId;  // Available after authenticate middleware
  const result = await service.create(userId, req.body);
  res.status(201).json({ success: true, data: result });
}
```

4. Implement service method (business logic, database access):
```typescript
async create(userId: string, data: CreateDto): Promise<ResponseDto> {
  const result = await pool.query(
    'INSERT INTO table (user_id, field) VALUES ($1, $2) RETURNING *',
    [userId, data.field]
  );
  return result.rows[0];
}
```

### Adding Database Migrations

Migrations are in `backend/src/config/migrations.ts`. To add a new table or column:

1. Add SQL in `runMigrations()` function using `CREATE TABLE IF NOT EXISTS` or `ALTER TABLE`
2. Always use parameterized queries
3. Add appropriate indexes for foreign keys and frequently queried columns
4. Add DROP TABLE statement in `rollbackMigrations()` for cleanup
5. Run `npm run migrate` to apply changes

**Important**: The migration system is idempotent (safe to run multiple times). There's also a `rollbackMigrations()` function for development.

### Working with Types

All TypeScript types are centralized in `backend/src/types/index.ts`:
- Request DTOs (data coming from client)
- Response DTOs (data sent to client)
- Database models
- JWT payload structure (`AuthTokenPayload`)
- Custom error class `AppError`

When adding new features, define types first, then implement handlers.

## Environment Configuration

Required environment variables (backend):

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_collection
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key  # Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Scryfall
SCRYFALL_API_BASE=https://api.scryfall.com
```

## Frontend Architecture

The frontend is a React SPA using Context API for state:

```
frontend/src/
├── components/
│   ├── Auth/          # Login/Register forms
│   ├── Collections/   # Collection list and forms
│   └── Cards/         # Card list, forms, and hover preview
├── contexts/
│   └── AuthContext.tsx  # Global auth state (user, token, login/logout)
└── i18n/              # Internationalization (pt-BR)
```

**Key Notes**:
- Auth token is stored in AuthContext and localStorage
- All API calls include `Authorization: Bearer ${token}` header
- The CardHoverPreview component shows Scryfall card images on hover
- Frontend is minimal and currently in development

## Testing

### Test Structure
Tests are located in `backend/src/__tests__/`:
- **Unit tests**: Service layer business logic (auth.service.test.ts)
- **Mock database**: In-memory mock (`MockPool`) for fast, isolated tests
- **No real database needed**: Tests use mocked dependencies

### Running Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Auto-rerun on changes
npm run test:coverage       # Generate coverage report
```

### Writing Tests
1. Create test files in `src/__tests__/modules/` with `.test.ts` extension
2. Mock the database pool using `MockPool` from test helpers
3. Use `beforeEach` to clean database state between tests
4. Follow Arrange-Act-Assert pattern
5. Test both success and error cases

Example:
```typescript
import { MockPool, cleanupTestDatabase } from '../helpers/testDatabase';

jest.mock('../../config/database', () => {
  const { MockPool } = jest.requireActual('../helpers/testDatabase');
  return new MockPool();
});

import pool from '../../config/database';
import MyService from '../../modules/my/my.service';

describe('MyService', () => {
  const mockPool = pool as unknown as MockPool;

  beforeEach(() => {
    cleanupTestDatabase(mockPool);
  });

  it('should do something', async () => {
    const result = await MyService.method();
    expect(result).toBeDefined();
  });
});
```

See `backend/src/__tests__/README.md` for detailed testing guide.

## Important Conventions

1. **All database queries must use parameterized queries** ($1, $2, etc.) - NEVER string interpolation
2. **Resource ownership verification**: Always verify `user_id` matches `req.user.userId` before mutations
3. **Error messages in Portuguese**: User-facing errors are in pt-BR (e.g., "Usuário não encontrado")
4. **Async/await everywhere**: No callback-style code
5. **Type safety**: Always define explicit types, avoid `any`
6. **Module pattern**: Each service is a singleton exported with `export default new ServiceClass()`

## Testing Workflow

1. Start PostgreSQL: `sudo systemctl start postgresql` or `brew services start postgresql`
2. Ensure database exists: `psql -U postgres -c "CREATE DATABASE tcg_collection;"`
3. Run migrations: `cd backend && npm run migrate`
4. Start backend: `npm run dev`
5. Test health check: `curl http://localhost:3000/health`
6. Use `api-tests.http` file to test complete user flow:
   - Register user → Login → Create collection → Search card → Add card

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

## Known Limitations

- **No rate limiting** implemented (needed for production)
- **No caching** for Scryfall API calls (causes slow responses)
- **No pagination** on large collections (performance issue with 100+ cards)
- **No transactions** for complex multi-table operations
- **Simple console logging** (should use Winston/Pino in production)
- **Frontend is minimal** (React components are placeholder, needs full implementation)

## References

- Full architecture diagrams: `ARCHITECTURE.md`
- Quick setup guide: `QUICKSTART.md`
- Project summary: `PROJECT_SUMMARY.md`
- Test suite documentation: `backend/src/__tests__/README.md`
- Backend API documentation: `backend/README.md`
- Scryfall API docs: https://scryfall.com/docs/api
