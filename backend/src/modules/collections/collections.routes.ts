import { Router } from 'express';
import { body, param } from 'express-validator';
import collectionsController from './collections.controller';
import cardsController from '../cards/cards.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { TcgType } from '../../types';

const router = Router();

/**
 * Collections Routes
 * 
 * All routes require authentication (JWT token).
 * 
 * Routes:
 * - GET    /api/collections          - List user's collections
 * - POST   /api/collections          - Create collection
 * - GET    /api/collections/:id      - Get collection
 * - PATCH  /api/collections/:id      - Update collection
 * - DELETE /api/collections/:id      - Delete collection
 * - GET    /api/collections/:id/stats - Get statistics
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/collections
 * Get all collections for authenticated user
 */
router.get(
  '/',
  asyncHandler(collectionsController.getUserCollections.bind(collectionsController))
);

/**
 * GET /api/collections/:id
 * Get specific collection
 */
router.get(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('ID da coleção inválido'),
  ]),
  asyncHandler(collectionsController.getCollectionById.bind(collectionsController))
);

/**
 * POST /api/collections
 * Create a new collection
 * 
 * Body:
 * - name: Collection name (required)
 * - tcg_type: Type of TCG (magic, pokemon, yugioh)
 */
router.post(
  '/',
  validateRequest([
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Nome da coleção é obrigatório')
      .isLength({ max: 255 })
      .withMessage('Nome deve ter no máximo 255 caracteres'),
    body('tcg_type')
      .isIn(Object.values(TcgType))
      .withMessage('Tipo de TCG inválido (magic, pokemon, yugioh)'),
  ]),
  asyncHandler(collectionsController.createCollection.bind(collectionsController))
);

/**
 * PATCH /api/collections/:id
 * Update a collection
 * 
 * Body (all optional):
 * - name: New collection name
 * - tcg_type: New TCG type
 */
router.patch(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('ID da coleção inválido'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Nome não pode ser vazio')
      .isLength({ max: 255 })
      .withMessage('Nome deve ter no máximo 255 caracteres'),
    body('tcg_type')
      .optional()
      .isIn(Object.values(TcgType))
      .withMessage('Tipo de TCG inválido'),
  ]),
  asyncHandler(collectionsController.updateCollection.bind(collectionsController))
);

/**
 * DELETE /api/collections/:id
 * Delete a collection (and all its cards via CASCADE)
 */
router.delete(
  '/:id',
  validateRequest([
    param('id').isUUID().withMessage('ID da coleção inválido'),
  ]),
  asyncHandler(collectionsController.deleteCollection.bind(collectionsController))
);

/**
 * GET /api/collections/:id/stats
 * Get collection statistics
 */
router.get(
  '/:id/stats',
  validateRequest([
    param('id').isUUID().withMessage('ID da coleção inválido'),
  ]),
  asyncHandler(collectionsController.getCollectionStats.bind(collectionsController))
);

/**
 * GET /api/collections/:collectionId/cards
 * Get all cards in a collection
 */
router.get(
  '/:collectionId/cards',
  validateRequest([
    param('collectionId').isUUID().withMessage('ID da coleção inválido'),
  ]),
  asyncHandler(cardsController.getCollectionCards.bind(cardsController))
);

/**
 * POST /api/collections/:collectionId/cards/import
 * Import a deck list (bulk add cards by name)
 *
 * Body:
 * - entries: Array of { name, quantity }
 * - owner_name: Owner name for all imported cards
 */
router.post(
  '/:collectionId/cards/import',
  validateRequest([
    param('collectionId').isUUID().withMessage('ID da coleção inválido'),
    body('entries')
      .isArray({ min: 1 })
      .withMessage('Lista de cartas é obrigatória'),
    body('entries.*.name')
      .notEmpty()
      .withMessage('Nome da carta é obrigatório'),
    body('entries.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantidade deve ser um número inteiro positivo'),
    body('owner_name')
      .trim()
      .notEmpty()
      .withMessage('Nome do proprietário é obrigatório'),
  ]),
  asyncHandler(cardsController.importDeckList.bind(cardsController))
);

/**
 * POST /api/collections/:collectionId/cards
 * Add card to collection
 */
router.post(
  '/:collectionId/cards',
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

export default router;