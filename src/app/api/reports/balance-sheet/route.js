/**
 * Balance Sheet API
 * Returns balance sheet showing Assets = Liabilities + Equity
 */

import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import LedgerEntry from '@/models/LedgerEntry';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/reports/balance-sheet?asOfDate=xxx&fiscalYear=xxx
 * Get balance sheet
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const asOfDate = searchParams.get('asOfDate') || new Date().toISOString();
      const fiscalYear = searchParams.get('fiscalYear');

      // Get all active accounts (excluding revenue and expense)
      const accounts = await Account.find({
        organizationId: request.user.organizationId,
        isDeleted: false,
        isActive: true,
        isGroup: false, // Only leaf accounts
        type: { $in: ['asset', 'liability', 'equity'] },
      }).sort({ code: 1 });

      // Get revenue and expense accounts for retained earnings calculation
      const revenueExpenseAccounts = await Account.find({
        organizationId: request.user.organizationId,
        isDeleted: false,
        isActive: true,
        isGroup: false,
        type: { $in: ['revenue', 'expense'] },
      });

      // Initialize balance sheet structure
      const assets = {
        current: [],
        fixed: [],
        total: 0,
      };

      const liabilities = {
        current: [],
        longTerm: [],
        total: 0,
      };

      const equity = {
        accounts: [],
        retainedEarnings: 0,
        total: 0,
      };

      // Calculate balances for each account as of date
      for (const account of accounts) {
        // Build query for ledger entries up to asOfDate
        const query = {
          organizationId: request.user.organizationId,
          accountId: account._id,
          status: 'active',
          entryDate: { $lte: new Date(asOfDate) },
        };

        if (fiscalYear) {
          query.fiscalYear = fiscalYear;
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

        // Calculate balance based on normal balance
        let balance = 0;
        if (account.normalBalance === 'debit') {
          balance = (account.openingBalance || 0) + debitTotal - creditTotal;
        } else {
          balance = (account.openingBalance || 0) + creditTotal - debitTotal;
        }

        // Only include accounts with non-zero balance
        if (Math.abs(balance) > 0.01) {
          const accountData = {
            _id: account._id,
            code: account.code,
            name: account.name,
            category: account.category,
            balance: parseFloat(balance.toFixed(2)),
          };

          // Categorize account
          if (account.type === 'asset') {
            // Determine if current or fixed asset
            if (
              account.category === 'current_asset' ||
              account.code.startsWith('1001') || // Cash and bank
              account.code.startsWith('1002') || // Inventory
              account.code.startsWith('1003')    // Receivables
            ) {
              assets.current.push(accountData);
            } else {
              assets.fixed.push(accountData);
            }
            assets.total += balance;
          } else if (account.type === 'liability') {
            // Determine if current or long-term liability
            if (
              account.category === 'current_liability' ||
              account.code.startsWith('2001') || // Accounts Payable
              account.code.startsWith('2002')    // Short-term loans
            ) {
              liabilities.current.push(accountData);
            } else {
              liabilities.longTerm.push(accountData);
            }
            liabilities.total += balance;
          } else if (account.type === 'equity') {
            equity.accounts.push(accountData);
            equity.total += balance;
          }
        }
      }

      // Calculate retained earnings (Net Income = Revenue - Expense)
      let totalRevenue = 0;
      let totalExpense = 0;

      for (const account of revenueExpenseAccounts) {
        const query = {
          organizationId: request.user.organizationId,
          accountId: account._id,
          status: 'active',
          entryDate: { $lte: new Date(asOfDate) },
        };

        if (fiscalYear) {
          query.fiscalYear = fiscalYear;
        }

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

        let balance = 0;
        if (account.normalBalance === 'debit') {
          balance = (account.openingBalance || 0) + debitTotal - creditTotal;
        } else {
          balance = (account.openingBalance || 0) + creditTotal - debitTotal;
        }

        if (account.type === 'revenue') {
          totalRevenue += balance;
        } else if (account.type === 'expense') {
          totalExpense += balance;
        }
      }

      // Net Income (Retained Earnings for the period)
      equity.retainedEarnings = parseFloat((totalRevenue - totalExpense).toFixed(2));
      equity.total += equity.retainedEarnings;

      // Calculate totals
      const totalAssets = parseFloat(assets.total.toFixed(2));
      const totalLiabilitiesAndEquity = parseFloat((liabilities.total + equity.total).toFixed(2));
      const difference = parseFloat((totalAssets - totalLiabilitiesAndEquity).toFixed(2));
      const isBalanced = Math.abs(difference) < 0.01;

      logger.info('Balance sheet generated', {
        totalAssets,
        totalLiabilities: liabilities.total,
        totalEquity: equity.total,
        isBalanced,
        userId: request.user._id,
      });

      return successResponse({
        balanceSheet: {
          assets: {
            current: {
              accounts: assets.current,
              total: parseFloat(
                assets.current.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)
              ),
            },
            fixed: {
              accounts: assets.fixed,
              total: parseFloat(
                assets.fixed.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)
              ),
            },
            total: totalAssets,
          },
          liabilities: {
            current: {
              accounts: liabilities.current,
              total: parseFloat(
                liabilities.current.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)
              ),
            },
            longTerm: {
              accounts: liabilities.longTerm,
              total: parseFloat(
                liabilities.longTerm.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)
              ),
            },
            total: parseFloat(liabilities.total.toFixed(2)),
          },
          equity: {
            accounts: equity.accounts,
            retainedEarnings: equity.retainedEarnings,
            total: parseFloat(equity.total.toFixed(2)),
          },
        },
        totals: {
          assets: totalAssets,
          liabilitiesAndEquity: totalLiabilitiesAndEquity,
          difference,
        },
        isBalanced,
        revenueExpenseSummary: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalExpense: parseFloat(totalExpense.toFixed(2)),
          netIncome: equity.retainedEarnings,
        },
        asOfDate: new Date(asOfDate),
        generatedAt: new Date(),
      });
    } catch (error) {
      logger.error('Error generating balance sheet', error);

      return errorResponse(
        'Failed to generate balance sheet',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
