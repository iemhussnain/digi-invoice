/**
 * GRN Inspection API
 * Completes inspection for a GRN
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import GoodsReceiptNote from '@/models/GoodsReceiptNote';
import PurchaseOrder from '@/models/PurchaseOrder';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/grn/[id]/inspect
 * Complete inspection for GRN and update PO
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    const session = await connectDB().then(() => mongoose.startSession());

    try {
      await session.startTransaction();

      const { id } = params;

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

      // Check if GRN can be inspected
      if (grn.status !== 'draft') {
        await session.abortTransaction();
        return errorResponse('Only draft GRNs can have inspection completed', 400);
      }

      // Validate all items have been inspected
      const uninspectedItems = grn.items.filter((item) => item.inspectionStatus === 'pending');
      if (uninspectedItems.length > 0) {
        await session.abortTransaction();
        return errorResponse('All items must be inspected before completing inspection', 400);
      }

      // Complete inspection
      await grn.completeInspection(request.user._id);
      await grn.save({ session });

      // Update PO received quantities
      const po = await PurchaseOrder.findOne({
        _id: grn.purchaseOrderId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      }).session(session);

      if (po) {
        // Update received quantities in PO based on accepted quantities
        grn.items.forEach((grnItem) => {
          const poItem = po.items.id(grnItem.poItemId);
          if (poItem) {
            // Add accepted quantity to received quantity
            poItem.receivedQuantity += grnItem.acceptedQuantity;
            // Update pending quantity
            poItem.pendingQuantity = poItem.quantity - poItem.receivedQuantity;
          }
        });

        await po.save({ session });
      }

      await session.commitTransaction();

      // Populate and return
      await grn.populate('supplierId', 'supplierCode companyName email');
      await grn.populate('purchaseOrderId', 'poNumber poDate');
      await grn.populate('inspectedBy', 'name email');

      logger.info('GRN inspection completed', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        userId: request.user._id,
      });

      return successResponse(
        { grn },
        'Inspection completed successfully and purchase order updated'
      );
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error completing GRN inspection', error);

      return errorResponse(
        error.message || 'Failed to complete inspection',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    } finally {
      session.endSession();
    }
  });
}
