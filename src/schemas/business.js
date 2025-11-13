import { z } from 'zod';

/**
 * Customer Schema - Comprehensive
 */
export const customerSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  companyName: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  customerType: z.enum(['individual', 'business'], {
    errorMap: () => ({ message: 'Customer type must be either individual or business' }),
  }),
  category: z.string().optional(),

  // Contact Person
  contactPersonName: z.string().optional(),
  contactPersonDesignation: z.string().optional(),
  contactPersonPhone: z.string().optional(),
  contactPersonEmail: z.string().email('Invalid email').optional().or(z.literal('')),

  // Billing Address
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().min(1, 'Country is required'),

  // Shipping Address
  shippingSameAsBilling: z.boolean().default(true),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),

  // Tax Information
  ntn: z
    .string()
    .regex(/^\d{7}$/, 'NTN must be exactly 7 digits')
    .optional()
    .or(z.literal('')),
  referenceNumber: z
    .string()
    .regex(/^\d{7}-\d$/, 'Reference number must be in format 0000000-0')
    .optional()
    .or(z.literal('')),
  strn: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}-\d{3}-\d{2}$/, 'STRN must be in format 11-11-1111-111-11')
    .optional()
    .or(z.literal('')),
  cnic: z.string().optional(),
  gstRegistered: z.boolean().default(false),

  // Financial Information
  creditLimit: z.coerce.number().nonnegative('Credit limit must be positive').default(0),
  creditDays: z.coerce.number().int().nonnegative('Credit days must be positive').default(0),
  openingBalance: z.coerce.number().default(0),
  paymentTerms: z.string().default('cash'),
  paymentMethod: z.string().default('cash'),

  // Other
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Supplier Schema - Comprehensive
 */
export const supplierSchema = z.object({
  // Basic Information
  supplierCode: z.string().optional(),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .min(2, 'Company name must be at least 2 characters'),
  contactPerson: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),

  // Tax Information
  ntn: z.string().optional(),
  strn: z.string().optional(),
  gstRegistered: z.boolean().default(false),

  // Payment Terms
  paymentTerms: z.string().default('credit'),
  creditDays: z.coerce.number().int().nonnegative('Credit days must be positive').default(30),
  creditLimit: z.coerce.number().nonnegative('Credit limit must be positive').default(0),
  openingBalance: z.coerce.number().default(0),
  balanceType: z.enum(['debit', 'credit']).default('credit'),

  // Category and Status
  category: z.string().default('other'),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),

  // Address
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Pakistan'),

  // Bank Details
  bankName: z.string().optional(),
  accountTitle: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
});

/**
 * Account Schema
 */
export const accountSchema = z.object({
  code: z
    .string()
    .min(1, 'Account code is required')
    .regex(/^\d+$/, 'Account code must contain only numbers'),
  name: z
    .string()
    .min(1, 'Account name is required')
    .min(2, 'Account name must be at least 2 characters'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'], {
    errorMap: () => ({ message: 'Invalid account type' }),
  }),
  subType: z.string().min(1, 'Account sub-type is required'),
  parentAccount: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Invoice Item Schema
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z
    .number()
    .positive('Quantity must be greater than 0'),
  unitPrice: z
    .number()
    .nonnegative('Unit price must be positive'),
  taxRate: z
    .number()
    .min(0, 'Tax rate must be 0 or greater')
    .max(100, 'Tax rate cannot exceed 100%')
    .optional()
    .default(0),
  discount: z
    .number()
    .min(0, 'Discount must be 0 or greater')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .default(0),
});

/**
 * Sales Invoice Schema
 */
export const salesInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least one item is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
});
