import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/database';
import {
  UserCreateDto,
  UserLoginDto,
  UserResponseDto,
  AuthResponse,
  AuthTokenPayload,
  AppError,
} from '../../types';

/**
 * Authentication Service
 * 
 * Business logic layer for authentication operations.
 * Handles password hashing, JWT generation, and user validation.
 * 
 * Security:
 * - Bcrypt with 10 salt rounds for password hashing
 * - JWT tokens with configurable expiration
 * - Email uniqueness enforced at database level
 */
class AuthService {
  /**
   * Register a new user
   * 
   * @param userData - Email and password
   * @returns JWT token and user data (without password)
   * @throws AppError if email already exists
   */
  async register(userData: UserCreateDto): Promise<AuthResponse> {
    const { email, password } = userData;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Email já está em uso', 409);
    }

    // Hash password (10 salt rounds is secure and performant)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    };
  }

  /**
   * Login user
   * 
   * @param credentials - Email and password
   * @returns JWT token and user data
   * @throws AppError if credentials are invalid
   */
  async login(credentials: UserLoginDto): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    };
  }

  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @returns User data (without password)
   * @throws AppError if user not found
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return result.rows[0];
  }

  /**
   * Generate JWT token
   * 
   * @param payload - User ID and email
   * @returns Signed JWT token
   * @private
   */
  private generateToken(payload: AuthTokenPayload): string {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(payload, jwtSecret, { 
      expiresIn: jwtExpiresIn
    } as jwt.SignOptions);
  }
}

export default new AuthService();