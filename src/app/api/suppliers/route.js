/**
 * Suppliers API
 * Handles listing and creating suppliers
 */

import connectDB from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/suppliers
 * List all suppliers
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 50;
      const search = searchParams.get('search') || '';
      const isActive = searchParams.get('isActive');
      const category = searchParams.get('category');
      const paymentTerms = searchParams.get('paymentTerms');

      // Build query
      const query = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      // Add filters
      if (isActive !== null && isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      if (category) {
        query.category = category;
      }

      if (paymentTerms) {
        query.paymentTerms = paymentTerms;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { supplierCode: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await Supplier.countDocuments(query);

      // Get suppliers with pagination
      const suppliers = await Supplier.find(query)
        .populate('createdBy', 'name email')
        .sort({ supplierCode: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      logger.info('Suppliers listed', {
        count: suppliers.length,
        userId: request.user._id,
      });

      return successResponse({
        suppliers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing suppliers', error);

      return errorResponse(
        'Failed to fetch suppliers',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/suppliers
 * Create a new supplier
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Auto-generate supplier code if not provided
      if (!body.supplierCode) {
        body.supplierCode = await Supplier.generateSupplierCode(
          request.user.organizationId
        );
      }

      // Validate unique email if provided
      if (body.email) {
        const existingSupplier = await Supplier.findOne({
          organizationId: request.user.organizationId,
          email: body.email,
          isDeleted: false,
        });

        if (existingSupplier) {
          return errorResponse('A supplier with this email already exists', 400);
        }
      }

      // Create supplier
      const supplier = new Supplier({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
        currentBalance: body.openingBalance || 0,
      });

      await supplier.save();

      // Populate references
      await supplier.populate('createdBy', 'name email');

      logger.info('Supplier created', {
        supplierId: supplier._id,
        supplierCode: supplier.supplierCode,
        userId: request.user._id,
      });

      return successResponse({ supplier }, 'Supplier created successfully', 201);
    } catch (error) {
      logger.error('Error creating supplier', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return errorResponse('Validation failed', 400, { errors });
      }

      // Handle duplicate key error
      if (error.code === 11000) {
        return errorResponse('Supplier code already exists', 400);
      }

      return errorResponse(
        'Failed to create supplier',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
