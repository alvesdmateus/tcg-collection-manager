import { Response } from 'express';
import collectionsService from './collections.service';
import { AuthenticatedRequest } from '../../types';

/**
 * Collections Controller
 * 
 * HTTP layer for collection management endpoints.
 * All routes require authentication.
 */
class CollectionsController {
  /**
   * GET /api/collections
   * Get all collections for authenticated user
   */
  async getUserCollections(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const userId = req.user!.userId;

    const collections = await collectionsService.getUserCollections(userId);

    res.status(200).json({
      success: true,
      data: collections,
    });
  }

  /**
   * GET /api/collections/:id
   * Get collection by ID
   */
  async getCollectionById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;

    const collection = await collectionsService.getCollectionById(id, userId);

    res.status(200).json({
      success: true,
      data: collection,
    });
  }

  /**
   * POST /api/collections
   * Create a new collection
   */
  async createCollection(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const userId = req.user!.userId;
    const { name, tcg_type } = req.body;

    const collection = await collectionsService.createCollection(userId, {
      name,
      tcg_type,
    });

    res.status(201).json({
      success: true,
      data: collection,
    });
  }

  /**
   * PATCH /api/collections/:id
   * Update a collection
   */
  async updateCollection(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { name, tcg_type } = req.body;

    const collection = await collectionsService.updateCollection(id, userId, {
      name,
      tcg_type,
    });

    res.status(200).json({
      success: true,
      data: collection,
    });
  }

  /**
   * DELETE /api/collections/:id
   * Delete a collection
   */
  async deleteCollection(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;

    await collectionsService.deleteCollection(id, userId);

    res.status(200).json({
      success: true,
      message: 'Coleção excluída com sucesso',
    });
  }

  /**
   * GET /api/collections/:id/stats
   * Get collection statistics
   */
  async getCollectionStats(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;

    const stats = await collectionsService.getCollectionStats(id, userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  }
}

export default new CollectionsController();