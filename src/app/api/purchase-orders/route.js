/**
 * Purchase Orders API
 * Handles listing and creating purchase orders
 */

import connectDB from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/purchase-orders
 * List all purchase orders
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
      const supplierId = searchParams.get('supplierId');
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

      if (supplierId) {
        query.supplierId = supplierId;
      }

      // Date range filter
      if (startDate || endDate) {
        query.poDate = {};
        if (startDate) query.poDate.$gte = new Date(startDate);
        if (endDate) query.poDate.$lte = new Date(endDate);
      }

      // Search functionality
      if (search) {
        query.$or = [
          { poNumber: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await PurchaseOrder.countDocuments(query);

      // Get purchase orders with pagination
      const purchaseOrders = await PurchaseOrder.find(query)
        .populate('supplierId', 'supplierCode companyName email phone mobile')
        .populate('createdBy', 'name email')
        .populate('sentBy', 'name email')
        .sort({ poDate: -1, poNumber: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      logger.info('Purchase orders listed', {
        count: purchaseOrders.length,
        userId: request.user._id,
      });

      return successResponse({
        purchaseOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing purchase orders', error);

      return errorResponse(
        'Failed to fetch purchase orders',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/purchase-orders
 * Create a new purchase order
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Validate supplier exists
      const supplier = await Supplier.findOne({
        _id: body.supplierId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

      // Generate PO number if not provided
      if (!body.poNumber) {
        body.poNumber = await PurchaseOrder.generatePONumber(
          request.user.organizationId,
          body.fiscalYear
        );
      }

      // Create purchase order
      const purchaseOrder = new PurchaseOrder({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
        status: 'draft',
      });

      await purchaseOrder.save();

      // Populate references
      await purchaseOrder.populate('supplierId', 'supplierCode companyName email phone');
      await purchaseOrder.populate('createdBy', 'name email');

      logger.info('Purchase order created', {
        purchaseOrderId: purchaseOrder._id,
        poNumber: purchaseOrder.poNumber,
        userId: request.user._id,
      });

      return successResponse({ purchaseOrder }, 'Purchase order created successfully', 201);
    } catch (error) {
      logger.error('Error creating purchase order', error);

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
        return errorResponse('PO number already exists', 400);
      }

      return errorResponse(
        'Failed to create purchase order',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
