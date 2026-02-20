import { Response } from 'express';
import cardsService from './cards.service';
import scryfallService from './scryfall.service';
import { AuthenticatedRequest } from '../../types';

/**
 * Cards Controller
 * 
 * HTTP layer for card management endpoints.
 * All routes require authentication.
 */
class CardsController {
  /**
   * GET /api/collections/:collectionId/cards
   * Get all cards in a collection
   */
  async getCollectionCards(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { collectionId } = req.params;
    const userId = req.user!.userId;

    const limit = Math.min(parseInt(req.query.limit as string) || 500, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const { cards, total } = await cardsService.getCollectionCards(collectionId, userId, limit, offset);

    res.status(200).json({
      success: true,
      data: cards,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + cards.length < total,
      },
    });
  }

  /**
   * GET /api/cards/:id
   * Get card by ID
   */
  async getCardById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;

    const card = await cardsService.getCardById(id, userId);

    res.status(200).json({
      success: true,
      data: card,
    });
  }

  /**
   * POST /api/collections/:collectionId/cards
   * Add card to collection
   */
  async addCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { collectionId } = req.params;
    const userId = req.user!.userId;
    const { scryfall_id, owner_name, current_deck, is_borrowed, quantity, set_code, set_name } = req.body;

    const card = await cardsService.addCard(collectionId, userId, {
      scryfall_id,
      owner_name,
      current_deck,
      is_borrowed,
      quantity,
      set_code,
      set_name,
    });

    res.status(201).json({
      success: true,
      data: card,
    });
  }

  /**
   * PATCH /api/cards/:id
   * Update card
   */
  async updateCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { owner_name, current_deck, is_borrowed, quantity, set_code, set_name } = req.body;

    const card = await cardsService.updateCard(id, userId, {
      owner_name,
      current_deck,
      is_borrowed,
      quantity,
      set_code,
      set_name,
    });

    res.status(200).json({
      success: true,
      data: card,
    });
  }

  /**
   * DELETE /api/cards/:id
   * Delete card
   */
  async deleteCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;

    await cardsService.deleteCard(id, userId);

    res.status(200).json({
      success: true,
      message: 'Carta excluída com sucesso',
    });
  }

  /**
   * GET /api/cards/search
   * Search cards via Scryfall
   */
  async searchCards(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Parâmetro de busca "q" é obrigatório',
      });
      return;
    }

    const results = await scryfallService.searchCards(q);

    res.status(200).json({
      success: true,
      data: results,
    });
  }

  /**
   * GET /api/cards/autocomplete
   * Autocomplete card names
   */
  async autocomplete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Parâmetro de busca "q" é obrigatório',
      });
      return;
    }

    const results = await scryfallService.autocomplete(q);

    res.status(200).json({
      success: true,
      data: results,
    });
  }
}

export default new CardsController();