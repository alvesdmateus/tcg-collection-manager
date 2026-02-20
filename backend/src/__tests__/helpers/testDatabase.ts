/**
 * Test Database Helpers
 *
 * Utilities for managing test database state:
 * - Creating test users
 * - Cleaning up between tests
 * - Mocking database queries
 */

import { QueryResult } from 'pg';

/**
 * Mock database pool for testing
 * Uses in-memory mock instead of real database
 */
export class MockPool {
  private users: any[] = [];

  query(text: string, params?: any[]): Promise<QueryResult> {
    // Mock implementation for common queries
    if (text.includes('SELECT') && text.includes('FROM users WHERE email')) {
      const email = params?.[0];
      const user = this.users.find((u) => u.email === email);
      return Promise.resolve({
        rows: user ? [user] : [],
        command: 'SELECT',
        rowCount: user ? 1 : 0,
        oid: 0,
        fields: [],
      });
    }

    if (text.includes('INSERT INTO users')) {
      const [email, passwordHash] = params || [];
      const user = {
        id: `user-${Date.now()}-${Math.random()}`,
        email,
        password_hash: passwordHash,
        created_at: new Date(),
      };
      this.users.push(user);
      return Promise.resolve({
        rows: [user],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });
    }

    if (text.includes('SELECT') && text.includes('FROM users WHERE id')) {
      const userId = params?.[0];
      const user = this.users.find((u) => u.id === userId);
      return Promise.resolve({
        rows: user ? [user] : [],
        command: 'SELECT',
        rowCount: user ? 1 : 0,
        oid: 0,
        fields: [],
      });
    }

    // Default: return empty result
    return Promise.resolve({
      rows: [],
      command: 'UNKNOWN',
      rowCount: 0,
      oid: 0,
      fields: [],
    });
  }

  async connect() {
    return this;
  }

  async end() {
    return;
  }

  on(_event: string, _listener: (...args: any[]) => void) {
    // No-op for tests
  }

  /**
   * Clear all test data
   */
  clear() {
    this.users = [];
  }

  /**
   * Get all stored users (for testing)
   */
  getUsers() {
    return this.users;
  }
}

/**
 * Create a test user in the mock database
 */
export function createTestUser(
  mockPool: MockPool,
  email: string = 'test@example.com',
  passwordHash: string = 'hashed_password'
) {
  const user = {
    id: `user-${Date.now()}-${Math.random()}`,
    email,
    password_hash: passwordHash,
    created_at: new Date(),
  };
  mockPool.getUsers().push(user);
  return user;
}

/**
 * Clean up test database
 */
export function cleanupTestDatabase(mockPool: MockPool) {
  mockPool.clear();
}
