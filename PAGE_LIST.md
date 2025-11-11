# DigiInvoice ERP - Complete Page List

Base URL: `http://localhost:3000`

## 🔐 Authentication & Main

| Page | URL | Description |
|------|-----|-------------|
| Home | http://localhost:3000/ | Landing page |
| Login | http://localhost:3000/login | User login |
| Register | http://localhost:3000/register | New user registration |
| Forgot Password | http://localhost:3000/forgot-password | Password recovery |
| Reset Password | http://localhost:3000/reset-password | Password reset form |
| Verify Email | http://localhost:3000/verify-email | Email verification |
| Dashboard | http://localhost:3000/dashboard | Main dashboard |

## 💵 Sales Module

| Page | URL | Description |
|------|-----|-------------|
| Quick Sale | http://localhost:3000/admin/sales | Point of sale interface |
| Customers List | http://localhost:3000/admin/customers | View all customers |
| New Customer | http://localhost:3000/admin/customers/new | Add new customer |
| Sales Invoices List | http://localhost:3000/admin/invoices | View all sales invoices |
| New Sales Invoice | http://localhost:3000/admin/invoices/new | Create sales invoice |

## 🏭 Procurement Module

| Page | URL | Description |
|------|-----|-------------|
| Suppliers List | http://localhost:3000/admin/suppliers | View all suppliers |
| New Supplier | http://localhost:3000/admin/suppliers/new | Add new supplier |
| Purchase Orders List | http://localhost:3000/admin/purchase-orders | View all purchase orders |
| New Purchase Order | http://localhost:3000/admin/purchase-orders/new | Create purchase order |
| Goods Receipt Notes | http://localhost:3000/admin/grn | View all GRNs |
| Purchase Invoices List | http://localhost:3000/admin/purchase-invoices | View all purchase invoices |
| New Purchase Invoice | http://localhost:3000/admin/purchase-invoices/new | Create purchase invoice |

## 📊 Accounting Module

| Page | URL | Description |
|------|-----|-------------|
| Chart of Accounts | http://localhost:3000/admin/accounts | View all accounts |
| New Account | http://localhost:3000/admin/accounts/new | Add new account |
| Vouchers List | http://localhost:3000/admin/vouchers | View all vouchers |
| New Voucher | http://localhost:3000/admin/vouchers/new | Create new voucher |
| Reports Dashboard | http://localhost:3000/admin/reports | Reports overview |
| Account Ledger | http://localhost:3000/admin/reports/ledger | View account ledger |
| Trial Balance | http://localhost:3000/admin/reports/trial-balance | View trial balance |
| Balance Sheet | http://localhost:3000/admin/reports/balance-sheet | View balance sheet |

## 🔐 Administration

| Page | URL | Description |
|------|-----|-------------|
| Roles & Permissions | http://localhost:3000/admin/roles | Manage roles |

## 📡 API Endpoints (Backend)

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/verify-email` - Verify email
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password

### Sales
- GET/POST `/api/sales` - Sales invoices CRUD
- POST `/api/sales/[id]/post` - Post sale to accounts
- GET/POST `/api/customers` - Customers CRUD
- GET/PUT/DELETE `/api/customers/[id]` - Single customer operations
- GET/POST `/api/invoices` - Sales invoices CRUD
- POST `/api/invoices/[id]/post` - Post invoice to accounts

### Procurement
- GET/POST `/api/suppliers` - Suppliers CRUD
- GET/PUT/DELETE `/api/suppliers/[id]` - Single supplier operations
- GET/POST `/api/purchase-orders` - Purchase orders CRUD
- GET/PUT/DELETE `/api/purchase-orders/[id]` - Single PO operations
- POST `/api/purchase-orders/[id]/send` - Send PO to supplier
- GET/POST `/api/grn` - Goods receipt notes CRUD
- GET/PUT/DELETE `/api/grn/[id]` - Single GRN operations
- GET/POST `/api/grn/from-po/[poId]` - Create GRN from PO
- POST `/api/grn/[id]/inspect` - Complete GRN inspection
- GET/POST `/api/purchase-invoices` - Purchase invoices CRUD
- GET/PUT/DELETE `/api/purchase-invoices/[id]` - Single PI operations
- POST `/api/purchase-invoices/[id]/verify` - Verify 3-way matching
- POST `/api/purchase-invoices/[id]/approve` - Approve invoice
- POST `/api/purchase-invoices/[id]/post` - Post to accounts

### Accounting
- GET/POST `/api/accounts` - Chart of accounts CRUD
- GET/PUT/DELETE `/api/accounts/[id]` - Single account operations
- POST `/api/accounts/seed` - Seed default accounts
- GET/POST `/api/vouchers` - Vouchers CRUD
- GET/PUT/DELETE `/api/vouchers/[id]` - Single voucher operations
- POST `/api/vouchers/[id]/post` - Post voucher
- POST `/api/vouchers/[id]/void` - Void voucher
- GET `/api/reports/ledger` - Account ledger report
- GET `/api/reports/trial-balance` - Trial balance report
- GET `/api/reports/balance-sheet` - Balance sheet report

### RBAC
- GET/POST `/api/rbac/roles` - Roles CRUD
- GET/PUT/DELETE `/api/rbac/roles/[id]` - Single role operations
- PUT `/api/rbac/roles/[id]/permissions` - Update role permissions
- GET/POST `/api/rbac/permissions` - Permissions CRUD
- POST `/api/rbac/permissions/seed` - Seed default permissions

## 🚀 Quick Start

### Open All Pages
```bash
# Make script executable (first time only)
chmod +x open-all-pages.sh

# Run the script
./open-all-pages.sh
```

### Start Development Server
```bash
npm run dev
```

Then visit: http://localhost:3000

## 📊 Module Summary

| Module | Pages | API Endpoints | Status |
|--------|-------|---------------|--------|
| Authentication | 6 | 8 | ✅ Complete |
| Sales | 5 | 6 | ✅ Complete |
| Procurement | 7 | 13 | ✅ Complete |
| Accounting | 8 | 11 | ✅ Complete |
| Administration | 1 | 5 | ✅ Complete |
| **Total** | **27** | **43** | ✅ **Complete** |

## 🎯 Key Features

### Sales Module
- Quick Sale (POS) with receipt printing
- Customer management
- Sales invoices with auto-voucher generation

### Procurement Module
- Supplier management with Pakistan tax context
- Purchase order creation and sending
- Goods receipt with quality inspection
- **Purchase invoices with 3-way matching**
- Auto-voucher generation on posting

### Accounting Module
- Multi-level chart of accounts
- Journal vouchers with double-entry
- Account ledger reports
- Trial balance
- Balance sheet
- Auto-posting from sales and purchases

### 3-Way Matching Process
1. **Purchase Order** (PO) - What was ordered
2. **Goods Receipt Note** (GRN) - What was received (with quality inspection)
3. **Purchase Invoice** - What supplier charged
4. **Verification** - System compares quantities and amounts
5. **Approval** - Manager approves matched invoices
6. **Posting** - Creates accounting entries automatically

## 📝 Notes

- All pages require authentication (except login/register)
- Default admin credentials should be created via register page
- MongoDB must be running for the application to work
- Build generates 63 optimized routes
