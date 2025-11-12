/**
 * Single GRN API
 * Handles get, update, delete operations for a specific GRN
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import GoodsReceiptNote from '@/models/GoodsReceiptNote';
import PurchaseOrder from '@/models/PurchaseOrder';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/grn/[id]
 * Get a single GRN by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      const grn = await GoodsReceiptNote.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('supplierId', 'supplierCode companyName contactPerson email phone')
        .populate('purchaseOrderId', 'poNumber poDate deliveryDate')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('inspectedBy', 'name email')
        .populate('postedBy', 'name email')
        .lean();

      if (!grn) {
        return errorResponse('Goods receipt note not found', 404);
      }

      logger.info('GRN retrieved', {
        grnId: grn._id,
        userId: request.user._id,
      });

      return successResponse({ grn });
    } catch (error) {
      logger.error('Error fetching GRN', error);

      return errorResponse(
        'Failed to fetch goods receipt note',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/grn/[id]
 * Update a GRN
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    const session = await connectDB().then(() => mongoose.startSession());

    try {
      await session.startTransaction();

      const { id } = params;
      const body = await request.json();

      // Find GRN
      const grn = await GoodsReceiptNote.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      }).session(session);

      if (!grn) {
        await session.abortTransaction();
        return errorResponse('Goods receipt note not found', 404);
      }

      // Check if GRN can be edited
      if (grn.isPosted) {
        await session.abortTransaction();
        return errorResponse('Cannot edit posted GRN', 400);
      }

      if (grn.status === 'cancelled') {
        await session.abortTransaction();
        return errorResponse('Cannot edit cancelled GRN', 400);
      }

      // Fields that should not be updated directly
      const protectedFields = [
        '_id',
        'grnNumber',
        'organizationId',
        'purchaseOrderId',
        'createdBy',
        'createdAt',
        'isPosted',
        'postedAt',
        'postedBy',
        'voucherId',
        'isDeleted',
        'deletedAt',
        'deletedBy',
      ];

      // Remove protected fields from update
      protectedFields.forEach((field) => delete body[field]);

      // Update GRN
      Object.assign(grn, body);
      grn.updatedBy = request.user._id;

      await grn.save({ session });

      // Update PO received quantities if items changed
      if (body.items && grn.purchaseOrderId) {
        const po = await PurchaseOrder.findById(grn.purchaseOrderId).session(session);

        if (po) {
          // Update received quantities in PO
          grn.items.forEach((grnItem) => {
            const poItem = po.items.id(grnItem.poItemId);
            if (poItem) {
              // Calculate total received for this PO item from all GRNs
              // For now, we'll just add the accepted quantity
              // In production, you'd want to query all GRNs for this PO item
              poItem.receivedQuantity = grnItem.acceptedQuantity;
            }
          });

          await po.save({ session });
        }
      }

      await session.commitTransaction();

      // Populate references
      await grn.populate('supplierId', 'supplierCode companyName email');
      await grn.populate('purchaseOrderId', 'poNumber poDate');
      await grn.populate('createdBy', 'name email');
      await grn.populate('updatedBy', 'name email');

      logger.info('GRN updated', {
        grnId: grn._id,
        userId: request.user._id,
      });

      return successResponse({ grn }, 'Goods receipt note updated successfully');
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error updating GRN', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        'Failed to update goods receipt note',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    } finally {
      session.endSession();
    }
  });
}

/**
 * DELETE /api/grn/[id]
 * Soft delete a GRN
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Find GRN
      const grn = await GoodsReceiptNote.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!grn) {
        return errorResponse('Goods receipt note not found', 404);
      }

      // Check if GRN can be deleted
      if (grn.isPosted) {
        return errorResponse('Cannot delete posted GRN', 400);
      }

      // Soft delete
      grn.isDeleted = true;
      grn.deletedAt = new Date();
      grn.deletedBy = request.user._id;
      grn.status = 'cancelled';

      await grn.save();

      logger.info('GRN deleted', {
        grnId: grn._id,
        userId: request.user._id,
      });

      return successResponse({ grn }, 'Goods receipt note deleted successfully');
    } catch (error) {
      logger.error('Error deleting GRN', error);

      return errorResponse(
        'Failed to delete goods receipt note',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
