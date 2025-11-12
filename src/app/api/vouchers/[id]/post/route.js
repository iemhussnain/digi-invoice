/**
 * Post Voucher API
 * Posts a draft voucher and creates ledger entries
 */

import connectDB from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import LedgerEntry from '@/models/LedgerEntry';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';
import mongoose from 'mongoose';

/**
 * POST /api/vouchers/[id]/post
 * Post a draft voucher
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid voucher ID', 400);
      }

      const voucher = await Voucher.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!voucher) {
        return errorResponse('Voucher not found', 404);
      }

      if (voucher.status === 'posted') {
        return errorResponse('Voucher is already posted', 400);
      }

      if (voucher.status === 'void') {
        return errorResponse('Cannot post a void voucher', 400);
      }

      logger.info('Posting voucher', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      // Post voucher
      await voucher.post(request.user._id);

      // Create ledger entries
      const ledgerEntries = await LedgerEntry.createFromVoucher(voucher, request.user._id);

      // Populate entries
      await voucher.populate('entries.accountId', 'code name type');

      logger.success('Voucher posted successfully', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        ledgerEntriesCount: ledgerEntries.length,
        userId: request.user._id,
      });

      return successResponse(
        {
          voucher,
          ledgerEntries,
        },
        'Voucher posted successfully'
      );
    } catch (error) {
      logger.error('Error posting voucher', error);

      return errorResponse(
        'Failed to post voucher',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
