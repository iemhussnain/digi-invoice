/**
 * Account Model
 * Chart of Accounts for Pakistani accounting system
 */

import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    // Account Identification
    code: {
      type: String,
      required: [true, 'Account code is required'],
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      minlength: [2, 'Account name must be at least 2 characters'],
      maxlength: [200, 'Account name cannot exceed 200 characters'],
    },

    // Account Classification
    type: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['asset', 'liability', 'equity', 'revenue', 'expense'],
        message: 'Invalid account type',
      },
    },

    category: {
      type: String,
      required: [true, 'Account category is required'],
      enum: {
        values: [
          // Assets
          'current_asset',
          'fixed_asset',
          'other_asset',

          // Liabilities
          'current_liability',
          'long_term_liability',
          'other_liability',

          // Equity
          'owner_equity',
          'retained_earnings',

          // Revenue
          'sales_revenue',
          'other_revenue',

          // Expenses
          'cost_of_goods_sold',
          'operating_expense',
          'financial_expense',
          'other_expense',
        ],
        message: 'Invalid account category',
      },
    },

    // Hierarchy
    parentAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 5, // Maximum 5 levels of hierarchy
    },

    isGroup: {
      type: Boolean,
      default: false, // If true, this is a parent/group account
    },

    // Organization
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },

    // Description
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Financial Properties
    normalBalance: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },

    currency: {
      code: {
        type: String,
        default: 'PKR',
      },
      symbol: {
        type: String,
        default: '₨',
      },
    },

    // Opening Balance
    openingBalance: {
      type: Number,
      default: 0,
      set: (val) => parseFloat(val.toFixed(2)),
    },

    openingBalanceDate: {
      type: Date,
      default: Date.now,
    },

    // Current Balance (cached for performance)
    currentBalance: {
      type: Number,
      default: 0,
      set: (val) => parseFloat(val.toFixed(2)),
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    isSystemAccount: {
      type: Boolean,
      default: false, // System accounts can't be deleted
    },

    // Tax Related
    isTaxAccount: {
      type: Boolean,
      default: false,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Banking
    isBankAccount: {
      type: Boolean,
      default: false,
    },

    bankDetails: {
      bankName: String,
      accountNumber: String,
      iban: String,
      branchCode: String,
      branchName: String,
    },

    // Additional Settings
    allowManualEntry: {
      type: Boolean,
      default: true, // Some accounts only accept automated entries
    },

    requireDescription: {
      type: Boolean,
      default: false, // Require description in journal entries
    },

    // Metadata
    tags: [String],

    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    // Audit Fields
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },

    deletedAt: {
      type: Date,
      select: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
accountSchema.index({ organizationId: 1, code: 1 }, { unique: true });
accountSchema.index({ organizationId: 1, type: 1 });
accountSchema.index({ organizationId: 1, category: 1 });
accountSchema.index({ organizationId: 1, isActive: 1 });
accountSchema.index({ organizationId: 1, parentAccountId: 1 });
accountSchema.index({ isDeleted: 1 });

// Virtual for full account name (including parent hierarchy)
accountSchema.virtual('fullName').get(function () {
  // This will be populated with parent names in queries
  return this.name;
});

// Virtual for checking if account has children
accountSchema.virtual('hasChildren').get(function () {
  return this.isGroup;
});

// Pre-save middleware to set normal balance based on type
accountSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('type')) {
    // Set normal balance based on account type
    switch (this.type) {
      case 'asset':
      case 'expense':
        this.normalBalance = 'debit';
        break;
      case 'liability':
      case 'equity':
      case 'revenue':
        this.normalBalance = 'credit';
        break;
    }
  }

  // Uppercase the code
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }

  next();
});

// Method to get account hierarchy path
accountSchema.methods.getHierarchyPath = async function () {
  const path = [this];
  let current = this;

  while (current.parentAccountId) {
    current = await this.model('Account').findById(current.parentAccountId);
    if (current) {
      path.unshift(current);
    } else {
      break;
    }
  }

  return path;
};

// Method to get all child accounts
accountSchema.methods.getChildren = async function () {
  return await this.model('Account').find({
    parentAccountId: this._id,
    isDeleted: false,
  });
};

// Method to check if account can be deleted
accountSchema.methods.canDelete = function () {
  // System accounts cannot be deleted
  if (this.isSystemAccount) {
    return { canDelete: false, reason: 'System accounts cannot be deleted' };
  }

  // Check if account has children
  if (this.isGroup) {
    return { canDelete: false, reason: 'Cannot delete account with child accounts' };
  }

  // Check if account has transactions (would need to check journal entries)
  // This will be implemented when we create journal entry model

  return { canDelete: true };
};

// Static method to get accounts by type
accountSchema.statics.getByType = function (organizationId, type) {
  return this.find({
    organizationId,
    type,
    isDeleted: false,
    isActive: true,
  }).sort({ code: 1 });
};

// Static method to get accounts by category
accountSchema.statics.getByCategory = function (organizationId, category) {
  return this.find({
    organizationId,
    category,
    isDeleted: false,
    isActive: true,
  }).sort({ code: 1 });
};

// Static method to get root accounts (no parent)
accountSchema.statics.getRootAccounts = function (organizationId) {
  return this.find({
    organizationId,
    parentAccountId: null,
    isDeleted: false,
  }).sort({ code: 1 });
};

// Static method to get account tree structure
accountSchema.statics.getAccountTree = async function (organizationId) {
  const accounts = await this.find({
    organizationId,
    isDeleted: false,
  }).sort({ code: 1 });

  // Build tree structure
  const buildTree = (parentId = null) => {
    return accounts
      .filter((acc) => {
        if (parentId === null) {
          return acc.parentAccountId === null;
        }
        return acc.parentAccountId?.toString() === parentId.toString();
      })
      .map((acc) => ({
        ...acc.toObject(),
        children: buildTree(acc._id),
      }));
  };

  return buildTree();
};

// Static method to seed default Chart of Accounts (Pakistan)
accountSchema.statics.seedDefaultCOA = async function (organizationId) {
  const defaultAccounts = [
    // ASSETS (1000-1999)
    {
      code: '1000',
      name: 'Assets',
      type: 'asset',
      category: 'current_asset',
      isGroup: true,
      isSystemAccount: true,
    },

    // Current Assets (1100-1399)
    {
      code: '1100',
      name: 'Current Assets',
      type: 'asset',
      category: 'current_asset',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '1000',
    },
    {
      code: '1101',
      name: 'Cash in Hand',
      type: 'asset',
      category: 'current_asset',
      isSystemAccount: true,
      parentCode: '1100',
    },
    {
      code: '1102',
      name: 'Cash at Bank',
      type: 'asset',
      category: 'current_asset',
      isBankAccount: true,
      isSystemAccount: true,
      parentCode: '1100',
    },
    {
      code: '1103',
      name: 'Petty Cash',
      type: 'asset',
      category: 'current_asset',
      isSystemAccount: true,
      parentCode: '1100',
    },
    {
      code: '1200',
      name: 'Accounts Receivable',
      type: 'asset',
      category: 'current_asset',
      isSystemAccount: true,
      parentCode: '1100',
    },
    {
      code: '1300',
      name: 'Inventory',
      type: 'asset',
      category: 'current_asset',
      isSystemAccount: true,
      parentCode: '1100',
    },

    // Fixed Assets (1400-1699)
    {
      code: '1400',
      name: 'Fixed Assets',
      type: 'asset',
      category: 'fixed_asset',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '1000',
    },
    {
      code: '1401',
      name: 'Land & Building',
      type: 'asset',
      category: 'fixed_asset',
      isSystemAccount: true,
      parentCode: '1400',
    },
    {
      code: '1402',
      name: 'Plant & Machinery',
      type: 'asset',
      category: 'fixed_asset',
      isSystemAccount: true,
      parentCode: '1400',
    },
    {
      code: '1403',
      name: 'Furniture & Fixtures',
      type: 'asset',
      category: 'fixed_asset',
      isSystemAccount: true,
      parentCode: '1400',
    },
    {
      code: '1404',
      name: 'Vehicles',
      type: 'asset',
      category: 'fixed_asset',
      isSystemAccount: true,
      parentCode: '1400',
    },
    {
      code: '1405',
      name: 'Computer Equipment',
      type: 'asset',
      category: 'fixed_asset',
      isSystemAccount: true,
      parentCode: '1400',
    },

    // LIABILITIES (2000-2999)
    {
      code: '2000',
      name: 'Liabilities',
      type: 'liability',
      category: 'current_liability',
      isGroup: true,
      isSystemAccount: true,
    },

    // Current Liabilities (2100-2399)
    {
      code: '2100',
      name: 'Current Liabilities',
      type: 'liability',
      category: 'current_liability',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '2000',
    },
    {
      code: '2101',
      name: 'Accounts Payable',
      type: 'liability',
      category: 'current_liability',
      isSystemAccount: true,
      parentCode: '2100',
    },
    {
      code: '2102',
      name: 'Sales Tax Payable',
      type: 'liability',
      category: 'current_liability',
      isTaxAccount: true,
      taxRate: 18,
      isSystemAccount: true,
      parentCode: '2100',
    },
    {
      code: '2103',
      name: 'Income Tax Payable',
      type: 'liability',
      category: 'current_liability',
      isTaxAccount: true,
      isSystemAccount: true,
      parentCode: '2100',
    },
    {
      code: '2104',
      name: 'Salary Payable',
      type: 'liability',
      category: 'current_liability',
      isSystemAccount: true,
      parentCode: '2100',
    },

    // Long-term Liabilities (2400-2699)
    {
      code: '2400',
      name: 'Long-term Liabilities',
      type: 'liability',
      category: 'long_term_liability',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '2000',
    },
    {
      code: '2401',
      name: 'Long-term Loans',
      type: 'liability',
      category: 'long_term_liability',
      isSystemAccount: true,
      parentCode: '2400',
    },

    // EQUITY (3000-3999)
    {
      code: '3000',
      name: 'Owner Equity',
      type: 'equity',
      category: 'owner_equity',
      isGroup: true,
      isSystemAccount: true,
    },
    {
      code: '3001',
      name: 'Capital',
      type: 'equity',
      category: 'owner_equity',
      isSystemAccount: true,
      parentCode: '3000',
    },
    {
      code: '3002',
      name: 'Retained Earnings',
      type: 'equity',
      category: 'retained_earnings',
      isSystemAccount: true,
      parentCode: '3000',
    },
    {
      code: '3003',
      name: 'Current Year Earnings',
      type: 'equity',
      category: 'retained_earnings',
      isSystemAccount: true,
      parentCode: '3000',
    },

    // REVENUE (4000-4999)
    {
      code: '4000',
      name: 'Revenue',
      type: 'revenue',
      category: 'sales_revenue',
      isGroup: true,
      isSystemAccount: true,
    },
    {
      code: '4001',
      name: 'Sales Revenue',
      type: 'revenue',
      category: 'sales_revenue',
      isSystemAccount: true,
      parentCode: '4000',
    },
    {
      code: '4002',
      name: 'Service Revenue',
      type: 'revenue',
      category: 'sales_revenue',
      isSystemAccount: true,
      parentCode: '4000',
    },
    {
      code: '4100',
      name: 'Other Revenue',
      type: 'revenue',
      category: 'other_revenue',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '4000',
    },
    {
      code: '4101',
      name: 'Interest Income',
      type: 'revenue',
      category: 'other_revenue',
      isSystemAccount: true,
      parentCode: '4100',
    },

    // EXPENSES (5000-5999)
    {
      code: '5000',
      name: 'Expenses',
      type: 'expense',
      category: 'operating_expense',
      isGroup: true,
      isSystemAccount: true,
    },

    // Cost of Goods Sold (5100-5199)
    {
      code: '5100',
      name: 'Cost of Goods Sold',
      type: 'expense',
      category: 'cost_of_goods_sold',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '5000',
    },
    {
      code: '5101',
      name: 'Purchases',
      type: 'expense',
      category: 'cost_of_goods_sold',
      isSystemAccount: true,
      parentCode: '5100',
    },
    {
      code: '5102',
      name: 'Direct Labor',
      type: 'expense',
      category: 'cost_of_goods_sold',
      isSystemAccount: true,
      parentCode: '5100',
    },

    // Operating Expenses (5200-5799)
    {
      code: '5200',
      name: 'Operating Expenses',
      type: 'expense',
      category: 'operating_expense',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '5000',
    },
    {
      code: '5201',
      name: 'Salaries & Wages',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },
    {
      code: '5202',
      name: 'Rent Expense',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },
    {
      code: '5203',
      name: 'Utilities Expense',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },
    {
      code: '5204',
      name: 'Telephone & Internet',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },
    {
      code: '5205',
      name: 'Office Supplies',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },
    {
      code: '5206',
      name: 'Depreciation Expense',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },
    {
      code: '5207',
      name: 'Insurance Expense',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },
    {
      code: '5208',
      name: 'Repairs & Maintenance',
      type: 'expense',
      category: 'operating_expense',
      isSystemAccount: true,
      parentCode: '5200',
    },

    // Financial Expenses (5800-5899)
    {
      code: '5800',
      name: 'Financial Expenses',
      type: 'expense',
      category: 'financial_expense',
      isGroup: true,
      isSystemAccount: true,
      parentCode: '5000',
    },
    {
      code: '5801',
      name: 'Interest Expense',
      type: 'expense',
      category: 'financial_expense',
      isSystemAccount: true,
      parentCode: '5800',
    },
    {
      code: '5802',
      name: 'Bank Charges',
      type: 'expense',
      category: 'financial_expense',
      isSystemAccount: true,
      parentCode: '5800',
    },
  ];

  // First pass: Create all accounts without parent references
  const accountMap = new Map();

  for (const accData of defaultAccounts) {
    const { parentCode, ...accountFields } = accData;

    const account = await this.create({
      ...accountFields,
      organizationId,
      parentAccountId: null, // Will be set in second pass
      level: 1, // Will be calculated in second pass
    });

    accountMap.set(account.code, account);
  }

  // Second pass: Set parent references and levels
  for (const accData of defaultAccounts) {
    if (accData.parentCode) {
      const account = accountMap.get(accData.code);
      const parent = accountMap.get(accData.parentCode);

      if (account && parent) {
        account.parentAccountId = parent._id;
        account.level = parent.level + 1;
        await account.save();
      }
    }
  }

  return accountMap.size;
};

// Remove sensitive data from JSON
accountSchema.methods.toJSON = function () {
  const account = this.toObject();
  delete account.__v;
  return account;
};

// Create model
const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);

export default Account;
