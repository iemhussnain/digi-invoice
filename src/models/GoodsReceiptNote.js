/**
 * Goods Receipt Note Model
 * For tracking goods received from suppliers with quality inspection
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// GRN Item Schema
const grnItemSchema = new Schema(
  {
    // Reference to PO item
    poItemId: {
      type: ObjectId,
      required: true,
    },

    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },

    // Quantities
    orderedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Ordered quantity cannot be negative'],
    },

    receivedQuantity: {
      type: Number,
      required: [true, 'Received quantity is required'],
      min: [0, 'Received quantity cannot be negative'],
    },

    acceptedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Accepted quantity cannot be negative'],
    },

    rejectedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Rejected quantity cannot be negative'],
    },

    unit: {
      type: String,
      trim: true,
      default: 'pcs',
    },

    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },

    // Inspection details
    inspectionStatus: {
      type: String,
      enum: ['pending', 'passed', 'partial', 'failed'],
      default: 'pending',
    },

    inspectionRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Inspection remarks cannot exceed 500 characters'],
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },

    // Quality parameters
    qualityGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F', ''],
      default: '',
    },

    // Location tracking
    storageLocation: {
      type: String,
      trim: true,
    },

    batchNumber: {
      type: String,
      trim: true,
    },

    expiryDate: {
      type: Date,
    },
  },
  { _id: true }
);

// Main Goods Receipt Note Schema
const goodsReceiptNoteSchema = new Schema(
  {
    // Organization reference
    organizationId: {
      type: ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // GRN identification
    grnNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    grnDate: {
      type: Date,
      required: [true, 'GRN date is required'],
      default: Date.now,
    },

    // Purchase Order reference
    purchaseOrderId: {
      type: ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase order is required'],
      index: true,
    },

    // Supplier reference
    supplierId: {
      type: ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
      index: true,
    },

    // Delivery details
    deliveryNote: {
      type: String,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      trim: true,
    },

    driverName: {
      type: String,
      trim: true,
    },

    deliveredBy: {
      type: String,
      trim: true,
    },

    // Items
    items: {
      type: [grnItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'GRN must have at least one item',
      },
    },

    // Inspection details
    inspectionStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },

    inspectedBy: {
      type: ObjectId,
      ref: 'User',
    },

    inspectionDate: {
      type: Date,
    },

    inspectionRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Inspection remarks cannot exceed 1000 characters'],
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'inspected', 'posted', 'cancelled'],
      default: 'draft',
      index: true,
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

    // Accounting integration
    voucherId: {
      type: ObjectId,
      ref: 'Voucher',
    },

    inventoryAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    payableAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    taxAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    // Posted status
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
goodsReceiptNoteSchema.index({ organizationId: 1, grnNumber: 1 }, { unique: true });
goodsReceiptNoteSchema.index({ organizationId: 1, grnDate: 1 });
goodsReceiptNoteSchema.index({ organizationId: 1, purchaseOrderId: 1 });
goodsReceiptNoteSchema.index({ organizationId: 1, supplierId: 1 });
goodsReceiptNoteSchema.index({ organizationId: 1, status: 1 });
goodsReceiptNoteSchema.index({ organizationId: 1, isDeleted: 1 });

// Static method to generate GRN number
goodsReceiptNoteSchema.statics.generateGRNNumber = async function (organizationId, fiscalYear) {
  const year = fiscalYear || new Date().getFullYear().toString();
  const prefix = `GRN-${year}-`;

  const lastGRN = await this.findOne({
    organizationId,
    grnNumber: new RegExp(`^${prefix}`),
  })
    .sort({ grnNumber: -1 })
    .select('grnNumber')
    .lean();

  if (!lastGRN) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastGRN.grnNumber.split('-')[2]);
  const newNumber = lastNumber + 1;
  return `${prefix}${newNumber.toString().padStart(4, '0')}`;
};

// Pre-save hook to calculate values
goodsReceiptNoteSchema.pre('save', function (next) {
  // Set fiscal period
  if (this.grnDate) {
    const date = new Date(this.grnDate);
    this.fiscalYear = date.getFullYear().toString();
    this.fiscalPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Validate and update item quantities
  this.items.forEach((item) => {
    // Ensure accepted + rejected = received
    const total = item.acceptedQuantity + item.rejectedQuantity;
    if (total > item.receivedQuantity) {
      throw new Error(
        `Total accepted and rejected quantity cannot exceed received quantity for item: ${item.description}`
      );
    }

    // Update inspection status based on quantities
    if (item.acceptedQuantity === 0 && item.rejectedQuantity === 0) {
      item.inspectionStatus = 'pending';
    } else if (item.rejectedQuantity === 0) {
      item.inspectionStatus = 'passed';
    } else if (item.acceptedQuantity === 0) {
      item.inspectionStatus = 'failed';
    } else {
      item.inspectionStatus = 'partial';
    }
  });

  // Update overall inspection status
  const allPending = this.items.every((item) => item.inspectionStatus === 'pending');
  const allCompleted = this.items.every((item) => item.inspectionStatus !== 'pending');

  if (allPending) {
    this.inspectionStatus = 'pending';
  } else if (allCompleted) {
    this.inspectionStatus = 'completed';
  } else {
    this.inspectionStatus = 'in_progress';
  }

  next();
});

// Method to complete inspection
goodsReceiptNoteSchema.methods.completeInspection = async function (userId) {
  if (this.status !== 'draft') {
    throw new Error('Only draft GRNs can have inspection completed');
  }

  // Check if all items have been inspected
  const uninspectedItems = this.items.filter((item) => item.inspectionStatus === 'pending');
  if (uninspectedItems.length > 0) {
    throw new Error('All items must be inspected before completing inspection');
  }

  this.status = 'inspected';
  this.inspectionStatus = 'completed';
  this.inspectedBy = userId;
  this.inspectionDate = new Date();
  this.updatedBy = userId;

  return await this.save();
};

// Method to post GRN
goodsReceiptNoteSchema.methods.post = async function (userId) {
  if (this.status !== 'inspected') {
    throw new Error('Only inspected GRNs can be posted');
  }

  if (this.isPosted) {
    throw new Error('GRN is already posted');
  }

  this.isPosted = true;
  this.postedAt = new Date();
  this.postedBy = userId;
  this.status = 'posted';
  this.updatedBy = userId;

  return await this.save();
};

// Method to cancel GRN
goodsReceiptNoteSchema.methods.cancel = async function (userId) {
  if (this.isPosted) {
    throw new Error('Cannot cancel posted GRN');
  }

  this.status = 'cancelled';
  this.updatedBy = userId;

  return await this.save();
};

// Virtual for total accepted quantity
goodsReceiptNoteSchema.virtual('totalAcceptedQuantity').get(function () {
  return this.items.reduce((sum, item) => sum + item.acceptedQuantity, 0);
});

// Virtual for total rejected quantity
goodsReceiptNoteSchema.virtual('totalRejectedQuantity').get(function () {
  return this.items.reduce((sum, item) => sum + item.rejectedQuantity, 0);
});

// Virtual for acceptance rate
goodsReceiptNoteSchema.virtual('acceptanceRate').get(function () {
  const totalReceived = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  const totalAccepted = this.totalAcceptedQuantity;

  if (totalReceived === 0) return 0;
  return Math.round((totalAccepted / totalReceived) * 100);
});

// Query middleware to exclude soft-deleted records
goodsReceiptNoteSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const GoodsReceiptNote =
  mongoose.models.GoodsReceiptNote || mongoose.model('GoodsReceiptNote', goodsReceiptNoteSchema);

export default GoodsReceiptNote;
