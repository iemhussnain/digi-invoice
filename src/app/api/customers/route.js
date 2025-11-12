/**
 * Customers API
 * Handles listing and creating customers
 */

import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/customers
 * List all customers
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
      const customerType = searchParams.get('customerType');
      const category = searchParams.get('category');

      // Build query
      const query = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      // Add filters
      if (isActive !== null && isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      if (customerType) {
        query.customerType = customerType;
      }

      if (category) {
        query.category = category;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { customerCode: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await Customer.countDocuments(query);

      // Get customers with pagination
      const customers = await Customer.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('accountId', 'code name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      logger.info('Customers listed', {
        count: customers.length,
        userId: request.user._id,
      });

      return successResponse({
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing customers', error);

      return errorResponse(
        'Failed to fetch customers',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Generate customer code if not provided
      if (!body.customerCode) {
        body.customerCode = await Customer.generateCustomerCode(request.user.organizationId);
      }

      // Validate unique email within organization (if provided)
      if (body.email) {
        const existingCustomer = await Customer.findOne({
          organizationId: request.user.organizationId,
          email: body.email,
          isDeleted: false,
        });

        if (existingCustomer) {
          return errorResponse('A customer with this email already exists', 400);
        }
      }

      // Create customer
      const customer = new Customer({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
        currentBalance: body.openingBalance || 0,
      });

      await customer.save();

      // Populate references
      await customer.populate('createdBy', 'name email');
      if (customer.accountId) {
        await customer.populate('accountId', 'code name');
      }

      logger.info('Customer created', {
        customerId: customer._id,
        customerCode: customer.customerCode,
        userId: request.user._id,
      });

      return successResponse({ customer }, 'Customer created successfully', 201);
    } catch (error) {
      logger.error('Error creating customer', error);

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
        return errorResponse('Customer code already exists', 400);
      }

      return errorResponse(
        'Failed to create customer',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
