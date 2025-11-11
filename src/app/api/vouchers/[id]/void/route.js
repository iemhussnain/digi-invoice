/**
 * Void Voucher API
 * Voids a posted voucher and reverses ledger entries
 */

import connectDB from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import LedgerEntry from '@/models/LedgerEntry';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';
import mongoose from 'mongoose';

/**
 * POST /api/vouchers/[id]/void
 * Void a posted voucher
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid voucher ID', 400);
      }

      const body = await request.json();
      const { reason } = body;

      // Validation
      if (!reason || reason.trim().length < 5) {
        return validationError({
          reason: 'Void reason must be at least 5 characters',
        });
      }

      const voucher = await Voucher.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!voucher) {
        return errorResponse('Voucher not found', 404);
      }

      if (voucher.status === 'void') {
        return errorResponse('Voucher is already void', 400);
      }

      if (voucher.status === 'draft') {
        return errorResponse('Cannot void a draft voucher. Delete it instead.', 400);
      }

      logger.info('Voiding voucher', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        reason,
        userId: request.user._id,
      });

      // Void ledger entries (reverse balances)
      await LedgerEntry.voidEntriesForVoucher(voucher._id, request.user._id, reason.trim());

      // Void voucher
      await voucher.void(request.user._id, reason.trim());

      // Populate entries
      await voucher.populate('entries.accountId', 'code name type');

      logger.success('Voucher voided successfully', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      return successResponse(
        {
          voucher,
        },
        'Voucher voided successfully'
      );
    } catch (error) {
      logger.error('Error voiding voucher', error);

      return errorResponse(
        'Failed to void voucher',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
