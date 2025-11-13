/**
 * Individual Stock API
 * Handles fetching, updating, and deleting a single stock
 */

import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/stocks/[id]
 * Get a single stock by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      const stock = await Stock.findOne({
        _id: id,
        organizationId: request.user.organizationId,
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .lean();

      if (!stock) {
        return errorResponse('Stock not found', 404);
      }

      return successResponse({ stock });
    } catch (error) {
      logger.error('Error fetching stock', error);

      return errorResponse(
        'Failed to fetch stock',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/stocks/[id]
 * Update a stock
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();

      // Find and update stock
      const stock = await Stock.findOneAndUpdate(
        {
          _id: id,
          organizationId: request.user.organizationId,
        },
        {
          ...body,
          updatedBy: request.user._id,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!stock) {
        return errorResponse('Stock not found', 404);
      }

      logger.info('Stock updated', {
        stockId: stock._id,
        userId: request.user._id,
      });

      return successResponse({ stock }, 'Stock updated successfully');
    } catch (error) {
      logger.error('Error updating stock', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        'Failed to update stock',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/stocks/[id]
 * Soft delete a stock
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Soft delete the stock
      const stock = await Stock.findOneAndUpdate(
        {
          _id: id,
          organizationId: request.user.organizationId,
        },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: request.user._id,
        },
        { new: true }
      );

      if (!stock) {
        return errorResponse('Stock not found', 404);
      }

      logger.info('Stock deleted', {
        stockId: stock._id,
        userId: request.user._id,
      });

      return successResponse(null, 'Stock deleted successfully');
    } catch (error) {
      logger.error('Error deleting stock', error);

      return errorResponse(
        'Failed to delete stock',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
