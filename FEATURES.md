# Features Documentation

Comprehensive guide to all features in DigiInvoice ERP.

## Table of Contents

1. [Overview](#overview)
2. [Authentication & User Management](#authentication--user-management)
3. [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
4. [Sales Module](#sales-module)
5. [Procurement Module](#procurement-module)
6. [Accounting Module](#accounting-module)
7. [Reporting](#reporting)
8. [Administration](#administration)
9. [Future Features](#future-features)

---

## Overview

DigiInvoice ERP is a comprehensive business management system designed for Pakistani businesses. It handles the complete business cycle from procurement to sales to accounting.

### Key Highlights

✅ **Complete Procurement Workflow** - PO → GRN → Invoice with 3-way matching
✅ **Sales Management** - Customers, Invoices, POS
✅ **Double-Entry Accounting** - Chart of Accounts, Vouchers, Reports
✅ **Role-Based Permissions** - Granular access control
✅ **Pakistan Tax Compliance** - NTN, STRN, GST support
✅ **Auto-posting to Accounts** - All transactions create journal vouchers
✅ **Financial Reports** - Ledger, Trial Balance, Balance Sheet

---

## Authentication & User Management

### User Registration

**Location:** `/register`

**Features:**
- Email-based registration
- Password strength validation
- Email verification (optional)
- Automatic account creation
- Default role assignment

**Workflow:**
1. User fills registration form
2. Password is hashed with bcrypt
3. User account created in database
4. JWT token generated
5. Auto-login after registration

### User Login

**Location:** `/login`

**Features:**
- Email + password authentication
- JWT token generation
- Remember me functionality
- Secure password comparison
- Last login tracking

**Security:**
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiry
- Token stored in localStorage
- Automatic token refresh

### Password Management

**Features:**
- **Forgot Password:** Email-based password reset
- **Reset Password:** Secure token-based reset
- **Change Password:** User can change their own password
- **Password Requirements:** Minimum 8 characters

### Profile Management

**Location:** `/profile`

**Features:**
- Update name, email, phone
- Change password
- Upload avatar (future)
- View account details
- View assigned role and permissions

---

## RBAC (Role-Based Access Control)

### Roles

**Location:** `/admin/roles`

**Features:**
- Hierarchical role system with levels (0-100)
- Color-coded roles for visual identification
- System roles (protected, cannot be deleted)
- Custom role creation
- Role description and metadata

**Default Roles:**
- **Admin (Level 100):** Full system access
- **Manager (Level 70):** Department management
- **User (Level 50):** Standard access
- **Viewer (Level 30):** Read-only access

**Role Properties:**
- **Name:** Unique identifier
- **Level:** Hierarchy position (higher = more authority)
- **Color:** Hex code for UI display
- **Permissions:** Array of permission keys
- **isSystem:** Protected system role flag

### Permissions

**Location:** `/admin/roles/:id` (Permission assignment)

**Features:**
- Granular permission system
- Organized by categories
- Resource + Action model
- Checkbox interface for easy management
- Search/filter permissions
- Select all/deselect all per category

**Permission Categories:**
1. **Accounts** - Chart of accounts management
2. **Customers** - Customer management
3. **Invoices** - Sales invoices
4. **Sales** - POS/Quick sales
5. **Suppliers** - Supplier management
6. **Purchase Orders** - PO management
7. **GRN** - Goods receipt
8. **Purchase Invoices** - Supplier invoices
9. **Vouchers** - Journal vouchers
10. **Reports** - Financial reports
11. **Users** - User management
12. **Roles** - RBAC management

**Permission Format:**
```
{resource}:{action}

Examples:
- accounts:create
- accounts:read
- accounts:update
- accounts:delete
- invoices:post
- vouchers:void
- reports:view
```

### Permission Management Interface

**Location:** `/admin/roles/:id`

**Features:**
- Visual checkbox interface
- Permissions grouped by category
- Individual permission toggle
- Select All/Deselect All per category
- Real-time permission count
- Search/filter by name or description
- Visual indicators for selected permissions
- Save button with confirmation

**Statistics Displayed:**
- Total permissions assigned
- Users with this role
- Available permissions in system

---

## Sales Module

### Customer Management

**Location:** `/admin/customers`

**Features:**
- Complete customer database
- Pakistan tax compliance fields
- Credit limit management
- Balance tracking
- Customer status (active/inactive)

**Customer Information:**
- **Basic Info:** Name, email, phone, address
- **Tax Details:**
  - NTN (National Tax Number)
  - STRN (Sales Tax Registration Number)
  - GST registration status
- **Financial:**
  - Current balance (amount owed to us)
  - Credit limit
  - Payment terms
- **Metadata:** Created date, last updated

**Operations:**
- Create new customer
- Edit customer details
- View customer transactions
- View balance and credit status
- Soft delete (if no outstanding balance)

### Sales Invoices

**Location:** `/admin/invoices`

**Features:**
- Multi-item invoice creation
- Automatic calculations (tax, totals)
- Draft and posted statuses
- Customer selection
- Auto-numbering (SI-001, SI-002, ...)
- Post to accounts functionality

**Invoice Structure:**
```
Customer: ABC Corporation
Date: 2025-11-11
Due Date: 2025-12-11

Items:
┌──────────────┬──────┬───────┬─────┬────────┬───────┐
│ Description  │ Qty  │ Price │ Tax │ Amount │ Total │
├──────────────┼──────┼───────┼─────┼────────┼───────┤
│ Product A    │  10  │  500  │ 17% │  5000  │ 5850  │
│ Product B    │   5  │ 1000  │ 17% │  5000  │ 5850  │
└──────────────┴──────┴───────┴─────┴────────┴───────┘

Subtotal: Rs. 10,000
Tax (17%): Rs.  1,700
Total:    Rs. 11,700
```

**Posting to Accounts:**
When invoice is posted, automatic journal voucher is created:
```
DR: Accounts Receivable (Customer) - Rs. 11,700
CR: Sales Revenue               - Rs. 10,000
CR: Sales Tax Payable           - Rs.  1,700
```

**Customer balance is automatically updated.**

### Quick Sale (POS)

**Location:** `/admin/sales`

**Features:**
- Point of Sale interface for walk-in customers
- Cash sales (no customer account needed)
- Fast checkout process
- Auto-posting to accounts
- Receipt generation

**Use Case:**
Perfect for retail or walk-in customers who don't need a customer account.

**Posting:**
```
DR: Cash                 - Rs. 11,700
CR: Sales Revenue        - Rs. 10,000
CR: Sales Tax Payable    - Rs.  1,700
```

---

## Procurement Module

### Supplier Management

**Location:** `/admin/suppliers`

**Features:**
- Complete supplier database
- Pakistan tax compliance
- Payment terms management
- Balance tracking (payables)
- Bank details storage

**Supplier Information:**
- **Basic Info:** Name, email, phone, address
- **Tax Details:** NTN, STRN, GST status
- **Financial:**
  - Current balance (negative = we owe them)
  - Payment terms (Net 30, Net 60, COD)
- **Banking:**
  - Account title
  - Account number
  - Bank name
  - IBAN number

**Operations:**
- Create supplier
- Edit details
- View purchase history
- View outstanding balance
- Soft delete (if no balance)

### Purchase Orders (PO)

**Location:** `/admin/purchase-orders`

**Features:**
- Multi-item PO creation
- Supplier selection
- Delivery date tracking
- Status workflow
- Email to supplier
- Auto-numbering (PO-001, PO-002, ...)

**PO Workflow:**
```
Draft → Sent → Confirmed → Closed
```

**Status Descriptions:**
- **Draft:** PO being prepared, can be edited
- **Sent:** PO emailed to supplier
- **Confirmed:** Supplier confirmed order
- **Closed:** All items received, PO complete

**PO Structure:**
```
Supplier: Supply Co. Ltd
PO Number: PO-001
Date: 2025-11-11
Delivery Date: 2025-11-20

Items:
┌──────────────┬──────┬───────┬────────┐
│ Description  │ Qty  │ Price │ Total  │
├──────────────┼──────┼───────┼────────┤
│ Raw Material │ 100  │  250  │ 25,000 │
│ Packaging    │  50  │  100  │  5,000 │
└──────────────┴──────┴───────┴────────┘

Total: Rs. 30,000
Terms: Net 30 days
```

**Send to Supplier:**
- Click "Send to Supplier" button
- Email sent with PO details
- Status changes to "Sent"
- Date/time recorded

### Goods Receipt Notes (GRN)

**Location:** `/admin/grn`

**Features:**
- Create GRN from PO
- Quality inspection interface
- Accept/reject quantities
- Quality grading (A, B, C)
- Inspection notes
- Auto-update PO received quantities

**GRN Workflow:**
```
1. Goods arrive from supplier
2. Create GRN from PO
3. Record received quantities
4. Inspect quality
5. Accept/reject items
6. Complete GRN
7. PO updated with received quantities
```

**Inspection Interface:**
```
Item: Raw Material A
Ordered:  100 units
Received:  95 units

Inspection:
Accepted:  90 units ✓
Rejected:   5 units ✗
Quality Grade: A

Notes: 5 units damaged in transit
```

**Quality Grades:**
- **A:** Excellent quality, no defects
- **B:** Good quality, minor cosmetic defects
- **C:** Acceptable quality, some defects

### Purchase Invoices (3-Way Matching)

**Location:** `/admin/purchase-invoices`

**Features:**
- Create invoice from GRN
- Automatic 3-way matching
- Variance detection
- Approval workflow
- Post to accounts
- Auto-numbering (PI-001, PI-002, ...)

**3-Way Matching Explained:**

The system compares three documents:
1. **Purchase Order (PO):** What we ordered
2. **Goods Receipt Note (GRN):** What we received
3. **Purchase Invoice:** What supplier charged us

**Matching Process:**

```
For each item:

1. Quantity Matching
   PO Quantity:      100 units
   GRN Quantity:      95 units (5 damaged)
   Invoice Quantity:  95 units
   ✓ MATCHED (invoice = received)

2. Price Matching
   PO Unit Price:     Rs. 250
   Invoice Unit Price: Rs. 250
   ✓ MATCHED

Overall Status: MATCHED ✓
```

**Variance Example:**

```
Item: Raw Material B

PO Quantity:      50 units
GRN Quantity:     48 units (2 damaged)
Invoice Quantity: 50 units ← Supplier charged for all!

Variance: +2 units
Status: MISMATCHED ✗
Action Required: Review with supplier
```

**Matching Report:**

```
3-Way Matching Report for PI-001

Summary:
  Total Items: 3
  Matched: 2
  Mismatched: 1
  Overall: MISMATCHED

Variances:
  1. Raw Material B
     Type: Quantity variance
     Expected (GRN): 48 units
     Actual (Invoice): 50 units
     Variance: +2 units
     Recommendation: Contact supplier for credit note
```

**Approval Workflow:**

```
1. Create invoice from GRN
2. System verifies 3-way matching
3. If matched:
   - Auto-flag as ready for approval
   - Accountant reviews and approves
4. If mismatched:
   - Flag variances
   - Manager reviews
   - Decision: Approve, Request correction, or Reject
5. Post to accounts
```

**Posting to Accounts:**

```
When purchase invoice is posted:

DR: Purchases (Expense)      - Rs. 23,750 (taxable amount)
DR: Input Tax                - Rs.  4,038 (17% GST)
CR: Accounts Payable (Supplier) - Rs. 27,788 (total)

Supplier balance updated: -Rs. 27,788 (we owe them)
```

---

## Accounting Module

### Chart of Accounts

**Location:** `/admin/accounts`

**Features:**
- Hierarchical account structure
- Five account types
- Parent-child relationships
- Account codes
- Balance tracking
- Seedable default structure

**Account Types:**

1. **Assets** (Debit balance normal)
   - Current Assets (Cash, Bank, Receivables)
   - Fixed Assets (Equipment, Vehicles, Property)
   - Other Assets

2. **Liabilities** (Credit balance normal)
   - Current Liabilities (Payables, Taxes)
   - Long-term Liabilities (Loans)

3. **Equity** (Credit balance normal)
   - Owner's Equity
   - Retained Earnings
   - Capital

4. **Revenue** (Credit balance normal)
   - Sales Revenue
   - Service Revenue
   - Other Income

5. **Expenses** (Debit balance normal)
   - Cost of Goods Sold
   - Operating Expenses
   - Taxes and Fees

**Account Hierarchy Example:**

```
1000 - Assets
  ├── 1100 - Current Assets
  │     ├── 1110 - Cash
  │     ├── 1120 - Bank - HBL
  │     └── 1200 - Accounts Receivable
  └── 1500 - Fixed Assets
        ├── 1510 - Equipment
        └── 1520 - Vehicles

2000 - Liabilities
  ├── 2100 - Current Liabilities
  │     ├── 2110 - Accounts Payable
  │     └── 2120 - Sales Tax Payable
  └── 2500 - Long-term Liabilities
        └── 2510 - Bank Loan

3000 - Equity
  └── 3100 - Owner's Equity

4000 - Revenue
  └── 4100 - Sales Revenue

5000 - Expenses
  ├── 5100 - Cost of Goods Sold
  └── 5200 - Operating Expenses
```

**Balance Rules:**

| Account Type | Debit | Credit | Normal Balance |
|--------------|-------|--------|----------------|
| Asset        | +     | -      | Debit          |
| Liability    | -     | +      | Credit         |
| Equity       | -     | +      | Credit         |
| Revenue      | -     | +      | Credit         |
| Expense      | +     | -      | Debit          |

### Journal Vouchers

**Location:** `/admin/vouchers`

**Features:**
- Manual voucher creation
- Auto-generated vouchers (from invoices)
- Multi-entry support
- Debit/Credit validation
- Post/Void functionality
- Auto-numbering (JV-001, JV-002, ...)

**Voucher Structure:**

```
Voucher Number: JV-001
Date: 2025-11-11
Description: Sales invoice SI-001

Entries:
┌──────────────────────────┬────────┬────────┐
│ Account                  │ Debit  │ Credit │
├──────────────────────────┼────────┼────────┤
│ 1200 - A/R (ABC Corp)    │ 11,700 │      0 │
│ 4000 - Sales Revenue     │      0 │ 10,000 │
│ 2120 - Sales Tax Payable │      0 │  1,700 │
├──────────────────────────┼────────┼────────┤
│ TOTALS                   │ 11,700 │ 11,700 │
└──────────────────────────┴────────┴────────┘

Status: Posted ✓
Posted By: Admin User
Posted Date: 2025-11-11 10:30 AM
```

**Validation Rules:**
- Total Debits must equal Total Credits
- Minimum 2 entries required
- All accounts must exist and be active
- Amount must be greater than 0

**Voucher Statuses:**
- **Draft:** Being prepared, can be edited
- **Posted:** Posted to ledger, balances updated
- **Void:** Reversed, reversal voucher created

**Voiding a Voucher:**

```
Original Voucher JV-001:
DR: Cash          1,000
CR: Sales Revenue 1,000

Reversal Voucher JV-050 (auto-created):
DR: Sales Revenue 1,000 ← Swapped
CR: Cash          1,000 ← Swapped

Description: "Reversal of JV-001 - Incorrect entry"
```

### Double-Entry Bookkeeping

**Principle:**
Every transaction has equal debits and credits, maintaining the accounting equation:

```
Assets = Liabilities + Equity
```

**Examples:**

**1. Cash Sale**
```
DR: Cash                 10,000
CR: Sales Revenue        10,000
Effect: Asset↑ Revenue↑
```

**2. Purchase on Credit**
```
DR: Purchases            5,000
CR: Accounts Payable     5,000
Effect: Expense↑ Liability↑
```

**3. Payment to Supplier**
```
DR: Accounts Payable     5,000
CR: Cash                 5,000
Effect: Liability↓ Asset↓
```

**4. Collect from Customer**
```
DR: Cash                 11,700
CR: Accounts Receivable  11,700
Effect: Asset (cash)↑ Asset (receivable)↓
```

---

## Reporting

### Account Ledger

**Location:** `/admin/reports/ledger`

**Features:**
- Select specific account
- Date range filtering
- Running balance calculation
- Transaction details
- Opening and closing balances

**Ledger Format:**

```
Account: 1110 - Cash
Period: 2025-11-01 to 2025-11-30

Opening Balance: Rs. 100,000

┌────────────┬────────┬──────────────────┬────────┬────────┬──────────┐
│ Date       │ Voucher│ Description      │ Debit  │ Credit │ Balance  │
├────────────┼────────┼──────────────────┼────────┼────────┼──────────┤
│ 2025-11-01 │ JV-001 │ Opening balance  │ 100000 │      0 │  100,000 │
│ 2025-11-05 │ JV-002 │ Cash sales       │  15000 │      0 │  115,000 │
│ 2025-11-10 │ JV-005 │ Supplier payment │      0 │   8000 │  107,000 │
│ 2025-11-15 │ JV-010 │ Customer receipt │  12000 │      0 │  119,000 │
│ 2025-11-20 │ JV-015 │ Expense payment  │      0 │   3000 │  116,000 │
└────────────┴────────┴──────────────────┴────────┴────────┴──────────┘

Closing Balance: Rs. 116,000

Total Debits:  Rs. 127,000
Total Credits: Rs.  11,000
Net Change:    Rs. 116,000
```

### Trial Balance

**Location:** `/admin/reports/trial-balance`

**Features:**
- All accounts summary
- Debit and credit totals
- Balance verification
- As-of date selection
- Grouped by account type

**Trial Balance Format:**

```
Trial Balance
As of: 2025-11-30

┌──────┬────────────────────────┬────────┬────────┐
│ Code │ Account Name           │ Debit  │ Credit │
├──────┼────────────────────────┼────────┼────────┤
│      │ ASSETS                 │        │        │
│ 1110 │ Cash                   │116,000 │      0 │
│ 1200 │ Accounts Receivable    │ 75,000 │      0 │
│ 1510 │ Equipment              │200,000 │      0 │
│      │                        │        │        │
│      │ LIABILITIES            │        │        │
│ 2110 │ Accounts Payable       │      0 │ 50,000 │
│ 2120 │ Sales Tax Payable      │      0 │  8,500 │
│      │                        │        │        │
│      │ EQUITY                 │        │        │
│ 3100 │ Owner's Equity         │      0 │250,000 │
│      │                        │        │        │
│      │ REVENUE                │        │        │
│ 4100 │ Sales Revenue          │      0 │125,000 │
│      │                        │        │        │
│      │ EXPENSES               │        │        │
│ 5100 │ Cost of Goods Sold     │ 30,000 │      0 │
│ 5200 │ Operating Expenses     │ 12,500 │      0 │
├──────┼────────────────────────┼────────┼────────┤
│      │ TOTALS                 │433,500 │433,500 │
└──────┴────────────────────────┴────────┴────────┘

✓ BALANCED (Debits = Credits)
```

**Importance:**
If trial balance doesn't balance, there's an error in the books!

### Balance Sheet

**Location:** `/admin/reports/balance-sheet`

**Features:**
- Snapshot of financial position
- Assets vs Liabilities + Equity
- Current vs Long-term classification
- As-of date selection

**Balance Sheet Format:**

```
Balance Sheet
As of: 2025-11-30

ASSETS
──────────────────────────────────────
Current Assets:
  Cash                        116,000
  Accounts Receivable          75,000
  Total Current Assets                 191,000

Fixed Assets:
  Equipment                   200,000
  Total Fixed Assets                   200,000

TOTAL ASSETS                            391,000

LIABILITIES
──────────────────────────────────────
Current Liabilities:
  Accounts Payable             50,000
  Sales Tax Payable             8,500
  Total Current Liabilities             58,500

TOTAL LIABILITIES                        58,500

EQUITY
──────────────────────────────────────
Owner's Equity               250,000
Retained Earnings             82,500
  Total Equity                          332,500

TOTAL LIABILITIES + EQUITY              391,000

✓ BALANCED
```

**Accounting Equation Verified:**
```
Assets (391,000) = Liabilities (58,500) + Equity (332,500)
```

---

## Administration

### User Management

**Location:** `/admin/users` (if available)

**Features:**
- View all users
- Create user accounts
- Assign roles to users
- Activate/deactivate users
- Reset passwords

### Role & Permission Management

**Location:** `/admin/roles`

**Features:**
- Create/edit/delete roles
- Assign permissions to roles
- Visual permission management
- Role hierarchy enforcement
- System role protection

### System Settings

**Future Features:**
- Company information
- Tax settings
- Currency settings
- Email templates
- Backup/restore

---

## Future Features

### Planned Enhancements

#### Phase 6: Inventory Management
- [ ] Product/Item master
- [ ] Stock tracking
- [ ] Warehouse management
- [ ] Stock valuation (FIFO, LIFO, Weighted Average)
- [ ] Stock reports

#### Phase 7: Advanced Features
- [ ] Multi-currency support
- [ ] Multi-company/branch
- [ ] Budgeting & forecasting
- [ ] Recurring invoices
- [ ] Payment processing integration

#### Phase 8: Reporting & Analytics
- [ ] Profit & Loss statement
- [ ] Cash Flow statement
- [ ] Aging reports (AR & AP)
- [ ] Sales analytics
- [ ] Purchase analytics
- [ ] Interactive charts & graphs

#### Phase 9: Integration & Automation
- [ ] Email notifications
- [ ] PDF generation for invoices/POs
- [ ] Excel export for reports
- [ ] Barcode scanning
- [ ] API for third-party integration

#### Phase 10: Mobile & UX
- [ ] Mobile-responsive design
- [ ] Progressive Web App (PWA)
- [ ] Offline mode
- [ ] Dark mode
- [ ] Accessibility improvements

---

## Feature Matrix

| Module | Create | Read | Update | Delete | Post | Special Actions |
|--------|--------|------|--------|--------|------|-----------------|
| Customers | ✓ | ✓ | ✓ | ✓ | - | - |
| Sales Invoices | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Quick Sales | ✓ | ✓ | - | - | ✓ | - |
| Suppliers | ✓ | ✓ | ✓ | ✓ | - | - |
| Purchase Orders | ✓ | ✓ | ✓ | ✓ | - | Send Email |
| GRN | ✓ | ✓ | ✓ | ✓ | - | Inspect |
| Purchase Invoices | ✓ | ✓ | ✓ | ✓ | ✓ | Verify, Approve |
| Accounts | ✓ | ✓ | ✓ | ✓ | - | Seed |
| Vouchers | ✓ | ✓ | ✓ | ✓ | ✓ | Void |
| Roles | ✓ | ✓ | ✓ | ✓ | - | Assign Permissions |
| Users | ✓ | ✓ | ✓ | ✓ | - | Assign Role |

---

## Summary

DigiInvoice ERP provides a complete business management solution with:

✅ **27 Pages** for comprehensive functionality
✅ **54 API Endpoints** for all operations
✅ **11 Mongoose Models** for data management
✅ **42+ Permissions** for granular access control
✅ **5 Major Modules** (Sales, Procurement, Accounting, RBAC, Admin)
✅ **3-Way Matching** for procurement accuracy
✅ **Double-Entry Accounting** for financial integrity
✅ **Pakistan Tax Compliance** (NTN, STRN, GST)
✅ **Auto-posting to Accounts** for all transactions
✅ **Financial Reporting** (Ledger, Trial Balance, Balance Sheet)

**Perfect for:**
- Small to medium businesses
- Trading companies
- Manufacturing units
- Service providers
- Retail shops
- Distributors

---

**Features Version:** 1.0.0
**Last Updated:** 2025-11-11
**Status:** Production Ready
**Total Features:** 50+
