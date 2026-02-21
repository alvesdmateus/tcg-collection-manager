import pool from '../../config/database';
import collectionsService from '../collections/collections.service';
import scryfallService from './scryfall.service';
import { Card, AddCardRequest, UpdateCardRequest, AppError, CardWithDetails } from '../../types';

/**
 * Cards Service
 *
 * Business logic layer for card management operations.
 * Handles CRUD operations, ownership validation, and Scryfall integration.
 */
class CardsService {
  /**
   * Get all cards in a collection with Scryfall data enrichment
   *
   * @param collectionId - Collection ID
   * @param userId - User ID for ownership verification
   * @returns Array of cards with Scryfall details
   */
  async getCollectionCards(
    collectionId: string,
    userId: string,
    limit = 500,
    offset = 0
  ): Promise<{ cards: CardWithDetails[]; total: number }> {
    // Verify collection ownership
    await collectionsService.getCollectionById(collectionId, userId);

    const [result, countResult] = await Promise.all([
      pool.query<Card>(
        'SELECT * FROM cards WHERE collection_id = $1 ORDER BY added_at DESC LIMIT $2 OFFSET $3',
        [collectionId, limit, offset]
      ),
      pool.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM cards WHERE collection_id = $1',
        [collectionId]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    // Enrich cards with Scryfall data
    const cards = await Promise.all(
      result.rows.map(async (card) => {
        try {
          const scryfallData = await scryfallService.getCardById(card.scryfall_id);
          return { ...card, scryfall_data: scryfallData };
        } catch (error) {
          console.warn(`Failed to fetch Scryfall data for card ${card.id}:`, error);
          return { ...card, scryfall_data: null };
        }
      })
    );

    return { cards, total };
  }

  /**
   * Get a single card by ID with Scryfall data
   *
   * @param cardId - Card ID
   * @param userId - User ID for ownership verification
   * @returns Card with Scryfall details
   */
  async getCardById(cardId: string, userId: string): Promise<CardWithDetails> {
    const result = await pool.query<Card>(
      `SELECT c.* FROM cards c
       INNER JOIN collections col ON c.collection_id = col.id
       WHERE c.id = $1 AND col.user_id = $2`,
      [cardId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Carta não encontrada', 404);
    }

    const card = result.rows[0];

    // Enrich with Scryfall data
    try {
      const scryfallData = await scryfallService.getCardById(card.scryfall_id);
      return {
        ...card,
        scryfall_data: scryfallData,
      };
    } catch (error) {
      console.warn(`Failed to fetch Scryfall data for card ${card.id}:`, error);
      return {
        ...card,
        scryfall_data: null,
      };
    }
  }

  /**
   * Add a card to a collection
   *
   * @param collectionId - Collection ID
   * @param userId - User ID for ownership verification
   * @param data - Card data (scryfall_id, owner_name, etc.)
   * @returns Created card with Scryfall details
   */
  async addCard(
    collectionId: string,
    userId: string,
    data: AddCardRequest
  ): Promise<CardWithDetails> {
    // Debug logging
    console.log('📝 Adding card with data:', JSON.stringify(data, null, 2));
    console.log('📊 Quantity value:', data.quantity, 'Type:', typeof data.quantity);

    // Verify collection ownership
    await collectionsService.getCollectionById(collectionId, userId);

    // Verify card exists in Scryfall
    const scryfallData = await scryfallService.getCardById(data.scryfall_id);

    // Extract USD price from Scryfall data
    const priceUsd = parseFloat(scryfallData.prices?.usd || scryfallData.prices?.usd_foil || '0') || 0;

    // Detect foil: if user didn't specify, default based on Scryfall prices
    const isFoil = data.is_foil ?? (!scryfallData.prices?.usd && !!scryfallData.prices?.usd_foil);

    // Insert card
    const result = await pool.query<Card>(
      `INSERT INTO cards (collection_id, scryfall_id, owner_name, current_deck, is_borrowed, is_foil, quantity, set_code, set_name, price_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        collectionId,
        data.scryfall_id,
        data.owner_name,
        data.current_deck || null,
        data.is_borrowed || false,
        isFoil,
        data.quantity || 1,
        data.set_code || scryfallData.set || null,
        data.set_name || scryfallData.set_name || null,
        priceUsd,
      ]
    );

    return {
      ...result.rows[0],
      scryfall_data: scryfallData,
    };
  }

  /**
   * Update a card
   *
   * @param cardId - Card ID
   * @param userId - User ID for ownership verification
   * @param data - Fields to update
   * @returns Updated card with Scryfall details
   */
  async updateCard(
    cardId: string,
    userId: string,
    data: UpdateCardRequest
  ): Promise<CardWithDetails> {
    // Verify ownership
    const existingCard = await this.getCardById(cardId, userId);

    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (data.owner_name !== undefined) {
      updates.push(`owner_name = $${paramIndex++}`);
      values.push(data.owner_name);
    }

    if (data.current_deck !== undefined) {
      updates.push(`current_deck = $${paramIndex++}`);
      values.push(data.current_deck || null);
    }

    if (data.is_borrowed !== undefined) {
      updates.push(`is_borrowed = $${paramIndex++}`);
      values.push(data.is_borrowed);
    }

    if (data.is_foil !== undefined) {
      updates.push(`is_foil = $${paramIndex++}`);
      values.push(data.is_foil);
    }

    if (data.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(data.quantity);
    }

    if (data.set_code !== undefined) {
      updates.push(`set_code = $${paramIndex++}`);
      values.push(data.set_code || null);
    }

    if (data.set_name !== undefined) {
      updates.push(`set_name = $${paramIndex++}`);
      values.push(data.set_name || null);
    }

    if (updates.length === 0) {
      throw new AppError('Nenhum campo para atualizar', 400);
    }

    values.push(cardId);

    const result = await pool.query<Card>(
      `UPDATE cards SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return {
      ...result.rows[0],
      scryfall_data: existingCard.scryfall_data,
    };
  }

  /**
   * Delete a card
   *
   * @param cardId - Card ID
   * @param userId - User ID for ownership verification
   */
  async deleteCard(cardId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.getCardById(cardId, userId);

    await pool.query('DELETE FROM cards WHERE id = $1', [cardId]);
  }

  /**
   * Import a deck list (bulk add cards by name)
   *
   * @param collectionId - Collection ID
   * @param userId - User ID for ownership verification
   * @param entries - Array of { name, quantity } parsed from deck list
   * @param ownerName - Owner name for all imported cards
   * @returns Imported cards and failed entries
   */
  async importDeckList(
    collectionId: string,
    userId: string,
    entries: { name: string; quantity: number }[],
    ownerName: string
  ): Promise<{ imported: CardWithDetails[]; failed: { name: string; reason: string }[] }> {
    // Verify collection ownership
    await collectionsService.getCollectionById(collectionId, userId);

    const imported: CardWithDetails[] = [];
    const failed: { name: string; reason: string }[] = [];

    for (const entry of entries) {
      try {
        const scryfallData = await scryfallService.getCardByName(entry.name);
        const priceUsd = parseFloat(scryfallData.prices?.usd || scryfallData.prices?.usd_foil || '0') || 0;

        const result = await pool.query<Card>(
          `INSERT INTO cards (collection_id, scryfall_id, owner_name, quantity, set_code, set_name, price_usd)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            collectionId,
            scryfallData.id,
            ownerName,
            entry.quantity,
            scryfallData.set,
            scryfallData.set_name,
            priceUsd,
          ]
        );

        imported.push({ ...result.rows[0], scryfall_data: scryfallData });
      } catch (error: any) {
        failed.push({ name: entry.name, reason: error.message || 'Card not found' });
      }
    }

    return { imported, failed };
  }
}

export default new CardsService();
