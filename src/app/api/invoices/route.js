/**
 * Sales Invoices API
 * Handles listing and creating invoices
 */

import connectDB from '@/lib/mongodb';
import SalesInvoice from '@/models/SalesInvoice';
import Customer from '@/models/Customer';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/invoices
 * List all invoices
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 50;
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status');
      const paymentStatus = searchParams.get('paymentStatus');
      const customerId = searchParams.get('customerId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Build query
      const query = {
        organizationId: request.user.organizationId,
        isDeleted: false,
      };

      // Add filters
      if (status) {
        query.status = status;
      }

      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      if (customerId) {
        query.customerId = customerId;
      }

      // Date range filter
      if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) query.invoiceDate.$gte = new Date(startDate);
        if (endDate) query.invoiceDate.$lte = new Date(endDate);
      }

      // Search functionality
      if (search) {
        query.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { referenceNumber: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await SalesInvoice.countDocuments(query);

      // Get invoices with pagination
      const invoices = await SalesInvoice.find(query)
        .populate('customerId', 'name companyName email customerCode')
        .populate('createdBy', 'name email')
        .populate('voucherId', 'voucherNumber')
        .sort({ invoiceDate: -1, invoiceNumber: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      logger.info('Invoices listed', {
        count: invoices.length,
        userId: request.user._id,
      });

      return successResponse({
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing invoices', error);

      return errorResponse(
        'Failed to fetch invoices',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/invoices
 * Create a new invoice
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();

      // Validate customer exists
      const customer = await Customer.findOne({
        _id: body.customerId,
        organizationId: request.user.organizationId,
        isDeleted: false,
      });

      if (!customer) {
        return errorResponse('Customer not found', 404);
      }

      // Generate invoice number if not provided
      if (!body.invoiceNumber) {
        body.invoiceNumber = await SalesInvoice.generateInvoiceNumber(
          request.user.organizationId,
          body.fiscalYear
        );
      }

      // Create invoice
      const invoice = new SalesInvoice({
        ...body,
        organizationId: request.user.organizationId,
        createdBy: request.user._id,
      });

      await invoice.save();

      // Populate references
      await invoice.populate('customerId', 'name companyName email customerCode');
      await invoice.populate('createdBy', 'name email');

      logger.info('Invoice created', {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        userId: request.user._id,
      });

      return successResponse({ invoice }, 'Invoice created successfully', 201);
    } catch (error) {
      logger.error('Error creating invoice', error);

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
        return errorResponse('Invoice number already exists', 400);
      }

      return errorResponse(
        'Failed to create invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
