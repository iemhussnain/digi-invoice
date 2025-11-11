/**
 * Single Invoice API
 * Handles get, update, delete operations for a specific invoice
 */

import connectDB from '@/lib/mongodb';
import SalesInvoice from '@/models/SalesInvoice';
import Customer from '@/models/Customer';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/invoices/[id]
 * Get a single invoice by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      const invoice = await SalesInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('customerId', 'name companyName email phone mobile customerCode billingAddress')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('postedBy', 'name email')
        .populate('voucherId', 'voucherNumber voucherType voucherDate status')
        .populate('revenueAccountId', 'code name')
        .populate('receivableAccountId', 'code name')
        .populate('taxAccountId', 'code name')
        .lean();

      if (!invoice) {
        return errorResponse('Invoice not found', 404);
      }

      logger.info('Invoice retrieved', {
        invoiceId: invoice._id,
        userId: request.user._id,
      });

      return successResponse({ invoice });
    } catch (error) {
      logger.error('Error fetching invoice', error);

      return errorResponse(
        'Failed to fetch invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/invoices/[id]
 * Update an invoice
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();

      // Find invoice
      const invoice = await SalesInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!invoice) {
        return errorResponse('Invoice not found', 404);
      }

      // Check if invoice can be edited
      if (invoice.isPosted) {
        return errorResponse('Cannot edit posted invoice', 400);
      }

      if (invoice.status === 'cancelled') {
        return errorResponse('Cannot edit cancelled invoice', 400);
      }

      // Validate customer if being changed
      if (body.customerId && body.customerId !== invoice.customerId.toString()) {
        const customer = await Customer.findOne({
          _id: body.customerId,
          organizationId: request.user.organizationId,
          isDeleted: false,
        });

        if (!customer) {
          return errorResponse('Customer not found', 404);
        }
      }

      // Fields that should not be updated directly
      const protectedFields = [
        '_id',
        'invoiceNumber',
        'organizationId',
        'createdBy',
        'createdAt',
        'isPosted',
        'postedAt',
        'postedBy',
        'voucherId',
        'isDeleted',
        'deletedAt',
        'deletedBy',
      ];

      // Remove protected fields from update
      protectedFields.forEach((field) => delete body[field]);

      // Update invoice
      Object.assign(invoice, body);
      invoice.updatedBy = request.user._id;

      await invoice.save();

      // Populate references
      await invoice.populate('customerId', 'name companyName email customerCode');
      await invoice.populate('createdBy', 'name email');
      await invoice.populate('updatedBy', 'name email');

      logger.info('Invoice updated', {
        invoiceId: invoice._id,
        userId: request.user._id,
      });

      return successResponse({ invoice }, 'Invoice updated successfully');
    } catch (error) {
      logger.error('Error updating invoice', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        'Failed to update invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/invoices/[id]
 * Soft delete an invoice
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Find invoice
      const invoice = await SalesInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!invoice) {
        return errorResponse('Invoice not found', 404);
      }

      // Check if invoice can be deleted
      if (invoice.isPosted) {
        return errorResponse('Cannot delete posted invoice. Cancel it first.', 400);
      }

      if (invoice.paidAmount > 0) {
        return errorResponse('Cannot delete invoice with payments', 400);
      }

      // Soft delete
      invoice.isDeleted = true;
      invoice.deletedAt = new Date();
      invoice.deletedBy = request.user._id;
      invoice.status = 'cancelled';

      await invoice.save();

      logger.info('Invoice deleted', {
        invoiceId: invoice._id,
        userId: request.user._id,
      });

      return successResponse({ invoice }, 'Invoice deleted successfully');
    } catch (error) {
      logger.error('Error deleting invoice', error);

      return errorResponse(
        'Failed to delete invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
