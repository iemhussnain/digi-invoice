/**
 * Trial Balance API
 * Returns trial balance showing all accounts with debit/credit totals
 */

import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import LedgerEntry from '@/models/LedgerEntry';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/reports/trial-balance?startDate=xxx&endDate=xxx&fiscalYear=xxx&fiscalPeriod=xxx
 * Get trial balance
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const fiscalYear = searchParams.get('fiscalYear');
      const fiscalPeriod = searchParams.get('fiscalPeriod');

      // Get all active accounts
      const accounts = await Account.find({
        organizationId: request.user.organizationId,
        isDeleted: false,
        isActive: true,
        isGroup: false, // Only leaf accounts
      }).sort({ code: 1 });

      const trialBalanceData = [];
      let grandTotalDebit = 0;
      let grandTotalCredit = 0;

      // For each account, calculate debit and credit totals
      for (const account of accounts) {
        // Build query for ledger entries
        const query = {
          organizationId: request.user.organizationId,
          accountId: account._id,
          status: 'active',
        };

        // Date range filter
        if (startDate || endDate) {
          query.entryDate = {};
          if (startDate) query.entryDate.$gte = new Date(startDate);
          if (endDate) query.entryDate.$lte = new Date(endDate);
        }

        // Fiscal period filter
        if (fiscalYear) {
          query.fiscalYear = fiscalYear;
        }
        if (fiscalPeriod) {
          query.fiscalPeriod = fiscalPeriod;
        }

        // Get all entries for this account
        const entries = await LedgerEntry.find(query);

        let debitTotal = 0;
        let creditTotal = 0;

        entries.forEach(entry => {
          if (entry.type === 'debit') {
            debitTotal += entry.amount;
          } else if (entry.type === 'credit') {
            creditTotal += entry.amount;
          }
        });

        // Calculate net balance
        let netDebit = 0;
        let netCredit = 0;

        if (account.normalBalance === 'debit') {
          // For debit normal balance accounts (Assets, Expenses)
          const balance = (account.openingBalance || 0) + debitTotal - creditTotal;
          if (balance >= 0) {
            netDebit = balance;
          } else {
            netCredit = Math.abs(balance);
          }
        } else {
          // For credit normal balance accounts (Liabilities, Equity, Revenue)
          const balance = (account.openingBalance || 0) + creditTotal - debitTotal;
          if (balance >= 0) {
            netCredit = balance;
          } else {
            netDebit = Math.abs(balance);
          }
        }

        // Only include accounts with activity
        if (debitTotal > 0 || creditTotal > 0 || account.openingBalance !== 0) {
          trialBalanceData.push({
            account: {
              _id: account._id,
              code: account.code,
              name: account.name,
              type: account.type,
              category: account.category,
              normalBalance: account.normalBalance,
            },
            openingBalance: account.openingBalance || 0,
            debitTotal: parseFloat(debitTotal.toFixed(2)),
            creditTotal: parseFloat(creditTotal.toFixed(2)),
            netDebit: parseFloat(netDebit.toFixed(2)),
            netCredit: parseFloat(netCredit.toFixed(2)),
            currentBalance: account.currentBalance || 0,
          });

          grandTotalDebit += netDebit;
          grandTotalCredit += netCredit;
        }
      }

      // Group by account type
      const groupedByType = {
        asset: trialBalanceData.filter(item => item.account.type === 'asset'),
        liability: trialBalanceData.filter(item => item.account.type === 'liability'),
        equity: trialBalanceData.filter(item => item.account.type === 'equity'),
        revenue: trialBalanceData.filter(item => item.account.type === 'revenue'),
        expense: trialBalanceData.filter(item => item.account.type === 'expense'),
      };

      const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;
      const difference = grandTotalDebit - grandTotalCredit;

      logger.info('Trial balance retrieved', {
        accountsCount: trialBalanceData.length,
        grandTotalDebit,
        grandTotalCredit,
        isBalanced,
        userId: request.user._id,
      });

      return successResponse({
        trialBalance: trialBalanceData,
        groupedByType,
        totals: {
          debit: parseFloat(grandTotalDebit.toFixed(2)),
          credit: parseFloat(grandTotalCredit.toFixed(2)),
          difference: parseFloat(difference.toFixed(2)),
        },
        isBalanced,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
          fiscalYear: fiscalYear || null,
          fiscalPeriod: fiscalPeriod || null,
        },
        generatedAt: new Date(),
      });
    } catch (error) {
      logger.error('Error generating trial balance', error);

      return errorResponse(
        'Failed to generate trial balance',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
