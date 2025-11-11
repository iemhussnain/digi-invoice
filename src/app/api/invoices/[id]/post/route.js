/**
 * Post Invoice API
 * Posts an invoice and creates accounting voucher with ledger entries
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import SalesInvoice from '@/models/SalesInvoice';
import Voucher from '@/models/Voucher';
import LedgerEntry from '@/models/LedgerEntry';
import Customer from '@/models/Customer';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/invoices/[id]/post
 * Post invoice and create accounting voucher
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    const session = await connectDB().then(() => mongoose.startSession());

    try {
      await session.startTransaction();

      const { id } = params;

      // Find invoice
      const invoice = await SalesInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      }).session(session);

      if (!invoice) {
        await session.abortTransaction();
        return errorResponse('Invoice not found', 404);
      }

      // Check if already posted
      if (invoice.isPosted) {
        await session.abortTransaction();
        return errorResponse('Invoice is already posted', 400);
      }

      // Check if cancelled
      if (invoice.status === 'cancelled') {
        await session.abortTransaction();
        return errorResponse('Cannot post cancelled invoice', 400);
      }

      // Get customer
      const customer = await Customer.findById(invoice.customerId).session(session);
      if (!customer) {
        await session.abortTransaction();
        return errorResponse('Customer not found', 404);
      }

      // Find or get default accounts
      let receivableAccount = invoice.receivableAccountId
        ? await Account.findById(invoice.receivableAccountId).session(session)
        : await Account.findOne({
            organizationId: request.user.organizationId,
            code: '1003001', // Accounts Receivable
            isDeleted: false,
          }).session(session);

      let revenueAccount = invoice.revenueAccountId
        ? await Account.findById(invoice.revenueAccountId).session(session)
        : await Account.findOne({
            organizationId: request.user.organizationId,
            code: '4001001', // Sales Revenue
            isDeleted: false,
          }).session(session);

      if (!receivableAccount) {
        await session.abortTransaction();
        return errorResponse('Accounts Receivable account not found. Please set up chart of accounts.', 400);
      }

      if (!revenueAccount) {
        await session.abortTransaction();
        return errorResponse('Sales Revenue account not found. Please set up chart of accounts.', 400);
      }

      // Get tax account if tax is applicable
      let taxAccount = null;
      if (invoice.totalTax > 0) {
        taxAccount = invoice.taxAccountId
          ? await Account.findById(invoice.taxAccountId).session(session)
          : await Account.findOne({
              organizationId: request.user.organizationId,
              code: '2004001', // Sales Tax Payable
              isDeleted: false,
            }).session(session);

        if (!taxAccount) {
          await session.abortTransaction();
          return errorResponse('Sales Tax account not found. Please set up chart of accounts.', 400);
        }
      }

      // Generate voucher number
      const voucherNumber = await Voucher.generateVoucherNumber(
        request.user.organizationId,
        'JV',
        invoice.fiscalYear
      );

      // Prepare voucher entries
      const voucherEntries = [];

      // Debit: Accounts Receivable (Customer owes us)
      voucherEntries.push({
        accountId: receivableAccount._id,
        type: 'debit',
        amount: invoice.totalAmount,
        description: `Sales invoice ${invoice.invoiceNumber} - ${customer.name}`,
      });

      // Credit: Sales Revenue
      const revenueAmount = invoice.taxableAmount + invoice.shippingCharges + invoice.otherCharges;
      voucherEntries.push({
        accountId: revenueAccount._id,
        type: 'credit',
        amount: revenueAmount,
        description: `Sales revenue - Invoice ${invoice.invoiceNumber}`,
      });

      // Credit: Sales Tax Payable (if applicable)
      if (invoice.totalTax > 0 && taxAccount) {
        voucherEntries.push({
          accountId: taxAccount._id,
          type: 'credit',
          amount: invoice.totalTax,
          description: `Sales tax - Invoice ${invoice.invoiceNumber}`,
        });
      }

      // Create voucher
      const voucher = new Voucher({
        voucherNumber,
        voucherType: 'JV',
        voucherDate: invoice.invoiceDate,
        narration: `Sales Invoice ${invoice.invoiceNumber} - ${customer.name} - ${invoice.items[0]?.description || 'Sale'}`,
        entries: voucherEntries,
        organizationId: request.user.organizationId,
        fiscalYear: invoice.fiscalYear,
        fiscalPeriod: invoice.fiscalPeriod,
        referenceType: 'invoice',
        referenceId: invoice._id,
        status: 'draft',
        createdBy: request.user._id,
      });

      // Validate double-entry
      const validation = voucher.validateDoubleEntry();
      if (!validation.isValid) {
        await session.abortTransaction();
        return errorResponse('Voucher validation failed: ' + validation.errors.join(', '), 400);
      }

      await voucher.save({ session });

      // Post voucher and create ledger entries
      await voucher.post(request.user._id, session);
      await LedgerEntry.createFromVoucher(voucher, request.user._id, session);

      // Update customer balance
      await customer.updateBalance(invoice.totalAmount, 'debit');
      await customer.save({ session });

      // Post invoice and link voucher
      invoice.voucherId = voucher._id;
      invoice.receivableAccountId = receivableAccount._id;
      invoice.revenueAccountId = revenueAccount._id;
      if (taxAccount) {
        invoice.taxAccountId = taxAccount._id;
      }
      await invoice.post(request.user._id);
      await invoice.save({ session });

      await session.commitTransaction();

      // Populate and return
      await invoice.populate('customerId', 'name companyName email customerCode');
      await invoice.populate('voucherId', 'voucherNumber voucherType');
      await invoice.populate('postedBy', 'name email');

      logger.info('Invoice posted', {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      return successResponse(
        { invoice, voucher },
        'Invoice posted successfully and accounting entries created'
      );
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error posting invoice', error);

      return errorResponse(
        'Failed to post invoice',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    } finally {
      session.endSession();
    }
  });
}
