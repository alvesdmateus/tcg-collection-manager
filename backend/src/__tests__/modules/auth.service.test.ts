/**
 * Authentication Service Tests
 *
 * Tests for auth.service.ts covering:
 * - User registration (success and failure cases)
 * - User login (success and failure cases)
 * - Get user by ID
 * - JWT token generation and validation
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MockPool, createTestUser, cleanupTestDatabase } from '../helpers/testDatabase';
import { AppError } from '../../types';

// Mock the database module
jest.mock('../../config/database', () => {
  const { MockPool } = jest.requireActual('../helpers/testDatabase');
  return new MockPool();
});

// Import after mocking
import pool from '../../config/database';
import AuthService from '../../modules/auth/auth.service';

describe('AuthService', () => {
  const mockPool = pool as unknown as MockPool;

  beforeEach(() => {
    // Clear database before each test
    cleanupTestDatabase(mockPool);
  });

  afterAll(() => {
    cleanupTestDatabase(mockPool);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const result = await AuthService.register(userData);

      // Check returned data structure
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email', userData.email);
      expect(result.user).toHaveProperty('created_at');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password_hash');

      // Verify token is valid JWT
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      expect(decoded).toHaveProperty('userId', result.user.id);
      expect(decoded).toHaveProperty('email', userData.email);

      // Verify user was saved to database
      const users = mockPool.getUsers();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userData.email);
      expect(users[0].password_hash).toBeDefined();
      expect(users[0].password_hash).not.toBe(userData.password); // Password should be hashed
    });

    it('should hash the password before storing', async () => {
      const userData = {
        email: 'secure@example.com',
        password: 'plaintextpassword',
      };

      await AuthService.register(userData);

      const users = mockPool.getUsers();
      const storedUser = users[0];

      // Password should be hashed
      expect(storedUser.password_hash).not.toBe(userData.password);
      expect(storedUser.password_hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format

      // Verify the hash is valid
      const isValid = await bcrypt.compare(userData.password, storedUser.password_hash);
      expect(isValid).toBe(true);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
      };

      // Create existing user
      createTestUser(mockPool, userData.email);

      // Try to register with same email
      await expect(AuthService.register(userData)).rejects.toThrow(AppError);
      await expect(AuthService.register(userData)).rejects.toThrow('Email já está em uso');
    });

    it('should throw AppError with status 409 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      createTestUser(mockPool, userData.email);

      try {
        await AuthService.register(userData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(409);
      }
    });

    it('should generate valid JWT token with correct payload', async () => {
      const userData = {
        email: 'jwt@example.com',
        password: 'password123',
      };

      const result = await AuthService.register(userData);

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email', userData.email);
      expect(decoded).toHaveProperty('iat'); // Issued at
      expect(decoded).toHaveProperty('exp'); // Expiration
    });

    it('should set token expiration according to JWT_EXPIRES_IN', async () => {
      const userData = {
        email: 'expiry@example.com',
        password: 'password123',
      };

      const result = await AuthService.register(userData);

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 7 * 24 * 60 * 60; // 7 days

      // Allow 10 second margin for test execution
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 10);
    });
  });

  describe('login', () => {
    it('should successfully login with correct credentials', async () => {
      const password = 'correctpassword';
      const passwordHash = await bcrypt.hash(password, 10);
      const testUser = createTestUser(mockPool, 'login@example.com', passwordHash);

      const result = await AuthService.login({
        email: testUser.email,
        password,
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(testUser.id);
      expect(result.user.email).toBe(testUser.email);
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should return valid JWT token on successful login', async () => {
      const password = 'mypassword';
      const passwordHash = await bcrypt.hash(password, 10);
      const testUser = createTestUser(mockPool, 'token@example.com', passwordHash);

      const result = await AuthService.login({
        email: testUser.email,
        password,
      });

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
    });

    it('should throw error if user does not exist', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(AppError);

      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email ou senha inválidos');
    });

    it('should throw AppError with status 401 for nonexistent user', async () => {
      try {
        await AuthService.login({
          email: 'nobody@example.com',
          password: 'password123',
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
      }
    });

    it('should throw error if password is incorrect', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      const testUser = createTestUser(mockPool, 'user@example.com', passwordHash);

      await expect(
        AuthService.login({
          email: testUser.email,
          password: 'wrongpassword',
        })
      ).rejects.toThrow(AppError);

      await expect(
        AuthService.login({
          email: testUser.email,
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Email ou senha inválidos');
    });

    it('should throw AppError with status 401 for incorrect password', async () => {
      const passwordHash = await bcrypt.hash('rightpassword', 10);
      const testUser = createTestUser(mockPool, 'secure@example.com', passwordHash);

      try {
        await AuthService.login({
          email: testUser.email,
          password: 'wrongpassword',
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
      }
    });

    it('should not reveal whether email or password is wrong', async () => {
      // Both cases should return same error message
      const passwordHash = await bcrypt.hash('password123', 10);
      createTestUser(mockPool, 'user@example.com', passwordHash);

      let errorForWrongEmail: Error | undefined;
      let errorForWrongPassword: Error | undefined;

      try {
        await AuthService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
      } catch (error) {
        errorForWrongEmail = error as Error;
      }

      try {
        await AuthService.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        errorForWrongPassword = error as Error;
      }

      expect(errorForWrongEmail?.message).toBe(errorForWrongPassword?.message);
      expect(errorForWrongEmail?.message).toBe('Email ou senha inválidos');
    });
  });

  describe('getUserById', () => {
    it('should return user data when user exists', async () => {
      const testUser = createTestUser(mockPool, 'getuser@example.com');

      const result = await AuthService.getUserById(testUser.id);

      expect(result).toHaveProperty('id', testUser.id);
      expect(result).toHaveProperty('email', testUser.email);
      expect(result).toHaveProperty('created_at');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw error if user does not exist', async () => {
      await expect(AuthService.getUserById('nonexistent-id')).rejects.toThrow(AppError);
      await expect(AuthService.getUserById('nonexistent-id')).rejects.toThrow(
        'Usuário não encontrado'
      );
    });

    it('should throw AppError with status 404 for nonexistent user', async () => {
      try {
        await AuthService.getUserById('fake-user-id');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
      }
    });
  });

  describe('Security', () => {
    it('should never return password or password_hash in responses', async () => {
      // Test registration
      const registerResult = await AuthService.register({
        email: 'security1@example.com',
        password: 'password123',
      });
      expect(registerResult.user).not.toHaveProperty('password');
      expect(registerResult.user).not.toHaveProperty('password_hash');

      // Test login
      const passwordHash = await bcrypt.hash('password123', 10);
      const testUser = createTestUser(mockPool, 'security2@example.com', passwordHash);
      const loginResult = await AuthService.login({
        email: testUser.email,
        password: 'password123',
      });
      expect(loginResult.user).not.toHaveProperty('password');
      expect(loginResult.user).not.toHaveProperty('password_hash');

      // Test getUserById
      const getUserResult = await AuthService.getUserById(testUser.id);
      expect(getUserResult).not.toHaveProperty('password');
      expect(getUserResult).not.toHaveProperty('password_hash');
    });

    it('should use bcrypt with appropriate cost factor', async () => {
      const userData = {
        email: 'bcrypt@example.com',
        password: 'testpassword',
      };

      await AuthService.register(userData);

      const users = mockPool.getUsers();
      const hash = users[0].password_hash;

      // Check bcrypt format and cost factor
      // Format: $2a$10$... or $2b$10$...
      expect(hash).toMatch(/^\$2[ayb]\$10\$/);
    });

    it('should generate unique tokens for different users', async () => {
      const user1Result = await AuthService.register({
        email: 'user1@example.com',
        password: 'password123',
      });

      const user2Result = await AuthService.register({
        email: 'user2@example.com',
        password: 'password123',
      });

      expect(user1Result.token).not.toBe(user2Result.token);

      const decoded1 = jwt.verify(user1Result.token, process.env.JWT_SECRET!) as any;
      const decoded2 = jwt.verify(user2Result.token, process.env.JWT_SECRET!) as any;

      expect(decoded1.userId).not.toBe(decoded2.userId);
      expect(decoded1.email).not.toBe(decoded2.email);
    });

    it('should throw error if JWT_SECRET is not configured', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      await expect(
        AuthService.register({
          email: 'nosecret@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('JWT_SECRET not configured');

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(200) + '@example.com';
      const userData = {
        email: longEmail,
        password: 'password123',
      };

      const result = await AuthService.register(userData);
      expect(result.user.email).toBe(longEmail);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const userData = {
        email: 'special@example.com',
        password: specialPassword,
      };

      const result = await AuthService.register(userData);
      expect(result).toHaveProperty('token');

      // Verify login works with special characters
      const passwordHash = await bcrypt.hash(specialPassword, 10);
      const testUser = createTestUser(mockPool, 'special2@example.com', passwordHash);

      const loginResult = await AuthService.login({
        email: testUser.email,
        password: specialPassword,
      });
      expect(loginResult).toHaveProperty('token');
    });

    it('should handle email with different casing', async () => {
      const testUser = createTestUser(mockPool, 'CaseSensitive@Example.COM');

      // Note: Current implementation is case-sensitive
      // If you want case-insensitive, you'd need to update the service
      const result = await AuthService.getUserById(testUser.id);
      expect(result.email).toBe('CaseSensitive@Example.COM');
    });
  });
});
