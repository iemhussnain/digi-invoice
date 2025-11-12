/**
 * Purchase Invoice 3-Way Matching Verification API
 * Verifies invoice against PO and GRN
 */

import connectDB from '@/lib/mongodb';
import PurchaseInvoice from '@/models/PurchaseInvoice';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/purchase-invoices/[id]/verify
 * Verify 3-way matching for purchase invoice
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

      // Check if invoice can be verified
      if (purchaseInvoice.status !== 'draft') {
        return errorResponse('Only draft invoices can be verified', 400);
      }

      // Perform 3-way matching
      const isMatched = await purchaseInvoice.verify3WayMatching();

      // Update status
      purchaseInvoice.status = 'verified';
      purchaseInvoice.matchedBy = request.user._id;
      purchaseInvoice.matchedAt = new Date();
      purchaseInvoice.updatedBy = request.user._id;

      await purchaseInvoice.save();

      // Populate and return
      await purchaseInvoice.populate('supplierId', 'supplierCode companyName');
      await purchaseInvoice.populate('purchaseOrderId', 'poNumber');
      await purchaseInvoice.populate('grnId', 'grnNumber');
      await purchaseInvoice.populate('matchedBy', 'name email');

      logger.info('Purchase invoice verified', {
        purchaseInvoiceId: purchaseInvoice._id,
        invoiceNumber: purchaseInvoice.invoiceNumber,
        matchingStatus: purchaseInvoice.matchingStatus,
        isMatched,
        userId: request.user._id,
      });

      return successResponse(
        {
          purchaseInvoice,
          matchingResult: {
            isMatched,
            matchingStatus: purchaseInvoice.matchingStatus,
            quantityVariance: purchaseInvoice.quantityVariance,
            amountVariance: purchaseInvoice.amountVariance,
          },
        },
        isMatched
          ? 'Invoice verified successfully - all items matched'
          : 'Invoice verified with mismatches - review required'
      );
    } catch (error) {
      logger.error('Error verifying purchase invoice', error);

      return errorResponse(
        error.message || 'Failed to verify purchase invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
