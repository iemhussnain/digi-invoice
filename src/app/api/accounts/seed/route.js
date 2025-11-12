/**
 * Seed Chart of Accounts API
 * Seeds default Pakistani COA for an organization
 */

import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';

/**
 * POST /api/accounts/seed
 * Seed default Chart of Accounts (Pakistan)
 * Only admins can seed COA
 */
export async function POST(request) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const organizationId = request.user.organizationId;

      logger.info('Seeding Chart of Accounts', {
        userId: request.user._id,
        organizationId,
      });

      // Check if organization already has accounts
      const existingAccountsCount = await Account.countDocuments({
        organizationId,
        isDeleted: false,
      });

      if (existingAccountsCount > 0) {
        return errorResponse(
          'Chart of Accounts already exists',
          409,
          {
            message: 'This organization already has accounts. Cannot seed COA.',
            existingAccountsCount,
          }
        );
      }

      // Seed default COA
      const accountsCreated = await Account.seedDefaultCOA(organizationId);

      // Get all created accounts grouped by type
      const accounts = await Account.find({
        organizationId,
        isDeleted: false,
      })
        .sort({ code: 1 })
        .lean();

      const summary = {
        total: accountsCreated,
        byType: {
          asset: accounts.filter((a) => a.type === 'asset').length,
          liability: accounts.filter((a) => a.type === 'liability').length,
          equity: accounts.filter((a) => a.type === 'equity').length,
          revenue: accounts.filter((a) => a.type === 'revenue').length,
          expense: accounts.filter((a) => a.type === 'expense').length,
        },
      };

      logger.success('Chart of Accounts seeded successfully', {
        organizationId,
        accountsCreated,
        userId: request.user._id,
      });

      return successResponse(
        {
          accountsCreated,
          summary,
          accounts,
        },
        'Chart of Accounts seeded successfully',
        201
      );
    } catch (error) {
      logger.error('Error seeding Chart of Accounts', error);

      return errorResponse(
        'Failed to seed Chart of Accounts',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
