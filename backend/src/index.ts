import app from './app';
import pool from './config/database';

/**
 * Server Entry Point
 * 
 * Starts the Express server and connects to the database.
 * Handles graceful shutdown on process termination.
 */

const PORT = process.env.PORT || 3000;

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
  console.log('🚀 ======================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 ======================================');
  console.log('');
  console.log('📡 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`   GET  http://localhost:${PORT}/api/collections`);
  console.log(`   POST http://localhost:${PORT}/api/collections`);
  console.log('');
});

/**
 * Graceful Shutdown
 * 
 * Handles process termination signals (SIGTERM, SIGINT)
 * Closes database connections and server gracefully
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Close server
  server.close(async () => {
    console.log('✅ HTTP server closed');

    // Close database pool
    try {
      await pool.end();
      console.log('✅ Database connections closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing database:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});