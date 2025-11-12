/**
 * Health Check API
 * Tests database connection and system health
 */

import connectDB from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

export async function GET() {
  try {
    // Test MongoDB connection
    const conn = await connectDB();

    const dbStatus = conn.connection.readyState === 1 ? 'connected' : 'disconnected';

    logger.success('Health check successful', { dbStatus });

    return successResponse({
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }, 'System is healthy');

  } catch (error) {
    logger.error('Health check failed', error);

    return errorResponse(
      'System health check failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
