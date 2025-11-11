/**
 * Goods Receipt Notes API
 * Handles listing and creating GRNs
 */

import connectDB from '@/lib/mongodb';
import GoodsReceiptNote from '@/models/GoodsReceiptNote';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/grn
 * List all goods receipt notes
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
      const inspectionStatus = searchParams.get('inspectionStatus');
      const supplierId = searchParams.get('supplierId');
      const purchaseOrderId = searchParams.get('purchaseOrderId');
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

      if (inspectionStatus) {
        query.inspectionStatus = inspectionStatus;
      }

      if (supplierId) {
        query.supplierId = supplierId;
      }

      if (purchaseOrderId) {
        query.purchaseOrderId = purchaseOrderId;
      }

      // Date range filter
      if (startDate || endDate) {
        query.grnDate = {};
        if (startDate) query.grnDate.$gte = new Date(startDate);
        if (endDate) query.grnDate.$lte = new Date(endDate);
      }

      // Search functionality
      if (search) {
        query.$or = [
          { grnNumber: { $regex: search, $options: 'i' } },
          { deliveryNote: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await GoodsReceiptNote.countDocuments(query);

      // Get GRNs with pagination
      const grns = await GoodsReceiptNote.find(query)
        .populate('supplierId', 'supplierCode companyName email')
        .populate('purchaseOrderId', 'poNumber poDate')
        .populate('createdBy', 'name email')
        .populate('inspectedBy', 'name email')
        .sort({ grnDate: -1, grnNumber: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      logger.info('GRNs listed', {
        count: grns.length,
        userId: request.user._id,
      });

      return successResponse({
        grns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing GRNs', error);

      return errorResponse(
        'Failed to fetch goods receipt notes',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/grn
 * Create a new GRN
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Validate purchase order exists
      const purchaseOrder = await PurchaseOrder.findOne({
        _id: body.purchaseOrderId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!purchaseOrder) {
        return errorResponse('Purchase order not found', 404);
      }

      // Validate supplier exists
      const supplier = await Supplier.findOne({
        _id: body.supplierId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

      // Generate GRN number if not provided
      if (!body.grnNumber) {
        body.grnNumber = await GoodsReceiptNote.generateGRNNumber(
          request.user.organizationId,
          body.fiscalYear
        );
      }

      // Create GRN
      const grn = new GoodsReceiptNote({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
        status: 'draft',
      });

      await grn.save();

      // Populate references
      await grn.populate('supplierId', 'supplierCode companyName email');
      await grn.populate('purchaseOrderId', 'poNumber poDate');
      await grn.populate('createdBy', 'name email');

      logger.info('GRN created', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        userId: request.user._id,
      });

      return successResponse({ grn }, 'Goods receipt note created successfully', 201);
    } catch (error) {
      logger.error('Error creating GRN', error);

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
        return errorResponse('GRN number already exists', 400);
      }

      return errorResponse(
        'Failed to create goods receipt note',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
