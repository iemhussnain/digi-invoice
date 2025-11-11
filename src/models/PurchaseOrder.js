/**
 * Purchase Order Model
 * For managing purchase orders to suppliers
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// Purchase Order Item Schema
const purchaseOrderItemSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },

    unit: {
      type: String,
      trim: true,
      default: 'pcs',
    },

    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative'],
    },

    amount: {
      type: Number,
      required: true,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    discountRate: {
      type: Number,
      default: 0,
      min: [0, 'Discount rate cannot be negative'],
      max: [100, 'Discount rate cannot exceed 100%'],
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      required: true,
    },

    // Delivery tracking
    receivedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Received quantity cannot be negative'],
    },

    pendingQuantity: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

// Main Purchase Order Schema
const purchaseOrderSchema = new Schema(
  {
    // Organization reference
    organizationId: {
      type: ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // PO identification
    poNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    poDate: {
      type: Date,
      required: [true, 'PO date is required'],
      default: Date.now,
    },

    // Supplier reference
    supplierId: {
      type: ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
      index: true,
    },

    // Items
    items: {
      type: [purchaseOrderItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Purchase order must have at least one item',
      },
    },

    // Amounts
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },

    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },

    taxableAmount: {
      type: Number,
      required: true,
      min: [0, 'Taxable amount cannot be negative'],
    },

    totalTax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },

    shippingCharges: {
      type: Number,
      default: 0,
      min: [0, 'Shipping charges cannot be negative'],
    },

    otherCharges: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },

    // Tax details
    taxType: {
      type: String,
      enum: ['none', 'gst', 'sales_tax', 'inclusive', 'exclusive'],
      default: 'inclusive',
    },

    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },

    // Delivery details
    deliveryDate: {
      type: Date,
    },

    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Pakistan',
      },
    },

    // Payment terms
    paymentTerms: {
      type: String,
      enum: ['advance', 'cash_on_delivery', 'credit', 'net_30', 'net_60', 'net_90'],
      default: 'credit',
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
      index: true,
    },

    // Sent tracking
    sentAt: {
      type: Date,
    },

    sentBy: {
      type: ObjectId,
      ref: 'User',
    },

    sentTo: {
      type: String, // Email address
      trim: true,
      lowercase: true,
    },

    // Confirmation tracking
    confirmedAt: {
      type: Date,
    },

    confirmedBy: {
      type: ObjectId,
      ref: 'User',
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    internalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
    },

    // Terms and conditions
    terms: {
      type: String,
      trim: true,
      maxlength: [2000, 'Terms cannot exceed 2000 characters'],
    },

    // Accounting integration (for future use when receiving goods)
    voucherId: {
      type: ObjectId,
      ref: 'Voucher',
    },

    payableAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    expenseAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    taxAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    // Posted status (will be used when goods are received)
    isPosted: {
      type: Boolean,
      default: false,
      index: true,
    },

    postedAt: {
      type: Date,
    },

    postedBy: {
      type: ObjectId,
      ref: 'User',
    },

    // Fiscal tracking
    fiscalYear: {
      type: String,
    },

    fiscalPeriod: {
      type: String,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: ObjectId,
      ref: 'User',
    },

    // Audit fields
    createdBy: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
purchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ organizationId: 1, poDate: 1 });
purchaseOrderSchema.index({ organizationId: 1, supplierId: 1 });
purchaseOrderSchema.index({ organizationId: 1, status: 1 });
purchaseOrderSchema.index({ organizationId: 1, isDeleted: 1 });

// Static method to generate PO number
purchaseOrderSchema.statics.generatePONumber = async function (organizationId, fiscalYear) {
  const year = fiscalYear || new Date().getFullYear().toString();
  const prefix = `PO-${year}-`;

  const lastPO = await this.findOne({
    organizationId,
    poNumber: new RegExp(`^${prefix}`),
  })
    .sort({ poNumber: -1 })
    .select('poNumber')
    .lean();

  if (!lastPO) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastPO.poNumber.split('-')[2]);
  const newNumber = lastNumber + 1;
  return `${prefix}${newNumber.toString().padStart(4, '0')}`;
};

// Pre-save hook to calculate amounts
purchaseOrderSchema.pre('save', function (next) {
  // Calculate item amounts
  this.items.forEach((item) => {
    // Calculate base amount
    item.amount = item.quantity * item.rate;

    // Calculate discount
    if (item.discountRate > 0) {
      item.discountAmount = (item.amount * item.discountRate) / 100;
    }

    // Amount after discount
    const amountAfterDiscount = item.amount - item.discountAmount;

    // Calculate tax
    if (item.taxRate > 0) {
      item.taxAmount = (amountAfterDiscount * item.taxRate) / 100;
    }

    // Net amount
    item.netAmount = amountAfterDiscount + item.taxAmount;

    // Calculate pending quantity
    item.pendingQuantity = item.quantity - item.receivedQuantity;
  });

  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.totalDiscount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
  this.taxableAmount = this.subtotal - this.totalDiscount;
  this.totalTax = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
  this.totalAmount = this.taxableAmount + this.totalTax + this.shippingCharges + this.otherCharges;

  // Set fiscal period
  if (this.poDate) {
    const date = new Date(this.poDate);
    this.fiscalYear = date.getFullYear().toString();
    this.fiscalPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Update status based on received quantities
  if (this.status !== 'draft' && this.status !== 'sent' && this.status !== 'cancelled') {
    const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);

    if (totalReceived === 0) {
      this.status = 'confirmed';
    } else if (totalReceived >= totalQuantity) {
      this.status = 'received';
    } else {
      this.status = 'partially_received';
    }
  }

  next();
});

// Method to send PO to supplier
purchaseOrderSchema.methods.send = async function (userId, email) {
  if (this.status !== 'draft') {
    throw new Error('Only draft purchase orders can be sent');
  }

  this.status = 'sent';
  this.sentAt = new Date();
  this.sentBy = userId;
  this.sentTo = email;
  this.updatedBy = userId;

  return await this.save();
};

// Method to confirm PO
purchaseOrderSchema.methods.confirm = async function (userId) {
  if (this.status !== 'sent') {
    throw new Error('Only sent purchase orders can be confirmed');
  }

  this.status = 'confirmed';
  this.confirmedAt = new Date();
  this.confirmedBy = userId;
  this.updatedBy = userId;

  return await this.save();
};

// Method to cancel PO
purchaseOrderSchema.methods.cancel = async function (userId) {
  if (this.isPosted) {
    throw new Error('Cannot cancel posted purchase order');
  }

  if (this.status === 'received' || this.status === 'partially_received') {
    throw new Error('Cannot cancel purchase order with received items');
  }

  this.status = 'cancelled';
  this.updatedBy = userId;

  return await this.save();
};

// Virtual for completion percentage
purchaseOrderSchema.virtual('completionPercentage').get(function () {
  const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);

  if (totalQuantity === 0) return 0;
  return Math.round((totalReceived / totalQuantity) * 100);
});

// Query middleware to exclude soft-deleted records
purchaseOrderSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const PurchaseOrder =
  mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
