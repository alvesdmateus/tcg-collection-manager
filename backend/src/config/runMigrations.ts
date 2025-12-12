import { runMigrations } from './migrations';
import pool from './database';

/**
 * Migration Runner
 * 
 * Executes database migrations and closes the pool.
 * Run with: npm run migrate
 */
async function main(): Promise<void> {
  try {
    await runMigrations();
    console.log('✅ Migration script completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();