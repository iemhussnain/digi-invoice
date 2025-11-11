/**
 * Individual Voucher API
 * Handles single voucher operations
 */

import connectDB from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import LedgerEntry from '@/models/LedgerEntry';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';
import mongoose from 'mongoose';

/**
 * GET /api/vouchers/[id]
 * Get voucher details by ID
 */
export async function GET(request, { params }) {
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
      })
        .populate('createdBy', 'name email')
        .populate('postedBy', 'name email')
        .populate('voidedBy', 'name email')
        .populate({
          path: 'entries.accountId',
          select: 'code name type category normalBalance',
        });

      if (!voucher) {
        return errorResponse('Voucher not found', 404);
      }

      // Get ledger entries if posted
      let ledgerEntries = [];
      if (voucher.status === 'posted' || voucher.status === 'void') {
        ledgerEntries = await LedgerEntry.find({
          voucherId: voucher._id,
        })
          .populate('accountId', 'code name type')
          .sort({ type: 1, createdAt: 1 });
      }

      logger.info('Voucher details retrieved', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      return successResponse({
        voucher,
        ledgerEntries,
      });
    } catch (error) {
      logger.error('Error retrieving voucher details', error);

      return errorResponse(
        'Failed to retrieve voucher',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/vouchers/[id]
 * Update voucher (only drafts can be updated)
 */
export async function PUT(request, { params }) {
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

      if (voucher.status !== 'draft') {
        return errorResponse(
          'Only draft vouchers can be updated',
          400,
          { status: voucher.status }
        );
      }

      const body = await request.json();
      const {
        voucherDate,
        narration,
        entries,
        referenceNumber,
        referenceType,
        tags,
        notes,
      } = body;

      logger.info('Updating voucher', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      // Update fields
      if (voucherDate) {
        voucher.voucherDate = new Date(voucherDate);
        const date = new Date(voucherDate);
        voucher.fiscalYear = date.getFullYear().toString();
        voucher.fiscalPeriod = `${voucher.fiscalYear}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (narration) voucher.narration = narration.trim();
      if (entries) voucher.entries = entries;
      if (referenceNumber !== undefined) voucher.referenceNumber = referenceNumber;
      if (referenceType) voucher.referenceType = referenceType;
      if (tags) voucher.tags = tags;
      if (notes !== undefined) voucher.notes = notes;

      voucher.updatedBy = request.user._id;

      // Validate double-entry
      const validation = voucher.validateDoubleEntry();
      if (!validation.isValid) {
        return errorResponse(
          'Double-entry validation failed',
          400,
          { errors: validation.errors }
        );
      }

      await voucher.save();

      // Populate entries
      await voucher.populate('entries.accountId', 'code name type');

      logger.success('Voucher updated successfully', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      return successResponse({ voucher }, 'Voucher updated successfully');
    } catch (error) {
      logger.error('Error updating voucher', error);

      return errorResponse(
        'Failed to update voucher',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/vouchers/[id]
 * Soft delete voucher (only drafts can be deleted)
 */
export async function DELETE(request, { params }) {
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

      if (voucher.status !== 'draft') {
        return errorResponse(
          'Only draft vouchers can be deleted. Posted vouchers must be voided.',
          400,
          { status: voucher.status }
        );
      }

      logger.info('Deleting voucher', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      // Soft delete
      voucher.isDeleted = true;
      voucher.deletedAt = new Date();
      voucher.updatedBy = request.user._id;
      await voucher.save();

      logger.success('Voucher deleted successfully', {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      return successResponse(
        { voucher },
        'Voucher deleted successfully'
      );
    } catch (error) {
      logger.error('Error deleting voucher', error);

      return errorResponse(
        'Failed to delete voucher',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
