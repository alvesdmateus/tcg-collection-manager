import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, AuthenticatedRequest, AuthTokenPayload } from '../types';

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header and attaches user info to request.
 * 
 * Flow:
 * 1. Extract token from "Bearer <token>" header
 * 2. Verify token signature and expiration
 * 3. Attach decoded user info to request object
 * 4. Continue to next middleware/route handler
 * 
 * Usage:
 * router.get('/protected', authenticate, handler);
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticação não fornecido', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Token de autenticação inválido', 401);
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expirado', 401));
    } else {
      next(error);
    }
  }
};