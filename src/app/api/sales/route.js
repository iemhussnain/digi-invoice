/**
 * Walk-in Sales API
 * Handles listing and creating walk-in sales
 */

import connectDB from '@/lib/mongodb';
import WalkInSale from '@/models/WalkInSale';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/sales
 * List all walk-in sales
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 50;
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status');
      const paymentMethod = searchParams.get('paymentMethod');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Build query
      const query = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      // Add filters
      if (status) {
        query.status = status;
      }

      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }

      // Date range filter
      if (startDate || endDate) {
        query.saleDate = {};
        if (startDate) query.saleDate.$gte = new Date(startDate);
        if (endDate) query.saleDate.$lte = new Date(endDate);
      }

      // Search functionality
      if (search) {
        query.$or = [
          { receiptNumber: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await WalkInSale.countDocuments(query);

      // Get sales with pagination
      const sales = await WalkInSale.find(query)
        .populate('createdBy', 'name email')
        .populate('voucherId', 'voucherNumber')
        .sort({ saleDate: -1, receiptNumber: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      logger.info('Walk-in sales listed', {
        count: sales.length,
        userId: request.user._id,
      });

      return successResponse({
        sales,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing walk-in sales', error);

      return errorResponse(
        'Failed to fetch sales',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/sales
 * Create a new walk-in sale
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Generate receipt number if not provided
      if (!body.receiptNumber) {
        body.receiptNumber = await WalkInSale.generateReceiptNumber(
          request.user.organizationId,
          body.fiscalYear
        );
      }

      // Create sale
      const sale = new WalkInSale({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
        status: 'completed',
      });

      await sale.save();

      // Populate references
      await sale.populate('createdBy', 'name email');

      logger.info('Walk-in sale created', {
        saleId: sale._id,
        receiptNumber: sale.receiptNumber,
        userId: request.user._id,
      });

      return successResponse({ sale }, 'Sale created successfully', 201);
    } catch (error) {
      logger.error('Error creating walk-in sale', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      // Handle duplicate key error
      if (error.code === 11000) {
        return errorResponse('Receipt number already exists', 400);
      }

      return errorResponse(
        'Failed to create sale',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
