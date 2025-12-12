import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from '../types';

/**
 * Validation Middleware
 * 
 * Checks for validation errors from express-validator and returns 400 if found.
 * Must be called after validation chains in route definitions.
 * 
 * Usage:
 * router.post('/users',
 *   body('email').isEmail(),
 *   body('password').isLength({ min: 6 }),
 *   validate,
 *   handler
 * );
 */
export const validate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new AppError(errorMessages.join(', '), 400);
  }

  next();
};

/**
 * Validation Chain Executor
 * 
 * Executes an array of validation chains and then validates.
 * Cleaner alternative to listing validators separately.
 * 
 * Usage:
 * router.post('/users', validateRequest([
 *   body('email').isEmail().withMessage('Email inválido'),
 *   body('password').isLength({ min: 6 })
 * ]), handler);
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Execute all validations
    for (const validation of validations) {
      await validation.run(req);
    }

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join(', '), 400));
    }

    next();
  };
};