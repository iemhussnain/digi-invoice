/**
 * Purchase Invoices API
 * Handles CRUD operations for purchase invoices
 */

import connectDB from '@/lib/mongodb';
import PurchaseInvoice from '@/models/PurchaseInvoice';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/purchase-invoices
 * List all purchase invoices with filtering and pagination
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      // Filter by status
      if (searchParams.get('status')) {
        filter.status = searchParams.get('status');
      }

      // Filter by matching status
      if (searchParams.get('matchingStatus')) {
        filter.matchingStatus = searchParams.get('matchingStatus');
      }

      // Filter by supplier
      if (searchParams.get('supplierId')) {
        filter.supplierId = searchParams.get('supplierId');
      }

      // Filter by date range
      if (searchParams.get('fromDate') || searchParams.get('toDate')) {
        filter.invoiceDate = {};
        if (searchParams.get('fromDate')) {
          filter.invoiceDate.$gte = new Date(searchParams.get('fromDate'));
        }
        if (searchParams.get('toDate')) {
          filter.invoiceDate.$lte = new Date(searchParams.get('toDate'));
        }
      }

      // Search by invoice number
      if (searchParams.get('search')) {
        filter.invoiceNumber = {
          $regex: searchParams.get('search'),
          $options: 'i',
        };
      }

      // Get invoices with pagination
      const [purchaseInvoices, total] = await Promise.all([
        PurchaseInvoice.find(filter)
          .populate('supplierId', 'supplierCode companyName')
          .populate('purchaseOrderId', 'poNumber')
          .populate('grnId', 'grnNumber')
          .sort({ invoiceDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PurchaseInvoice.countDocuments(filter),
      ]);

      return successResponse({
        purchaseInvoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching purchase invoices', error);

      return errorResponse(
        'Failed to fetch purchase invoices',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/purchase-invoices
 * Create a new purchase invoice
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Validate required fields
      if (!body.invoiceNumber) {
        return errorResponse('Invoice number is required', 400);
      }

      if (!body.purchaseOrderId) {
        return errorResponse('Purchase order is required', 400);
      }

      if (!body.grnId) {
        return errorResponse('Goods receipt note is required', 400);
      }

      if (!body.supplierId) {
        return errorResponse('Supplier is required', 400);
      }

      if (!body.items || body.items.length === 0) {
        return errorResponse('At least one item is required', 400);
      }

      // Create purchase invoice
      const purchaseInvoice = new PurchaseInvoice({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
      });

      await purchaseInvoice.save();

      // Populate references
      await purchaseInvoice.populate('supplierId', 'supplierCode companyName email phone');
      await purchaseInvoice.populate('purchaseOrderId', 'poNumber poDate');
      await purchaseInvoice.populate('grnId', 'grnNumber grnDate');
      await purchaseInvoice.populate('createdBy', 'name email');

      logger.info('Purchase invoice created', {
        purchaseInvoiceId: purchaseInvoice._id,
        invoiceNumber: purchaseInvoice.invoiceNumber,
        userId: request.user._id,
      });

      return successResponse(
        { purchaseInvoice },
        'Purchase invoice created successfully',
        201
      );
    } catch (error) {
      logger.error('Error creating purchase invoice', error);

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
        return errorResponse('Invoice number already exists', 400);
      }

      return errorResponse(
        error.message || 'Failed to create purchase invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
