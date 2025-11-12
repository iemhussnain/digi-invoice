/**
 * Single Purchase Order API
 * Handles get, update, delete operations for a specific purchase order
 */

import connectDB from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/purchase-orders/[id]
 * Get a single purchase order by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      const purchaseOrder = await PurchaseOrder.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('supplierId', 'supplierCode companyName contactPerson email phone mobile address')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('sentBy', 'name email')
        .populate('confirmedBy', 'name email')
        .populate('postedBy', 'name email')
        .populate('voucherId', 'voucherNumber voucherType voucherDate status')
        .lean();

      if (!purchaseOrder) {
        return errorResponse('Purchase order not found', 404);
      }

      logger.info('Purchase order retrieved', {
        purchaseOrderId: purchaseOrder._id,
        userId: request.user._id,
      });

      return successResponse({ purchaseOrder });
    } catch (error) {
      logger.error('Error fetching purchase order', error);

      return errorResponse(
        'Failed to fetch purchase order',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/purchase-orders/[id]
 * Update a purchase order
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();

      // Find purchase order
      const purchaseOrder = await PurchaseOrder.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!purchaseOrder) {
        return errorResponse('Purchase order not found', 404);
      }

      // Check if purchase order can be edited
      if (purchaseOrder.isPosted) {
        return errorResponse('Cannot edit posted purchase order', 400);
      }

      if (purchaseOrder.status === 'cancelled') {
        return errorResponse('Cannot edit cancelled purchase order', 400);
      }

      if (purchaseOrder.status === 'received') {
        return errorResponse('Cannot edit fully received purchase order', 400);
      }

      // Validate supplier if being changed
      if (body.supplierId && body.supplierId !== purchaseOrder.supplierId.toString()) {
        const supplier = await Supplier.findOne({
          _id: body.supplierId,
          organizationId: request.user.organizationId,
          isDeleted: false,
        });

        if (!supplier) {
          return errorResponse('Supplier not found', 404);
        }
      }

      // Fields that should not be updated directly
      const protectedFields = [
        '_id',
        'poNumber',
        'organizationId',
        'createdBy',
        'createdAt',
        'isPosted',
        'postedAt',
        'postedBy',
        'voucherId',
        'sentAt',
        'sentBy',
        'sentTo',
        'confirmedAt',
        'confirmedBy',
        'isDeleted',
        'deletedAt',
        'deletedBy',
      ];

      // Remove protected fields from update
      protectedFields.forEach((field) => delete body[field]);

      // Update purchase order
      Object.assign(purchaseOrder, body);
      purchaseOrder.updatedBy = request.user._id;

      await purchaseOrder.save();

      // Populate references
      await purchaseOrder.populate('supplierId', 'supplierCode companyName email');
      await purchaseOrder.populate('createdBy', 'name email');
      await purchaseOrder.populate('updatedBy', 'name email');

      logger.info('Purchase order updated', {
        purchaseOrderId: purchaseOrder._id,
        userId: request.user._id,
      });

      return successResponse({ purchaseOrder }, 'Purchase order updated successfully');
    } catch (error) {
      logger.error('Error updating purchase order', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        'Failed to update purchase order',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/purchase-orders/[id]
 * Soft delete a purchase order
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Find purchase order
      const purchaseOrder = await PurchaseOrder.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!purchaseOrder) {
        return errorResponse('Purchase order not found', 404);
      }

      // Check if purchase order can be deleted
      if (purchaseOrder.isPosted) {
        return errorResponse('Cannot delete posted purchase order', 400);
      }

      if (purchaseOrder.status === 'received' || purchaseOrder.status === 'partially_received') {
        return errorResponse('Cannot delete purchase order with received items', 400);
      }

      // Soft delete
      purchaseOrder.isDeleted = true;
      purchaseOrder.deletedAt = new Date();
      purchaseOrder.deletedBy = request.user._id;
      purchaseOrder.status = 'cancelled';

      await purchaseOrder.save();

      logger.info('Purchase order deleted', {
        purchaseOrderId: purchaseOrder._id,
        userId: request.user._id,
      });

      return successResponse({ purchaseOrder }, 'Purchase order deleted successfully');
    } catch (error) {
      logger.error('Error deleting purchase order', error);

      return errorResponse(
        'Failed to delete purchase order',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
