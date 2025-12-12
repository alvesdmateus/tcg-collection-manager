import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL Connection Pool Configuration
 * 
 * Uses environment variables for configuration.
 * Connection pooling improves performance by reusing connections.
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'tcg_collection',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  
  // Pool configuration for production performance
  max: 20,                        // Maximum connections in pool
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 2000,  // Fail fast if can't connect in 2s
});

// Log connection events in development
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.log('📦 Database connection established');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
  });
}

export default pool;