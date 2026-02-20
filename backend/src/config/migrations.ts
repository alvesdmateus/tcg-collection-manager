import pool from './database';

/**
 * Database Migrations
 * 
 * This file contains all database schema definitions.
 * Run with: npm run migrate
 * 
 * Design decisions:
 * - UUID primary keys for security and scalability
 * - Cascading deletes to maintain referential integrity
 * - Indexes on foreign keys for query performance
 * - TIMESTAMP for timezone-aware dates
 */

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migrations...');

    // Enable UUID extension
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    console.log('✅ UUID extension enabled');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ Users email index created');

    // Create collections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        tcg_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Collections table created');

    // Create index on user_id for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
    `);
    console.log('✅ Collections user_id index created');

    // Create cards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        scryfall_id VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        current_deck VARCHAR(255),
        is_borrowed BOOLEAN DEFAULT false,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Cards table created');

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cards_collection_id ON cards(collection_id);
    `);
    console.log('✅ Cards collection_id index created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cards_scryfall_id ON cards(scryfall_id);
    `);
    console.log('✅ Cards scryfall_id index created');

    // Composite index for duplicate-check queries (collection_id + scryfall_id)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cards_collection_scryfall ON cards(collection_id, scryfall_id);
    `);
    console.log('✅ Cards composite collection_id+scryfall_id index created');

    // Index for ORDER BY added_at DESC (default sort)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cards_added_at ON cards(added_at DESC);
    `);
    console.log('✅ Cards added_at index created');

    // Index for filtering borrowed cards
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cards_is_borrowed ON cards(is_borrowed);
    `);
    console.log('✅ Cards is_borrowed index created');

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rollback all tables (use with caution!)
 */
export async function rollbackMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🔄 Rolling back migrations...');

    await client.query('DROP TABLE IF EXISTS cards CASCADE;');
    await client.query('DROP TABLE IF EXISTS collections CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');

    console.log('✅ All tables dropped');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}