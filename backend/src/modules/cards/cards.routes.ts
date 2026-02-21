import { Router } from 'express';
import { body, param, query } from 'express-validator';
import cardsController from './cards.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * Cards Routes
 * 
 * All routes require authentication (JWT token).
 * 
 * Collection Routes:
 * - POST   /api/collections/:collectionId/cards - Add card
 * - GET    /api/collections/:collectionId/cards - List cards
 * 
 * Card Routes:
 * - GET    /api/cards/:id        - Get card
 * - PATCH  /api/cards/:id        - Update card
 * - DELETE /api/cards/:id        - Delete card
 * 
 * Scryfall Routes:
 * - GET    /api/cards/search     - Search Scryfall
 * - GET    /api/cards/autocomplete - Autocomplete
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/cards/search
 * Search cards via Scryfall
 * 
 * Query params:
 * - q: Search query
 */
router.get(
  '/search',
  validateRequest([
    query('q')
      .notEmpty()
      .withMessage('Parâmetro de busca "q" é obrigatório')
      .isString()
      .withMessage('Parâmetro de busca deve ser texto'),
  ]),
  asyncHandler(cardsController.searchCards.bind(cardsController))
);

/**
 * GET /api/cards/autocomplete
 * Autocomplete card names
 * 
 * Query params:
 * - q: Partial card name
 */
router.get(
  '/autocomplete',
  validateRequest([
    query('q')
      .notEmpty()
      .withMessage('Parâmetro de busca "q" é obrigatório')
      .isString()
      .withMessage('Parâmetro de busca deve ser texto'),
  ]),
  asyncHandler(cardsController.autocomplete.bind(cardsController))
);

/**
 * GET /api/collections/:collectionId/cards
 * Get all cards in a collection
 */
router.get(
  '/collections/:collectionId/cards',
  validateRequest([
    param('collectionId').isUUID().withMessage('ID da coleção inválido'),
  ]),
  asyncHandler(cardsController.getCollectionCards.bind(cardsController))
);

/**
 * POST /api/collections/:collectionId/cards
 * Add card to collection
 * 
 * Body:
 * - scryfall_id: Scryfall card ID (required)
 * - owner_name: Physical card owner (required)
 * - current_deck: Deck assignment (optional)
 * - is_borrowed: Whether card is borrowed (optional, default false)
 */
router.post(
  '/collections/:collectionId/cards',
  validateRequest([
    param('collectionId').isUUID().withMessage('ID da coleção inválido'),
    body('scryfall_id')
      .notEmpty()
      .withMessage('ID do Scryfall é obrigatório')
      .isString()
      .withMessage('ID do Scryfall deve ser texto'),
    body('owner_name')
      .trim()
      .notEmpty()
      .withMessage('Nome do proprietário é obrigatório')
      .isLength({ max: 255 })
      .withMessage('Nome deve ter no máximo 255 caracteres'),
    body('current_deck')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Nome do deck deve ter no máximo 255 caracteres'),
    body('is_borrowed')
      .optional()
      .isBoolean()
      .withMessage('is_borrowed deve ser booleano'),
    body('is_foil')
      .optional()
      .isBoolean()
      .withMessage('is_foil deve ser booleano'),
    body('quantity')
      .optional()
      .toInt()
      .isInt({ min: 1 })
      .withMessage('Quantidade deve ser um número inteiro positivo'),
    body('set_code')
      .optional()
      .trim()
      .isLength({ max: 10 })
      .withMessage('Código do set deve ter no máximo 10 caracteres'),
    body('set_name')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Nome do set deve ter no máximo 255 caracteres'),
  ]),
  asyncHandler(cardsController.addCard.bind(cardsController))
);

/**
 * GET /api/cards/:id
 * Get card by ID
 */
router.get(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('ID da carta inválido'),
  ]),
  asyncHandler(cardsController.getCardById.bind(cardsController))
);

/**
 * PATCH /api/cards/:id
 * Update card
 * 
 * Body (all optional):
 * - owner_name: New owner name
 * - current_deck: New deck assignment (null to remove)
 * - is_borrowed: New borrowed status
 */
router.patch(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('ID da carta inválido'),
    body('owner_name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Nome não pode ser vazio')
      .isLength({ max: 255 })
      .withMessage('Nome deve ter no máximo 255 caracteres'),
    body('current_deck')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Nome do deck deve ter no máximo 255 caracteres'),
    body('is_borrowed')
      .optional()
      .isBoolean()
      .withMessage('is_borrowed deve ser booleano'),
    body('is_foil')
      .optional()
      .isBoolean()
      .withMessage('is_foil deve ser booleano'),
    body('quantity')
      .optional()
      .toInt()
      .isInt({ min: 1 })
      .withMessage('Quantidade deve ser um número inteiro positivo'),
    body('set_code')
      .optional()
      .trim()
      .isLength({ max: 10 })
      .withMessage('Código do set deve ter no máximo 10 caracteres'),
    body('set_name')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Nome do set deve ter no máximo 255 caracteres'),
  ]),
  asyncHandler(cardsController.updateCard.bind(cardsController))
);

/**
 * DELETE /api/cards/:id
 * Delete card
 */
router.delete(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('ID da carta inválido'),
  ]),
  asyncHandler(cardsController.deleteCard.bind(cardsController))
);

export default router;