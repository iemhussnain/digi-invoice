/**
 * Purchase Invoice API - Single Operations
 * Handles GET, PUT, DELETE for individual purchase invoices
 */

import connectDB from '@/lib/mongodb';
import PurchaseInvoice from '@/models/PurchaseInvoice';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/purchase-invoices/[id]
 * Get single purchase invoice by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      const purchaseInvoice = await PurchaseInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('supplierId', 'supplierCode companyName contactPerson email phone address')
        .populate('purchaseOrderId', 'poNumber poDate status deliveryDate')
        .populate('grnId', 'grnNumber grnDate inspectionStatus')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('matchedBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('postedBy', 'name email')
        .populate('voucherId', 'voucherNumber voucherDate')
        .lean();

      if (!purchaseInvoice) {
        return errorResponse('Purchase invoice not found', 404);
      }

      return successResponse({ purchaseInvoice });
    } catch (error) {
      logger.error('Error fetching purchase invoice', error);

      return errorResponse(
        'Failed to fetch purchase invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/purchase-invoices/[id]
 * Update purchase invoice
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();

      // Find purchase invoice
      const purchaseInvoice = await PurchaseInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!purchaseInvoice) {
        return errorResponse('Purchase invoice not found', 404);
      }

      // Check if invoice can be updated
      if (purchaseInvoice.isPosted) {
        return errorResponse('Cannot update posted purchase invoice', 400);
      }

      if (purchaseInvoice.status === 'cancelled') {
        return errorResponse('Cannot update cancelled purchase invoice', 400);
      }

      // Update fields
      const allowedFields = [
        'invoiceNumber',
        'invoiceDate',
        'dueDate',
        'items',
        'shippingCharges',
        'otherCharges',
        'taxType',
        'taxRate',
        'notes',
        'internalNotes',
      ];

      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          purchaseInvoice[field] = body[field];
        }
      });

      purchaseInvoice.updatedBy = request.user._id;

      await purchaseInvoice.save();

      // Populate references
      await purchaseInvoice.populate('supplierId', 'supplierCode companyName email');
      await purchaseInvoice.populate('purchaseOrderId', 'poNumber poDate');
      await purchaseInvoice.populate('grnId', 'grnNumber grnDate');
      await purchaseInvoice.populate('updatedBy', 'name email');

      logger.info('Purchase invoice updated', {
        purchaseInvoiceId: purchaseInvoice._id,
        invoiceNumber: purchaseInvoice.invoiceNumber,
        userId: request.user._id,
      });

      return successResponse(
        { purchaseInvoice },
        'Purchase invoice updated successfully'
      );
    } catch (error) {
      logger.error('Error updating purchase invoice', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        error.message || 'Failed to update purchase invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/purchase-invoices/[id]
 * Soft delete purchase invoice
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Find purchase invoice
      const purchaseInvoice = await PurchaseInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!purchaseInvoice) {
        return errorResponse('Purchase invoice not found', 404);
      }

      // Check if invoice can be deleted
      if (purchaseInvoice.isPosted) {
        return errorResponse('Cannot delete posted purchase invoice', 400);
      }

      if (purchaseInvoice.paidAmount > 0) {
        return errorResponse('Cannot delete purchase invoice with payments', 400);
      }

      // Soft delete
      purchaseInvoice.isDeleted = true;
      purchaseInvoice.deletedAt = new Date();
      purchaseInvoice.deletedBy = request.user._id;

      await purchaseInvoice.save();

      logger.info('Purchase invoice deleted', {
        purchaseInvoiceId: purchaseInvoice._id,
        invoiceNumber: purchaseInvoice.invoiceNumber,
        userId: request.user._id,
      });

      return successResponse(
        { purchaseInvoice },
        'Purchase invoice deleted successfully'
      );
    } catch (error) {
      logger.error('Error deleting purchase invoice', error);

      return errorResponse(
        error.message || 'Failed to delete purchase invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
