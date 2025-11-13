/**
 * Stocks API
 * Handles listing and creating stocks
 */

import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/stocks
 * List all stocks
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 50;
      const search = searchParams.get('search') || '';
      const isActive = searchParams.get('isActive');

      // Build query
      const query = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      // Add filters
      if (isActive !== null && isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      // Search functionality
      if (search) {
        query.$or = [
          { stockName: { $regex: search, $options: 'i' } },
          { hsCode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { saleType: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await Stock.countDocuments(query);

      // Get stocks with pagination
      const stocks = await Stock.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      logger.info('Stocks listed', {
        count: stocks.length,
        userId: request.user._id,
      });

      return successResponse(stocks, 'Stocks fetched successfully');
    } catch (error) {
      logger.error('Error listing stocks', error);

      return errorResponse(
        'Failed to fetch stocks',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/stocks
 * Create a new stock
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Create stock
      const stock = new Stock({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
      });

      await stock.save();

      // Populate references
      await stock.populate('createdBy', 'name email');

      logger.info('Stock created', {
        stockId: stock._id,
        stockName: stock.stockName,
        userId: request.user._id,
      });

      return successResponse({ stock }, 'Stock created successfully', 201);
    } catch (error) {
      logger.error('Error creating stock', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        'Failed to create stock',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
