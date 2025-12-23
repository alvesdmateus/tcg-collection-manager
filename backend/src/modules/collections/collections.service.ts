import pool from '../../config/database';
import { Collection, CollectionStats, CollectionWithStats, CreateCollectionRequest, UpdateCollectionRequest, AppError } from '../../types';
import scryfallService from '../cards/scryfall.service';

/**
 * Collections Service
 *
 * Business logic layer for collection management operations.
 * Handles CRUD operations and ownership validation.
 */
class CollectionsService {
  /**
   * Create a new collection
   *
   * @param userId - Owner's user ID
   * @param data - Collection name and TCG type
   * @returns Created collection
   */
  async createCollection(
    userId: string,
    data: CreateCollectionRequest
  ): Promise<Collection> {
    const result = await pool.query<Collection>(
      `INSERT INTO collections (user_id, name, tcg_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, data.name, data.tcg_type]
    );
    return result.rows[0];
  }

  /**
   * Get all collections for a user with card count and total value
   *
   * @param userId - User ID
   * @returns Array of user's collections with statistics
   */
  async getUserCollections(userId: string): Promise<CollectionWithStats[]> {
    const result = await pool.query<Collection>(
      'SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Enrich each collection with card count and total value
    const collectionsWithStats = await Promise.all(
      result.rows.map(async (collection) => {
        // Get card count (sum of quantities)
        const cardCountResult = await pool.query<{ total_cards: string }>(
          'SELECT COALESCE(SUM(quantity), 0) as total_cards FROM cards WHERE collection_id = $1',
          [collection.id]
        );
        const card_count = parseInt(cardCountResult.rows[0].total_cards, 10);

        // Get all cards with scryfall_ids to calculate total value
        const cardsResult = await pool.query<{ scryfall_id: string; quantity: number }>(
          'SELECT scryfall_id, quantity FROM cards WHERE collection_id = $1',
          [collection.id]
        );

        // Calculate total value by fetching prices from Scryfall
        let total_value = 0;
        await Promise.all(
          cardsResult.rows.map(async (card) => {
            try {
              const scryfallData = await scryfallService.getCardById(card.scryfall_id);
              const price = parseFloat(scryfallData.prices?.usd || scryfallData.prices?.usd_foil || '0');
              total_value += price * card.quantity;
            } catch (error) {
              // If Scryfall fetch fails, skip this card
              console.warn(`Failed to fetch price for card ${card.scryfall_id}`);
            }
          })
        );

        return {
          ...collection,
          card_count,
          total_value,
        };
      })
    );

    // Log cache statistics
    const cacheStats = scryfallService.getCacheStats();
    console.log(`📊 Scryfall Cache Stats: ${cacheStats.hits} hits, ${cacheStats.misses} misses (${cacheStats.hitRate} hit rate), ${cacheStats.size} entries cached`);

    return collectionsWithStats;
  }

  /**
   * Get a single collection by ID
   * Best Practice: Verify ownership to prevent unauthorized access
   *
   * @param collectionId - Collection ID
   * @param userId - User ID for ownership verification
   * @returns Collection data
   * @throws AppError if collection not found or user doesn't own it
   */
  async getCollectionById(
    collectionId: string,
    userId: string
  ): Promise<Collection> {
    const result = await pool.query<Collection>(
      'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
      [collectionId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Coleção não encontrada', 404);
    }

    return result.rows[0];
  }

  /**
   * Update a collection
   *
   * @param collectionId - Collection ID
   * @param userId - User ID for ownership verification
   * @param data - Fields to update
   * @returns Updated collection
   * @throws AppError if no fields to update or collection not found
   */
  async updateCollection(
    collectionId: string,
    userId: string,
    data: UpdateCollectionRequest
  ): Promise<Collection> {
    // First verify ownership
    await this.getCollectionById(collectionId, userId);

    const updates: string[] = [];
    const values: (string | undefined)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.tcg_type !== undefined) {
      updates.push(`tcg_type = $${paramIndex++}`);
      values.push(data.tcg_type);
    }

    if (updates.length === 0) {
      throw new AppError('Nenhum campo para atualizar', 400);
    }

    values.push(collectionId);

    const result = await pool.query<Collection>(
      `UPDATE collections SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete a collection
   * Note: Cascading delete will remove all cards in the collection
   *
   * @param collectionId - Collection ID
   * @param userId - User ID for ownership verification
   * @throws AppError if collection not found or user doesn't own it
   */
  async deleteCollection(collectionId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.getCollectionById(collectionId, userId);

    await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);
  }

  /**
   * Get collection statistics
   *
   * @param collectionId - Collection ID
   * @param userId - User ID for ownership verification
   * @returns Statistics about the collection (total cards, unique cards, borrowed cards)
   * @throws AppError if collection not found or user doesn't own it
   */
  async getCollectionStats(
    collectionId: string,
    userId: string
  ): Promise<CollectionStats> {
    // Verify ownership
    await this.getCollectionById(collectionId, userId);

    const result = await pool.query<{ total_cards: string; unique_cards: string; borrowed_cards: string }>(
      `SELECT
         COUNT(*) as total_cards,
         COUNT(DISTINCT scryfall_id) as unique_cards,
         COUNT(*) FILTER (WHERE is_borrowed = true) as borrowed_cards
       FROM cards
       WHERE collection_id = $1`,
      [collectionId]
    );

    const stats = result.rows[0];
    return {
      total_cards: parseInt(stats.total_cards, 10),
      unique_cards: parseInt(stats.unique_cards, 10),
      borrowed_cards: parseInt(stats.borrowed_cards, 10),
    };
  }
}

export default new CollectionsService();
