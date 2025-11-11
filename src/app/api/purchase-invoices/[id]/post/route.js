/**
 * Purchase Invoice Post to Accounts API
 * Posts purchase invoice to accounts and generates Journal Voucher
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import PurchaseInvoice from '@/models/PurchaseInvoice';
import Voucher from '@/models/Voucher';
import Account from '@/models/Account';
import Supplier from '@/models/Supplier';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST /api/purchase-invoices/[id]/post
 * Post purchase invoice to accounts (creates Journal Voucher with double-entry)
 */
export async function POST(request, { params }) {
  return withAuth(request, async (request) => {
    const session = await connectDB().then(() => mongoose.startSession());

    try {
      await session.startTransaction();

      const { id } = params;

      // Find purchase invoice
      const purchaseInvoice = await PurchaseInvoice.findOne({
        _id: id,
        organizationId: request.user.organizationId,
        isDeleted: false,
      }).session(session);

      if (!purchaseInvoice) {
        await session.abortTransaction();
        return errorResponse('Purchase invoice not found', 404);
      }

      // Post using model method (validates status)
      await purchaseInvoice.post(request.user._id);

      // Find or create default accounts
      let expenseAccount = await Account.findOne({
        organizationId: request.user.organizationId,
        code: '5-100',
        isDeleted: false,
      }).session(session);

      if (!expenseAccount) {
        // Create default Purchases/Expense account
        expenseAccount = new Account({
          organizationId: request.user.organizationId,
          code: '5-100',
          name: 'Purchases',
          accountType: 'expense',
          category: 'operating_expense',
          isActive: true,
          level: 2,
          createdBy: request.user._id,
        });
        await expenseAccount.save({ session });
      }

      let payableAccount = await Account.findOne({
        organizationId: request.user.organizationId,
        code: '2-100',
        isDeleted: false,
      }).session(session);

      if (!payableAccount) {
        // Create default Accounts Payable account
        payableAccount = new Account({
          organizationId: request.user.organizationId,
          code: '2-100',
          name: 'Accounts Payable',
          accountType: 'liability',
          category: 'current_liability',
          isActive: true,
          level: 2,
          createdBy: request.user._id,
        });
        await payableAccount.save({ session });
      }

      let taxAccount = null;
      if (purchaseInvoice.totalTax > 0) {
        taxAccount = await Account.findOne({
          organizationId: request.user.organizationId,
          code: '1-140',
          isDeleted: false,
        }).session(session);

        if (!taxAccount) {
          // Create default Input Tax account (Asset - Prepaid Tax)
          taxAccount = new Account({
            organizationId: request.user.organizationId,
            code: '1-140',
            name: 'Input Tax / Tax Paid',
            accountType: 'asset',
            category: 'current_asset',
            isActive: true,
            level: 2,
            createdBy: request.user._id,
          });
          await taxAccount.save({ session });
        }
      }

      // Update invoice with account references
      purchaseInvoice.expenseAccountId = expenseAccount._id;
      purchaseInvoice.payableAccountId = payableAccount._id;
      if (taxAccount) {
        purchaseInvoice.taxAccountId = taxAccount._id;
      }

      // Generate voucher number
      const voucherNumber = await Voucher.generateVoucherNumber(
        request.user.organizationId,
        'JV',
        purchaseInvoice.fiscalYear
      );

      // Prepare voucher entries for double-entry accounting
      const entries = [];

      // Debit: Expense Account (for goods/services purchased)
      entries.push({
        accountId: expenseAccount._id,
        description: `Purchase Invoice ${purchaseInvoice.invoiceNumber}`,
        debit: purchaseInvoice.taxableAmount,
        credit: 0,
      });

      // Debit: Input Tax Account (if tax exists)
      if (purchaseInvoice.totalTax > 0 && taxAccount) {
        entries.push({
          accountId: taxAccount._id,
          description: `Input Tax - Invoice ${purchaseInvoice.invoiceNumber}`,
          debit: purchaseInvoice.totalTax,
          credit: 0,
        });
      }

      // Credit: Accounts Payable (total amount we owe supplier)
      entries.push({
        accountId: payableAccount._id,
        description: `Supplier Invoice ${purchaseInvoice.invoiceNumber}`,
        debit: 0,
        credit: purchaseInvoice.totalAmount,
      });

      // Create Journal Voucher
      const voucher = new Voucher({
        organizationId: request.user.organizationId,
        voucherNumber,
        voucherType: 'JV',
        voucherDate: purchaseInvoice.invoiceDate,
        entries,
        description: `Auto-generated for Purchase Invoice ${purchaseInvoice.invoiceNumber}`,
        referenceType: 'PurchaseInvoice',
        referenceId: purchaseInvoice._id,
        status: 'posted',
        isPosted: true,
        postedAt: new Date(),
        postedBy: request.user._id,
        fiscalYear: purchaseInvoice.fiscalYear,
        fiscalPeriod: purchaseInvoice.fiscalPeriod,
        createdBy: request.user._id,
      });

      await voucher.save({ session });

      // Link voucher to invoice
      purchaseInvoice.voucherId = voucher._id;
      await purchaseInvoice.save({ session });

      // Update supplier balance
      const supplier = await Supplier.findById(purchaseInvoice.supplierId).session(session);
      if (supplier) {
        await supplier.updateBalance(purchaseInvoice.totalAmount, 'credit');
        await supplier.save({ session });
      }

      await session.commitTransaction();

      // Populate and return
      await purchaseInvoice.populate('supplierId', 'supplierCode companyName');
      await purchaseInvoice.populate('voucherId', 'voucherNumber voucherDate');
      await purchaseInvoice.populate('postedBy', 'name email');

      logger.info('Purchase invoice posted to accounts', {
        purchaseInvoiceId: purchaseInvoice._id,
        invoiceNumber: purchaseInvoice.invoiceNumber,
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        totalAmount: purchaseInvoice.totalAmount,
        userId: request.user._id,
      });

      return successResponse(
        {
          purchaseInvoice,
          voucher: {
            _id: voucher._id,
            voucherNumber: voucher.voucherNumber,
            voucherDate: voucher.voucherDate,
            totalDebit: voucher.totalDebit,
            totalCredit: voucher.totalCredit,
          },
        },
        'Purchase invoice posted to accounts successfully'
      );
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error posting purchase invoice', error);

      return errorResponse(
        error.message || 'Failed to post purchase invoice to accounts',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    } finally {
      session.endSession();
    }
  });
}
