/**
 * Individual Account API
 * Handles single account operations
 */

import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';
import mongoose from 'mongoose';

/**
 * GET /api/accounts/[id]
 * Get account details by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid account ID', 400);
      }

      const account = await Account.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('parentAccountId', 'code name type')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!account) {
        return errorResponse('Account not found', 404);
      }

      // Get children accounts
      const children = await account.getChildren();

      // Get hierarchy path
      const hierarchyPath = await account.getHierarchyPath();

      logger.info('Account details retrieved', {
        accountId: account._id,
        code: account.code,
        userId: request.user._id,
      });

      return successResponse({
        account,
        children,
        hierarchyPath: hierarchyPath.map((a) => ({
          _id: a._id,
          code: a.code,
          name: a.name,
        })),
      });
    } catch (error) {
      logger.error('Error retrieving account details', error);

      return errorResponse(
        'Failed to retrieve account',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/accounts/[id]
 * Update account
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid account ID', 400);
      }

      const account = await Account.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!account) {
        return errorResponse('Account not found', 404);
      }

      const body = await request.json();
      const {
        code,
        name,
        description,
        isActive,
        isBankAccount,
        bankDetails,
        isTaxAccount,
        taxRate,
        allowManualEntry,
        requireDescription,
        tags,
        notes,
      } = body;

      logger.info('Updating account', {
        accountId: account._id,
        code: account.code,
        userId: request.user._id,
      });

      // System accounts have limited editability
      if (account.isSystemAccount) {
        // Can only update these fields for system accounts
        if (description !== undefined) account.description = description;
        if (notes !== undefined) account.notes = notes;
        if (isActive !== undefined) account.isActive = isActive;

        account.updatedBy = request.user._id;
        await account.save();

        logger.info('System account updated (limited fields)', {
          accountId: account._id,
        });

        return successResponse({ account }, 'System account updated (limited fields)');
      }

      // Regular accounts can be fully edited
      if (code) {
        // Check if new code already exists
        const existingAccount = await Account.findOne({
          organizationId: request.user.organizationId,
          code: code.toUpperCase().trim(),
          _id: { $ne: account._id },
          isDeleted: false,
        });

        if (existingAccount) {
          return errorResponse(
            'Account code already exists',
            409,
            { code: 'Account with this code already exists' }
          );
        }

        account.code = code.toUpperCase().trim();
      }

      if (name) account.name = name.trim();
      if (description !== undefined) account.description = description;
      if (isActive !== undefined) account.isActive = isActive;
      if (isBankAccount !== undefined) account.isBankAccount = isBankAccount;
      if (isBankAccount && bankDetails) account.bankDetails = bankDetails;
      if (isTaxAccount !== undefined) account.isTaxAccount = isTaxAccount;
      if (isTaxAccount && taxRate !== undefined) account.taxRate = taxRate;
      if (allowManualEntry !== undefined) account.allowManualEntry = allowManualEntry;
      if (requireDescription !== undefined) account.requireDescription = requireDescription;
      if (tags) account.tags = tags;
      if (notes !== undefined) account.notes = notes;

      account.updatedBy = request.user._id;
      await account.save();

      logger.success('Account updated successfully', {
        accountId: account._id,
        code: account.code,
        userId: request.user._id,
      });

      return successResponse({ account }, 'Account updated successfully');
    } catch (error) {
      logger.error('Error updating account', error);

      if (error.code === 11000) {
        return errorResponse(
          'Account code already exists',
          409,
          { code: 'Account with this code already exists' }
        );
      }

      return errorResponse(
        'Failed to update account',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/accounts/[id]
 * Soft delete account
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid account ID', 400);
      }

      const account = await Account.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!account) {
        return errorResponse('Account not found', 404);
      }

      logger.info('Attempting to delete account', {
        accountId: account._id,
        code: account.code,
        userId: request.user._id,
      });

      // Check if account can be deleted
      const canDeleteCheck = account.canDelete();
      if (!canDeleteCheck.canDelete) {
        return errorResponse(
          'Cannot delete account',
          400,
          { reason: canDeleteCheck.reason }
        );
      }

      // Check if account has children
      const children = await Account.find({
        parentAccountId: account._id,
        isDeleted: false,
      });

      if (children.length > 0) {
        return errorResponse(
          'Cannot delete account with child accounts',
          400,
          {
            reason: 'This account has child accounts. Please delete or move them first.',
            childCount: children.length,
          }
        );
      }

      // Soft delete
      account.isDeleted = true;
      account.deletedAt = new Date();
      account.updatedBy = request.user._id;
      await account.save();

      logger.success('Account deleted successfully', {
        accountId: account._id,
        code: account.code,
        userId: request.user._id,
      });

      return successResponse(
        { account },
        'Account deleted successfully'
      );
    } catch (error) {
      logger.error('Error deleting account', error);

      return errorResponse(
        'Failed to delete account',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
