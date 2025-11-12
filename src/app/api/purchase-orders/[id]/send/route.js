/**
 * Send Purchase Order API
 * Sends purchase order to supplier via email
 */

import connectDB from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/purchase-orders/[id]/send
 * Send purchase order to supplier
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();
      const { email } = body;

      // Find purchase order
      const purchaseOrder = await PurchaseOrder.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      }).populate('supplierId');

      if (!purchaseOrder) {
        return errorResponse('Purchase order not found', 404);
      }

      // Check if purchase order can be sent
      if (purchaseOrder.status !== 'draft') {
        return errorResponse('Only draft purchase orders can be sent', 400);
      }

      if (purchaseOrder.status === 'cancelled') {
        return errorResponse('Cannot send cancelled purchase order', 400);
      }

      // Determine email to send to
      let sendToEmail = email;
      if (!sendToEmail) {
        // Use supplier's email if not provided
        if (purchaseOrder.supplierId && purchaseOrder.supplierId.email) {
          sendToEmail = purchaseOrder.supplierId.email;
        } else {
          return errorResponse('Email address is required. Supplier has no email on file.', 400);
        }
      }

      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(sendToEmail)) {
        return errorResponse('Invalid email address', 400);
      }

      // Send purchase order to supplier
      await purchaseOrder.send(request.user._id, sendToEmail);

      // In a real application, you would send an actual email here
      // For now, we'll just log it and mark as sent
      logger.info('Purchase order sent to supplier', {
        purchaseOrderId: purchaseOrder._id,
        poNumber: purchaseOrder.poNumber,
        email: sendToEmail,
        userId: request.user._id,
      });

      // TODO: Implement actual email sending
      // Example:
      // await sendEmail({
      //   to: sendToEmail,
      //   subject: `Purchase Order ${purchaseOrder.poNumber}`,
      //   template: 'purchase-order',
      //   data: {
      //     purchaseOrder,
      //     organization: await Organization.findById(request.user.organizationId),
      //   },
      // });

      // Populate and return
      await purchaseOrder.populate('supplierId', 'supplierCode companyName email');
      await purchaseOrder.populate('sentBy', 'name email');

      return successResponse(
        {
          purchaseOrder,
          message: `Purchase order sent to ${sendToEmail}`,
        },
        'Purchase order sent successfully to supplier'
      );
    } catch (error) {
      logger.error('Error sending purchase order', error);

      return errorResponse(
        error.message || 'Failed to send purchase order',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
