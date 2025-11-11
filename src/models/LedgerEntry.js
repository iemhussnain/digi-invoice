/**
 * Ledger Entry Model
 * Tracks all debit and credit entries for each account (Double-entry accounting)
 */

import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    // Organization
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },

    // Account
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account is required'],
    },

    // Voucher Reference
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: [true, 'Voucher is required'],
    },

    voucherNumber: {
      type: String,
      required: true,
      trim: true,
    },

    voucherType: {
      type: String,
      enum: ['JV', 'PV', 'RV', 'CV'],
      required: true,
    },

    // Entry Date
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
      default: Date.now,
    },

    // Fiscal Period
    fiscalYear: {
      type: String,
      required: true,
    },

    fiscalPeriod: {
      type: String,
      required: true,
    },

    // Debit or Credit
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: [true, 'Entry type is required'],
    },

    // Amount
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      set: (val) => parseFloat(val.toFixed(2)),
    },

    // Running Balance (after this entry)
    balance: {
      type: Number,
      default: 0,
      set: (val) => parseFloat(val.toFixed(2)),
    },

    // Description
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    narration: {
      type: String,
      maxlength: [1000, 'Narration cannot exceed 1000 characters'],
    },

    // Reference
    referenceNumber: {
      type: String,
      trim: true,
    },

    referenceType: {
      type: String,
      enum: ['invoice', 'payment', 'receipt', 'purchase', 'manual', 'other'],
      default: 'manual',
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'void'],
      default: 'active',
    },

    // Void Information
    voidedAt: {
      type: Date,
    },

    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    voidReason: {
      type: String,
      maxlength: [500, 'Void reason cannot exceed 500 characters'],
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes
ledgerEntrySchema.index({ organizationId: 1, accountId: 1, entryDate: -1 });
ledgerEntrySchema.index({ organizationId: 1, voucherId: 1 });
ledgerEntrySchema.index({ organizationId: 1, fiscalYear: 1, fiscalPeriod: 1 });
ledgerEntrySchema.index({ organizationId: 1, accountId: 1, status: 1 });
ledgerEntrySchema.index({ voucherNumber: 1 });

// Static method to create entries from voucher
ledgerEntrySchema.statics.createFromVoucher = async function(voucher, userId) {
  const entries = [];

  for (const voucherEntry of voucher.entries) {
    // Get account to determine normal balance
    const Account = mongoose.model('Account');
    const account = await Account.findById(voucherEntry.accountId);

    if (!account) {
      throw new Error(`Account not found: ${voucherEntry.accountId}`);
    }

    // Calculate new balance
    let balance = account.currentBalance || 0;

    // For debit entries
    if (voucherEntry.type === 'debit') {
      // Assets and Expenses increase with debit
      if (account.normalBalance === 'debit') {
        balance += voucherEntry.amount;
      } else {
        balance -= voucherEntry.amount;
      }
    }
    // For credit entries
    else if (voucherEntry.type === 'credit') {
      // Liabilities, Equity, and Revenue increase with credit
      if (account.normalBalance === 'credit') {
        balance += voucherEntry.amount;
      } else {
        balance -= voucherEntry.amount;
      }
    }

    // Create ledger entry
    const ledgerEntry = await this.create({
      organizationId: voucher.organizationId,
      accountId: voucherEntry.accountId,
      voucherId: voucher._id,
      voucherNumber: voucher.voucherNumber,
      voucherType: voucher.voucherType,
      entryDate: voucher.voucherDate,
      fiscalYear: voucher.fiscalYear,
      fiscalPeriod: voucher.fiscalPeriod,
      type: voucherEntry.type,
      amount: voucherEntry.amount,
      balance: parseFloat(balance.toFixed(2)),
      description: voucherEntry.description,
      narration: voucher.narration,
      referenceNumber: voucher.referenceNumber,
      referenceType: voucher.referenceType,
      referenceId: voucher.referenceId,
      status: 'active',
      createdBy: userId,
    });

    // Update account balance
    account.currentBalance = parseFloat(balance.toFixed(2));
    await account.save();

    // Update voucher entry with ledger entry reference
    voucherEntry.ledgerEntryId = ledgerEntry._id;

    entries.push(ledgerEntry);
  }

  // Save voucher with updated entry references
  await voucher.save();

  return entries;
};

// Static method to void entries for a voucher
ledgerEntrySchema.statics.voidEntriesForVoucher = async function(voucherId, userId, reason) {
  const entries = await this.find({ voucherId, status: 'active' });

  for (const entry of entries) {
    // Reverse the balance changes
    const Account = mongoose.model('Account');
    const account = await Account.findById(entry.accountId);

    if (account) {
      let balance = account.currentBalance || 0;

      // Reverse the entry
      if (entry.type === 'debit') {
        if (account.normalBalance === 'debit') {
          balance -= entry.amount;
        } else {
          balance += entry.amount;
        }
      } else if (entry.type === 'credit') {
        if (account.normalBalance === 'credit') {
          balance -= entry.amount;
        } else {
          balance += entry.amount;
        }
      }

      account.currentBalance = parseFloat(balance.toFixed(2));
      await account.save();
    }

    // Mark entry as void
    entry.status = 'void';
    entry.voidedAt = new Date();
    entry.voidedBy = userId;
    entry.voidReason = reason;
    await entry.save();
  }

  return entries;
};

// Static method to get account ledger
ledgerEntrySchema.statics.getAccountLedger = function(
  organizationId,
  accountId,
  startDate,
  endDate,
  options = {}
) {
  const query = {
    organizationId,
    accountId,
    status: options.includeVoid ? { $in: ['active', 'void'] } : 'active',
  };

  if (startDate || endDate) {
    query.entryDate = {};
    if (startDate) query.entryDate.$gte = new Date(startDate);
    if (endDate) query.entryDate.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('voucherId', 'voucherNumber voucherType narration')
    .populate('accountId', 'code name type')
    .sort({ entryDate: 1, createdAt: 1 });
};

// Static method to get trial balance
ledgerEntrySchema.statics.getTrialBalance = async function(organizationId, fiscalYear, fiscalPeriod) {
  const Account = mongoose.model('Account');

  // Get all accounts with their balances
  const accounts = await Account.find({
    organizationId,
    isDeleted: false,
  }).sort({ code: 1 });

  const trialBalance = [];

  for (const account of accounts) {
    // Get sum of debits and credits for this account in the period
    const entries = await this.find({
      organizationId,
      accountId: account._id,
      fiscalYear,
      fiscalPeriod,
      status: 'active',
    });

    let debitTotal = 0;
    let creditTotal = 0;

    entries.forEach(entry => {
      if (entry.type === 'debit') {
        debitTotal += entry.amount;
      } else {
        creditTotal += entry.amount;
      }
    });

    // Only include accounts with activity
    if (debitTotal > 0 || creditTotal > 0 || account.currentBalance !== 0) {
      trialBalance.push({
        account: {
          _id: account._id,
          code: account.code,
          name: account.name,
          type: account.type,
        },
        debit: debitTotal,
        credit: creditTotal,
        balance: account.currentBalance,
      });
    }
  }

  // Calculate totals
  const totals = trialBalance.reduce(
    (acc, item) => ({
      debit: acc.debit + item.debit,
      credit: acc.credit + item.credit,
    }),
    { debit: 0, credit: 0 }
  );

  return {
    trialBalance,
    totals,
    isBalanced: Math.abs(totals.debit - totals.credit) < 0.01,
  };
};

// Remove sensitive data from JSON
ledgerEntrySchema.methods.toJSON = function() {
  const entry = this.toObject();
  delete entry.__v;
  return entry;
};

// Create model
const LedgerEntry = mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerEntrySchema);

export default LedgerEntry;
