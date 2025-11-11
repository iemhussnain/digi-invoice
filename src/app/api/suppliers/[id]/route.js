/**
 * Single Supplier API
 * Handles get, update, delete operations for a specific supplier
 */

import connectDB from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/suppliers/[id]
 * Get a single supplier by ID
 */
export async function GET(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      const supplier = await Supplier.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .lean();

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

      logger.info('Supplier retrieved', {
        supplierId: supplier._id,
        userId: request.user._id,
      });

      return successResponse({ supplier });
    } catch (error) {
      logger.error('Error fetching supplier', error);

      return errorResponse(
        'Failed to fetch supplier',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/suppliers/[id]
 * Update a supplier
 */
export async function PUT(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();

      // Find supplier
      const supplier = await Supplier.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

      // Validate unique email if being changed
      if (body.email && body.email !== supplier.email) {
        const existingSupplier = await Supplier.findOne({
          organizationId: request.user.organizationId,
          email: body.email,
          isDeleted: false,
          _id: { $ne: id },
        });

        if (existingSupplier) {
          return errorResponse('A supplier with this email already exists', 400);
        }
      }

      // Fields that should not be updated directly
      const protectedFields = [
        '_id',
        'supplierCode',
        'organizationId',
        'createdBy',
        'createdAt',
        'currentBalance', // Use updateBalance method instead
        'isDeleted',
        'deletedAt',
        'deletedBy',
      ];

      // Remove protected fields from update
      protectedFields.forEach((field) => delete body[field]);

      // Update supplier
      Object.assign(supplier, body);
      supplier.updatedBy = request.user._id;

      await supplier.save();

      // Populate references
      await supplier.populate('createdBy', 'name email');
      await supplier.populate('updatedBy', 'name email');

      logger.info('Supplier updated', {
        supplierId: supplier._id,
        userId: request.user._id,
      });

      return successResponse({ supplier }, 'Supplier updated successfully');
    } catch (error) {
      logger.error('Error updating supplier', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      return errorResponse(
        'Failed to update supplier',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/suppliers/[id]
 * Soft delete a supplier
 */
export async function DELETE(request, { params }) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Find supplier
      const supplier = await Supplier.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

      // Check if supplier has outstanding balance
      if (supplier.currentBalance > 0) {
        return errorResponse(
          'Cannot delete supplier with outstanding balance. Please clear dues first.',
          400
        );
      }

      // Soft delete
      supplier.isDeleted = true;
      supplier.deletedAt = new Date();
      supplier.deletedBy = request.user._id;
      supplier.isActive = false;

      await supplier.save();

      logger.info('Supplier deleted', {
        supplierId: supplier._id,
        userId: request.user._id,
      });

      return successResponse({ supplier }, 'Supplier deleted successfully');
    } catch (error) {
      logger.error('Error deleting supplier', error);

      return errorResponse(
        'Failed to delete supplier',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
