import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import collectionsRoutes from './modules/collections/collections.routes';
import cardsRoutes from './modules/cards/cards.routes';

// Load environment variables
dotenv.config();

/**
 * Express Application Configuration
 * 
 * Middleware order matters:
 * 1. CORS - Must be first to handle preflight requests
 * 2. Body parsers - Parse request bodies
 * 3. Authentication - Verify JWT (applied per-route)
 * 4. Validation - Validate input (applied per-route)
 * 5. Route handlers - Business logic
 * 6. Error handler - Must be LAST
 */

const app: Application = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * CORS Configuration
 * Allows cross-origin requests from specified origins
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

/**
 * Body Parsers
 * Parse JSON and URL-encoded request bodies
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Request Logging (simple console logging for development)
 * In production, use proper logging library (Winston, Pino)
 */
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health Check Endpoint
 * Useful for monitoring and load balancers
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/cards', cardsRoutes);

/**
 * 404 Handler
 * Catch requests to undefined routes
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Global Error Handler
 * MUST be registered LAST after all other middleware and routes
 */
app.use(errorHandler);

export default app;