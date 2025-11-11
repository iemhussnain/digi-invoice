/**
 * Purchase Invoice Approval API
 * Approves verified purchase invoice
 */

import connectDB from '@/lib/mongodb';
import PurchaseInvoice from '@/models/PurchaseInvoice';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/purchase-invoices/[id]/approve
 * Approve purchase invoice
 */
export async function POST(request, { params }) {
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

      // Approve using model method
      await purchaseInvoice.approve(request.user._id);

      // Populate and return
      await purchaseInvoice.populate('supplierId', 'supplierCode companyName');
      await purchaseInvoice.populate('purchaseOrderId', 'poNumber');
      await purchaseInvoice.populate('grnId', 'grnNumber');
      await purchaseInvoice.populate('approvedBy', 'name email');

      logger.info('Purchase invoice approved', {
        purchaseInvoiceId: purchaseInvoice._id,
        invoiceNumber: purchaseInvoice.invoiceNumber,
        userId: request.user._id,
      });

      return successResponse(
        { purchaseInvoice },
        'Purchase invoice approved successfully'
      );
    } catch (error) {
      logger.error('Error approving purchase invoice', error);

      return errorResponse(
        error.message || 'Failed to approve purchase invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
