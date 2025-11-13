/**
 * Single Customer API
 * Handles get, update, delete operations for a specific customer
 */

import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      const customer = await Customer.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('accountId', 'code name type')
        .lean();

      if (!customer) {
        return errorResponse('Customer not found', 404);
      }

      logger.info('Customer retrieved', {
        customerId: customer._id,
        userId: request.user._id,
      });

      return successResponse({ customer });
    } catch (error) {
      logger.error('Error fetching customer', error);

      return errorResponse(
        'Failed to fetch customer',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/customers/[id]
 * Update a customer
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();

      // Find customer
      const customer = await Customer.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!customer) {
        return errorResponse('Customer not found', 404);
      }

      // Validate unique email within organization (if being changed)
      if (body.email && body.email !== customer.email) {
        const existingCustomer = await Customer.findOne({
          organizationId: request.user.organizationId,
          email: body.email,
          isDeleted: false,
          _id: { $ne: id },
        });

        if (existingCustomer) {
          return errorResponse('A customer with this email already exists', 400);
        }
      }

      // Fields that should not be updated directly
      const protectedFields = [
        '_id',
        'customerCode',
        'organizationId',
        'createdBy',
        'createdAt',
        'isDeleted',
        'deletedAt',
        'deletedBy',
      ];

      // Remove protected fields from update
      protectedFields.forEach((field) => delete body[field]);

      // Update customer
      Object.assign(customer, body);
      customer.updatedBy = request.user._id;

      await customer.save();

      // Populate references
      await customer.populate('createdBy', 'name email');
      await customer.populate('updatedBy', 'name email');
      if (customer.accountId) {
        await customer.populate('accountId', 'code name type');
      }

      logger.info('Customer updated', {
        customerId: customer._id,
        userId: request.user._id,
      });

      return successResponse({ customer }, 'Customer updated successfully');
    } catch (error) {
      logger.error('Error updating customer', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        'Failed to update customer',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/customers/[id]
 * Soft delete a customer
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Find customer
      const customer = await Customer.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!customer) {
        return errorResponse('Customer not found', 404);
      }

      // Check if customer has outstanding balance
      if (customer.currentBalance > 0) {
        return errorResponse(
          'Cannot delete customer with outstanding balance. Please settle the account first.',
          400
        );
      }

      // Soft delete
      customer.isDeleted = true;
      customer.deletedAt = new Date();
      customer.deletedBy = request.user._id;
      customer.isActive = false;

      await customer.save();

      logger.info('Customer deleted', {
        customerId: customer._id,
        userId: request.user._id,
      });

      return successResponse({ customer }, 'Customer deleted successfully');
    } catch (error) {
      logger.error('Error deleting customer', error);

      return errorResponse(
        'Failed to delete customer',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
