/**
 * Accounts API
 * Handles Chart of Accounts operations
 */

import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/accounts
 * List all accounts for the organization
 * Query params:
 * - type: Filter by account type (asset, liability, equity, revenue, expense)
 * - category: Filter by category
 * - isActive: Filter by active status
 * - search: Search by name or code
 * - tree: Return hierarchical tree structure (true/false)
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');
      const category = searchParams.get('category');
      const isActive = searchParams.get('isActive');
      const search = searchParams.get('search');
      const tree = searchParams.get('tree') === 'true';
      const includeInactive = searchParams.get('includeInactive') === 'true';

      // Build query
      const query = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      if (type) {
        query.type = type;
      }

      if (category) {
        query.category = category;
      }

      if (isActive !== null && !includeInactive) {
        query.isActive = isActive === 'true';
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }

      // Return tree structure
      if (tree) {
        const accountTree = await Account.getAccountTree(request.user.organizationId);

        logger.info('Accounts tree retrieved', {
          userId: request.user._id,
          organizationId: request.user.organizationId,
          totalNodes: JSON.stringify(accountTree).match(/"_id"/g)?.length || 0,
        });

        return successResponse({
          accounts: accountTree,
          format: 'tree',
        });
      }

      // Return flat list
      const accounts = await Account.find(query)
        .populate('parentAccountId', 'code name')
        .sort({ code: 1 })
        .lean();

      // Group by type for summary
      const summary = {
        total: accounts.length,
        byType: {
          asset: accounts.filter((a) => a.type === 'asset').length,
          liability: accounts.filter((a) => a.type === 'liability').length,
          equity: accounts.filter((a) => a.type === 'equity').length,
          revenue: accounts.filter((a) => a.type === 'revenue').length,
          expense: accounts.filter((a) => a.type === 'expense').length,
        },
        active: accounts.filter((a) => a.isActive).length,
        inactive: accounts.filter((a) => !a.isActive).length,
      };

      logger.info('Accounts retrieved', {
        userId: request.user._id,
        organizationId: request.user.organizationId,
        count: accounts.length,
        filters: { type, category, isActive, search },
      });

      return successResponse({
        accounts,
        summary,
        format: 'flat',
      });
    } catch (error) {
      logger.error('Error retrieving accounts', error);

      return errorResponse(
        'Failed to retrieve accounts',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/accounts
 * Create a new account
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();
      const {
        code,
        name,
        type,
        category,
        parentAccountId,
        description,
        openingBalance,
        openingBalanceDate,
        isBankAccount,
        bankDetails,
        isTaxAccount,
        taxRate,
        allowManualEntry,
        requireDescription,
        tags,
        notes,
      } = body;

      logger.info('Creating new account', {
        userId: request.user._id,
        code,
        name,
        type,
      });

      // Validation
      const errors = {};

      if (!code || code.trim().length === 0) {
        errors.code = 'Account code is required';
      }

      if (!name || name.trim().length < 2) {
        errors.name = 'Account name must be at least 2 characters';
      }

      if (!type) {
        errors.type = 'Account type is required';
      } else if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(type)) {
        errors.type = 'Invalid account type';
      }

      if (!category) {
        errors.category = 'Account category is required';
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Account creation validation failed', { errors });
        return validationError(errors);
      }

      // Check if code already exists for this organization
      const existingAccount = await Account.findOne({
        organizationId: request.user.organizationId,
        code: code.toUpperCase().trim(),
        isDeleted: false,
      });

      if (existingAccount) {
        return errorResponse(
          'Account code already exists',
          409,
          { code: 'Account with this code already exists in your organization' }
        );
      }

      // Determine level based on parent
      let level = 1;
      if (parentAccountId) {
        const parentAccount = await Account.findById(parentAccountId);
        if (!parentAccount) {
          return errorResponse('Parent account not found', 404);
        }

        if (parentAccount.organizationId.toString() !== request.user.organizationId.toString()) {
          return errorResponse('Parent account belongs to different organization', 403);
        }

        level = parentAccount.level + 1;

        // Mark parent as group account
        if (!parentAccount.isGroup) {
          parentAccount.isGroup = true;
          await parentAccount.save();
        }
      }

      // Create account
      const account = await Account.create({
        code: code.toUpperCase().trim(),
        name: name.trim(),
        type,
        category,
        parentAccountId: parentAccountId || null,
        level,
        description,
        organizationId: request.user.organizationId,
        openingBalance: openingBalance || 0,
        openingBalanceDate: openingBalanceDate || new Date(),
        currentBalance: openingBalance || 0,
        isBankAccount: isBankAccount || false,
        bankDetails: isBankAccount ? bankDetails : undefined,
        isTaxAccount: isTaxAccount || false,
        taxRate: isTaxAccount ? taxRate : 0,
        allowManualEntry: allowManualEntry !== undefined ? allowManualEntry : true,
        requireDescription: requireDescription || false,
        tags: tags || [],
        notes,
        isSystemAccount: false,
        createdBy: request.user._id,
        updatedBy: request.user._id,
      });

      logger.success('Account created successfully', {
        accountId: account._id,
        code: account.code,
        name: account.name,
        userId: request.user._id,
      });

      return successResponse(
        {
          account,
        },
        'Account created successfully',
        201
      );
    } catch (error) {
      logger.error('Error creating account', error);

      // Handle duplicate key error
      if (error.code === 11000) {
        return errorResponse(
          'Account code already exists',
          409,
          { code: 'Account with this code already exists' }
        );
      }

      return errorResponse(
        'Failed to create account',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
