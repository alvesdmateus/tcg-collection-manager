import { Response } from 'express';
import authService from './auth.service';
import { AuthenticatedRequest } from '../../types';

/**
 * Authentication Controller
 * 
 * HTTP layer for authentication endpoints.
 * Thin controller that delegates to service layer.
 * 
 * Responsibilities:
 * - Extract data from HTTP request
 * - Call service methods
 * - Format HTTP response
 * - Handle errors (via global error handler)
 */
class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password } = req.body;

    const result = await authService.register({ email, password });

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   * Requires authentication
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
      return;
    }

    const user = await authService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
}

export default new AuthController();