import { pool } from '../../config/database';
import { Collection, CollectionStats, CreateCollectionRequest, UpdateCollectionRequest, AppError } from '../../types';

/**
 * Create a new collection
 */
export async function createCollection(
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
 * Get all collections for a user
 */
export async function getCollectionsByUser(userId: string): Promise<Collection[]> {
  const result = await pool.query<Collection>(
    'SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

/**
 * Get a single collection by ID
 * Best Practice: Verify ownership to prevent unauthorized access
 */
export async function getCollectionById(
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
 */
export async function updateCollection(
  collectionId: string,
  userId: string,
  data: UpdateCollectionRequest
): Promise<Collection> {
  // First verify ownership
  await getCollectionById(collectionId, userId);

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
 */
export async function deleteCollection(collectionId: string, userId: string): Promise<void> {
  // Verify ownership
  await getCollectionById(collectionId, userId);

  await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(
  collectionId: string, 
  userId: string
): Promise<CollectionStats> {
  // Verify ownership
  await getCollectionById(collectionId, userId);

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