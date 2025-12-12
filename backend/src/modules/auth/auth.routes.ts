import { Router } from 'express';
import { body } from 'express-validator';
import authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * Authentication Routes
 * 
 * Public routes:
 * - POST /api/auth/register - Create new account
 * - POST /api/auth/login - Authenticate user
 * 
 * Protected routes:
 * - GET /api/auth/me - Get current user (requires JWT)
 */

/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Body:
 * - email: Valid email address
 * - password: Minimum 6 characters
 */
router.post(
  '/register',
  validateRequest([
    body('email')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter no mínimo 6 caracteres'),
  ]),
  asyncHandler(authController.register.bind(authController))
);

/**
 * POST /api/auth/login
 * Login user
 * 
 * Body:
 * - email: Registered email
 * - password: User password
 */
router.post(
  '/login',
  validateRequest([
    body('email')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Senha é obrigatória'),
  ]),
  asyncHandler(authController.login.bind(authController))
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * 
 * Requires: Authorization header with Bearer token
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser.bind(authController))
);

export default router;