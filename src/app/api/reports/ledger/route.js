/**
 * Account Ledger API
 * Returns detailed transaction history for a specific account
 */

import connectDB from '@/lib/mongodb';
import LedgerEntry from '@/models/LedgerEntry';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';
import mongoose from 'mongoose';

/**
 * GET /api/reports/ledger?accountId=xxx&startDate=xxx&endDate=xxx
 * Get account ledger (transaction history)
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const accountId = searchParams.get('accountId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const includeVoid = searchParams.get('includeVoid') === 'true';

      // Validation
      if (!accountId) {
        return errorResponse('Account ID is required', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return errorResponse('Invalid account ID', 400);
      }

      // Get account details
      const account = await Account.findOne({
        _id: accountId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!account) {
        return errorResponse('Account not found', 404);
      }

      // Build query for ledger entries
      const query = {
        organizationId: request.user.organizationId,
        accountId: accountId,
        status: includeVoid ? { $in: ['active', 'void'] } : 'active',
      };

      if (startDate || endDate) {
        query.entryDate = {};
        if (startDate) query.entryDate.$gte = new Date(startDate);
        if (endDate) query.entryDate.$lte = new Date(endDate);
      }

      // Get ledger entries
      const entries = await LedgerEntry.find(query)
        .populate('voucherId', 'voucherNumber voucherType narration referenceNumber')
        .populate('createdBy', 'name')
        .sort({ entryDate: 1, createdAt: 1 })
        .lean();

      // Calculate opening balance (entries before startDate)
      let openingBalance = account.openingBalance || 0;

      if (startDate) {
        const openingEntries = await LedgerEntry.find({
          organizationId: request.user.organizationId,
          accountId: accountId,
          status: 'active',
          entryDate: { $lt: new Date(startDate) },
        });

        openingEntries.forEach(entry => {
          if (entry.type === 'debit') {
            if (account.normalBalance === 'debit') {
              openingBalance += entry.amount;
            } else {
              openingBalance -= entry.amount;
            }
          } else if (entry.type === 'credit') {
            if (account.normalBalance === 'credit') {
              openingBalance += entry.amount;
            } else {
              openingBalance -= entry.amount;
            }
          }
        });
      }

      // Calculate running balances and totals
      let runningBalance = openingBalance;
      let totalDebit = 0;
      let totalCredit = 0;

      const entriesWithBalance = entries.map(entry => {
        // Update running balance
        if (entry.type === 'debit') {
          totalDebit += entry.amount;
          if (account.normalBalance === 'debit') {
            runningBalance += entry.amount;
          } else {
            runningBalance -= entry.amount;
          }
        } else if (entry.type === 'credit') {
          totalCredit += entry.amount;
          if (account.normalBalance === 'credit') {
            runningBalance += entry.amount;
          } else {
            runningBalance -= entry.amount;
          }
        }

        return {
          ...entry,
          runningBalance: parseFloat(runningBalance.toFixed(2)),
        };
      });

      const closingBalance = runningBalance;

      logger.info('Account ledger retrieved', {
        accountId,
        accountCode: account.code,
        entriesCount: entries.length,
        userId: request.user._id,
      });

      return successResponse({
        account: {
          _id: account._id,
          code: account.code,
          name: account.name,
          type: account.type,
          category: account.category,
          normalBalance: account.normalBalance,
          currentBalance: account.currentBalance,
        },
        openingBalance: parseFloat(openingBalance.toFixed(2)),
        closingBalance: parseFloat(closingBalance.toFixed(2)),
        totalDebit: parseFloat(totalDebit.toFixed(2)),
        totalCredit: parseFloat(totalCredit.toFixed(2)),
        entries: entriesWithBalance,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });
    } catch (error) {
      logger.error('Error retrieving account ledger', error);

      return errorResponse(
        'Failed to retrieve account ledger',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
