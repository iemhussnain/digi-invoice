import { z } from 'zod';

/**
 * Customer Schema
 */
export const customerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .refine((val) => /^[\d\s\-\+\(\)]+$/.test(val), {
      message: 'Invalid phone number format',
    }),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  customerType: z.enum(['individual', 'business'], {
    errorMap: () => ({ message: 'Customer type must be either individual or business' }),
  }),
  creditLimit: z
    .number()
    .nonnegative('Credit limit must be positive')
    .optional()
    .or(z.literal(0)),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

/**
 * Supplier Schema
 */
export const supplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .refine((val) => /^[\d\s\-\+\(\)]+$/.test(val), {
      message: 'Invalid phone number format',
    }),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  supplierType: z.enum(['local', 'international'], {
    errorMap: () => ({ message: 'Supplier type must be either local or international' }),
  }),
  paymentTerms: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
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
