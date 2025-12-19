# Test Suite

This directory contains the test suite for the TCG Collection Manager backend.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
__tests__/
├── setup.ts                    # Test environment configuration
├── helpers/
│   └── testDatabase.ts        # Mock database utilities
└── modules/
    └── auth.service.test.ts   # Authentication service tests
```

## Test Strategy

### Unit Tests
- **Service Layer**: Tests for business logic in isolation
- **Mocked Dependencies**: Database and external APIs are mocked
- **Fast Execution**: No actual database or network calls

### What's Tested

#### Authentication Service (auth.service.test.ts)
- ✅ User registration with valid data
- ✅ Password hashing (bcrypt)
- ✅ Duplicate email detection
- ✅ User login with correct credentials
- ✅ Login failure with incorrect password
- ✅ Login failure with nonexistent email
- ✅ JWT token generation and validation
- ✅ Get user by ID
- ✅ Security: no password leakage in responses
- ✅ Edge cases: special characters, long emails

## Mock Database

Tests use an in-memory mock database (`MockPool`) instead of PostgreSQL:
- **Fast**: No database connection overhead
- **Isolated**: Tests don't affect real data
- **Deterministic**: Each test starts with clean state

## Test Coverage

To generate a coverage report:

```bash
npm run test:coverage
```

View the HTML report at `coverage/lcov-report/index.html`

### Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Writing New Tests

### 1. Create test file
Place in `__tests__/modules/` directory with `.test.ts` extension.

### 2. Import test utilities
```typescript
import { MockPool, createTestUser, cleanupTestDatabase } from '../helpers/testDatabase';
```

### 3. Mock dependencies
```typescript
jest.mock('../../config/database', () => {
  const { MockPool } = jest.requireActual('../helpers/testDatabase');
  return new MockPool();
});
```

### 4. Write test cases
```typescript
describe('MyService', () => {
  const mockPool = pool as unknown as MockPool;

  beforeEach(() => {
    cleanupTestDatabase(mockPool);
  });

  it('should do something', async () => {
    // Arrange
    const testData = { /* ... */ };

    // Act
    const result = await service.method(testData);

    // Assert
    expect(result).toBe(expected);
  });
});
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: Test names should explain what's being tested
4. **Clean state**: Use `beforeEach` to reset database
5. **Test edge cases**: Empty inputs, special characters, long strings
6. **Test error cases**: Invalid inputs, missing data, unauthorized access

## Debugging Tests

### Run specific test file
```bash
npm test -- auth.service.test.ts
```

### Run specific test case
```bash
npm test -- -t "should successfully register a new user"
```

### Enable verbose output
```bash
npm test -- --verbose
```

### See console logs
Remove the console mocking in `setup.ts` to see console.log output during tests.

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Exit code 0 on success, non-zero on failure
- Coverage reports in standard formats (lcov, JSON)

Add to your CI pipeline:
```yaml
- run: npm install
- run: npm test
- run: npm run test:coverage
```

## Future Test Coverage

### Collections Service
- [ ] Create collection
- [ ] Get user's collections
- [ ] Update collection
- [ ] Delete collection and cascade to cards
- [ ] Collection statistics

### Cards Service
- [ ] Add card to collection
- [ ] Update card details
- [ ] Delete card
- [ ] Get cards in collection
- [ ] Scryfall integration

### Integration Tests
- [ ] Full API endpoint tests with supertest
- [ ] Authentication middleware
- [ ] Validation middleware
- [ ] Error handler middleware

### E2E Tests
- [ ] Complete user registration flow
- [ ] Create collection and add cards
- [ ] Update and delete operations
