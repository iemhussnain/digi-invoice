/**
 * Create GRN from Purchase Order API
 * Generates GRN pre-filled with PO details
 */

import connectDB from '@/lib/mongodb';
import GoodsReceiptNote from '@/models/GoodsReceiptNote';
import PurchaseOrder from '@/models/PurchaseOrder';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/grn/from-po/[poId]
 * Create GRN from purchase order
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { poId } = params;

      // Find purchase order
      const purchaseOrder = await PurchaseOrder.findOne({
        _id: poId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!purchaseOrder) {
        return errorResponse('Purchase order not found', 404);
      }

      // Check if PO can receive goods
      if (purchaseOrder.status === 'draft') {
        return errorResponse('Purchase order must be sent or confirmed before receiving goods', 400);
      }

      if (purchaseOrder.status === 'cancelled') {
        return errorResponse('Cannot receive goods for cancelled purchase order', 400);
      }

      if (purchaseOrder.status === 'received') {
        return errorResponse('All items have already been received for this purchase order', 400);
      }

      // Generate GRN number
      const grnNumber = await GoodsReceiptNote.generateGRNNumber(
        request.user.organizationId,
        purchaseOrder.fiscalYear
      );

      // Prepare GRN items from PO items (only pending items)
      const grnItems = purchaseOrder.items
        .filter((item) => item.pendingQuantity > 0)
        .map((item) => ({
          poItemId: item._id,
          description: item.description,
          orderedQuantity: item.quantity,
          receivedQuantity: item.pendingQuantity, // Default to all pending
          acceptedQuantity: 0, // Will be set during inspection
          rejectedQuantity: 0,
          unit: item.unit,
          rate: item.rate,
          inspectionStatus: 'pending',
        }));

      if (grnItems.length === 0) {
        return errorResponse('No pending items to receive for this purchase order', 400);
      }

      // Create GRN
      const grn = new GoodsReceiptNote({
        grnNumber,
        grnDate: new Date(),
        purchaseOrderId: purchaseOrder._id,
        supplierId: purchaseOrder.supplierId,
        items: grnItems,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
        status: 'draft',
        fiscalYear: purchaseOrder.fiscalYear,
        fiscalPeriod: purchaseOrder.fiscalPeriod,
      });

      await grn.save();

      // Populate references
      await grn.populate('supplierId', 'supplierCode companyName email phone');
      await grn.populate('purchaseOrderId', 'poNumber poDate');
      await grn.populate('createdBy', 'name email');

      logger.info('GRN created from PO', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        poId: purchaseOrder._id,
        poNumber: purchaseOrder.poNumber,
        userId: request.user._id,
      });

      return successResponse(
        { grn },
        'Goods receipt note created from purchase order successfully',
        201
      );
    } catch (error) {
      logger.error('Error creating GRN from PO', error);

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
        'Failed to create goods receipt note from purchase order',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * GET /api/grn/from-po/[poId]
 * Get purchase order details for GRN creation (preview)
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { poId } = params;

      // Find purchase order with full details
      const purchaseOrder = await PurchaseOrder.findOne({
        _id: poId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('supplierId', 'supplierCode companyName contactPerson email phone address')
        .lean();

      if (!purchaseOrder) {
        return errorResponse('Purchase order not found', 404);
      }

      // Get pending items only
      const pendingItems = purchaseOrder.items.filter((item) => item.pendingQuantity > 0);

      // Return PO details with pending items
      return successResponse({
        purchaseOrder: {
          ...purchaseOrder,
          items: pendingItems,
        },
        canCreateGRN:
          pendingItems.length > 0 &&
          purchaseOrder.status !== 'draft' &&
          purchaseOrder.status !== 'cancelled',
      });
    } catch (error) {
      logger.error('Error fetching PO for GRN', error);

      return errorResponse(
        'Failed to fetch purchase order details',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
