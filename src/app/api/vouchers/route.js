/**
 * Vouchers API
 * Handles voucher operations (JV, PV, RV, CV)
 */

import connectDB from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import LedgerEntry from '@/models/LedgerEntry';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/vouchers
 * List all vouchers for the organization
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const voucherType = searchParams.get('voucherType');
      const status = searchParams.get('status');
      const fiscalYear = searchParams.get('fiscalYear');
      const fiscalPeriod = searchParams.get('fiscalPeriod');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 50;

      // Build query
      const query = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      if (voucherType) {
        query.voucherType = voucherType;
      }

      if (status) {
        query.status = status;
      }

      if (fiscalYear) {
        query.fiscalYear = fiscalYear;
      }

      if (fiscalPeriod) {
        query.fiscalPeriod = fiscalPeriod;
      }

      if (startDate || endDate) {
        query.voucherDate = {};
        if (startDate) query.voucherDate.$gte = new Date(startDate);
        if (endDate) query.voucherDate.$lte = new Date(endDate);
      }

      if (search) {
        query.$or = [
          { voucherNumber: { $regex: search, $options: 'i' } },
          { narration: { $regex: search, $options: 'i' } },
          { referenceNumber: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await Voucher.countDocuments(query);

      // Get vouchers
      const vouchers = await Voucher.find(query)
        .populate('createdBy', 'name email')
        .populate('postedBy', 'name email')
        .populate({
          path: 'entries.accountId',
          select: 'code name type',
        })
        .sort({ voucherDate: -1, voucherNumber: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Get summary
      const summary = {
        total,
        byType: {},
        byStatus: {
          draft: 0,
          posted: 0,
          void: 0,
        },
      };

      const allVouchers = await Voucher.find({
        organizationId: request.user.organizationId,
        isDeleted: false,
      }).select('voucherType status');

      allVouchers.forEach(v => {
        // Count by type
        if (!summary.byType[v.voucherType]) {
          summary.byType[v.voucherType] = 0;
        }
        summary.byType[v.voucherType]++;

        // Count by status
        summary.byStatus[v.status]++;
      });

      logger.info('Vouchers retrieved', {
        userId: request.user._id,
        organizationId: request.user.organizationId,
        count: vouchers.length,
        total,
      });

      return successResponse({
        vouchers,
        summary,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error retrieving vouchers', error);

      return errorResponse(
        'Failed to retrieve vouchers',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/vouchers
 * Create a new voucher
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();
      const {
        voucherType,
        voucherDate,
        narration,
        entries,
        referenceNumber,
        referenceType,
        tags,
        notes,
        autoPost,
      } = body;

      logger.info('Creating new voucher', {
        userId: request.user._id,
        voucherType,
      });

      // Validation
      const errors = {};

      if (!voucherType) {
        errors.voucherType = 'Voucher type is required';
      } else if (!['JV', 'PV', 'RV', 'CV'].includes(voucherType)) {
        errors.voucherType = 'Invalid voucher type';
      }

      if (!voucherDate) {
        errors.voucherDate = 'Voucher date is required';
      }

      if (!narration || narration.trim().length < 5) {
        errors.narration = 'Narration must be at least 5 characters';
      }

      if (!entries || entries.length < 2) {
        errors.entries = 'Voucher must have at least 2 entries';
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Voucher creation validation failed', { errors });
        return validationError(errors);
      }

      // Validate entries
      const entryErrors = [];
      entries.forEach((entry, index) => {
        if (!entry.accountId) {
          entryErrors.push(`Entry ${index + 1}: Account is required`);
        }
        if (!entry.type || !['debit', 'credit'].includes(entry.type)) {
          entryErrors.push(`Entry ${index + 1}: Type must be debit or credit`);
        }
        if (!entry.amount || entry.amount <= 0) {
          entryErrors.push(`Entry ${index + 1}: Amount must be greater than 0`);
        }
      });

      if (entryErrors.length > 0) {
        return errorResponse('Invalid entries', 400, { entryErrors });
      }

      // Get fiscal year and period from voucher date
      const date = new Date(voucherDate);
      const fiscalYear = date.getFullYear().toString();
      const fiscalPeriod = `${fiscalYear}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Generate voucher number
      const voucherNumber = await Voucher.generateVoucherNumber(
        request.user.organizationId,
        voucherType,
        fiscalYear
      );

      // Create voucher
      const voucher = new Voucher({
        voucherNumber,
        voucherType,
        organizationId: request.user.organizationId,
        voucherDate: new Date(voucherDate),
        fiscalYear,
        fiscalPeriod,
        narration: narration.trim(),
        entries,
        referenceNumber,
        referenceType,
        tags,
        notes,
        status: 'draft',
        createdBy: request.user._id,
        updatedBy: request.user._id,
      });

      // Validate double-entry
      const validation = voucher.validateDoubleEntry();
      if (!validation.isValid) {
        return errorResponse(
          'Double-entry validation failed',
          400,
          { errors: validation.errors }
        );
      }

      // Save voucher
      await voucher.save();

      // Auto-post if requested
      if (autoPost) {
        await voucher.post(request.user._id);

        // Create ledger entries
        await LedgerEntry.createFromVoucher(voucher, request.user._id);

        logger.success('Voucher created and posted', {
          voucherId: voucher._id,
          voucherNumber: voucher.voucherNumber,
          userId: request.user._id,
        });
      } else {
        logger.success('Voucher created as draft', {
          voucherId: voucher._id,
          voucherNumber: voucher.voucherNumber,
          userId: request.user._id,
        });
      }

      // Populate entries before returning
      await voucher.populate('entries.accountId', 'code name type');

      return successResponse(
        {
          voucher,
        },
        autoPost ? 'Voucher created and posted successfully' : 'Voucher created as draft',
        201
      );
    } catch (error) {
      logger.error('Error creating voucher', error);

      return errorResponse(
        'Failed to create voucher',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
