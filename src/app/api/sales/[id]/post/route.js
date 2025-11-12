/**
 * Post Walk-in Sale API
 * Posts a walk-in sale and creates accounting voucher with ledger entries
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import WalkInSale from '@/models/WalkInSale';
import Voucher from '@/models/Voucher';
import LedgerEntry from '@/models/LedgerEntry';
import Account from '@/models/Account';
import Organization from '@/models/Organization';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/sales/[id]/post
 * Post walk-in sale and create accounting voucher
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    const session = await connectDB().then(() => mongoose.startSession());

    try {
      await session.startTransaction();

      const { id } = params;

      // Find sale
      const sale = await WalkInSale.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      }).session(session);

      if (!sale) {
        await session.abortTransaction();
        return errorResponse('Sale not found', 404);
      }

      // Check if already posted
      if (sale.isPosted) {
        await session.abortTransaction();
        return errorResponse('Sale is already posted', 400);
      }

      // Check if cancelled
      if (sale.status === 'cancelled') {
        await session.abortTransaction();
        return errorResponse('Cannot post cancelled sale', 400);
      }

      // Find or get default accounts
      // Cash Account (Debit - we received cash)
      let cashAccount = sale.cashAccountId
        ? await Account.findById(sale.cashAccountId).session(session)
        : await Account.findOne({
            organizationId: request.user.organizationId,
            code: '1001001', // Cash in Hand
            isDeleted: false,
          }).session(session);

      // Revenue Account (Credit - revenue earned)
      let revenueAccount = sale.revenueAccountId
        ? await Account.findById(sale.revenueAccountId).session(session)
        : await Account.findOne({
            organizationId: request.user.organizationId,
            code: '4001001', // Sales Revenue
            isDeleted: false,
          }).session(session);

      if (!cashAccount) {
        await session.abortTransaction();
        return errorResponse('Cash account not found. Please set up chart of accounts.', 400);
      }

      if (!revenueAccount) {
        await session.abortTransaction();
        return errorResponse('Sales Revenue account not found. Please set up chart of accounts.', 400);
      }

      // Get tax account if tax is applicable
      let taxAccount = null;
      if (sale.totalTax > 0) {
        taxAccount = sale.taxAccountId
          ? await Account.findById(sale.taxAccountId).session(session)
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
        'RV', // Receipt Voucher for cash received
        sale.fiscalYear
      );

      // Prepare voucher entries
      const voucherEntries = [];

      // Debit: Cash in Hand (we received cash)
      voucherEntries.push({
        accountId: cashAccount._id,
        type: 'debit',
        amount: sale.totalAmount,
        description: `Cash sale ${sale.receiptNumber} - ${sale.customerName}`,
      });

      // Credit: Sales Revenue
      const revenueAmount = sale.taxableAmount;
      voucherEntries.push({
        accountId: revenueAccount._id,
        type: 'credit',
        amount: revenueAmount,
        description: `Walk-in sale revenue - ${sale.receiptNumber}`,
      });

      // Credit: Sales Tax Payable (if applicable)
      if (sale.totalTax > 0 && taxAccount) {
        voucherEntries.push({
          accountId: taxAccount._id,
          type: 'credit',
          amount: sale.totalTax,
          description: `Sales tax - Receipt ${sale.receiptNumber}`,
        });
      }

      // Create voucher
      const voucher = new Voucher({
        voucherNumber,
        voucherType: 'RV',
        voucherDate: sale.saleDate,
        narration: `Walk-in Sale ${sale.receiptNumber} - ${sale.customerName} - ${sale.items[0]?.description || 'Sale'} - ${sale.paymentMethod}`,
        entries: voucherEntries,
        organizationId: request.user.organizationId,
        fiscalYear: sale.fiscalYear,
        fiscalPeriod: sale.fiscalPeriod,
        referenceType: 'walk_in_sale',
        referenceId: sale._id,
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

      // Post sale and link voucher
      sale.voucherId = voucher._id;
      sale.cashAccountId = cashAccount._id;
      sale.revenueAccountId = revenueAccount._id;
      if (taxAccount) {
        sale.taxAccountId = taxAccount._id;
      }
      await sale.post(request.user._id);
      await sale.save({ session });

      await session.commitTransaction();

      // Populate and return
      await sale.populate('voucherId', 'voucherNumber voucherType');
      await sale.populate('postedBy', 'name email');

      logger.info('Walk-in sale posted', {
        saleId: sale._id,
        receiptNumber: sale.receiptNumber,
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        userId: request.user._id,
      });

      return successResponse(
        { sale, voucher },
        'Sale posted successfully and accounting entries created'
      );
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error posting walk-in sale', error);

      return errorResponse(
        'Failed to post sale',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    } finally {
      session.endSession();
    }
  });
}
