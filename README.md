# DigiInvoice ERP

A comprehensive Enterprise Resource Planning (ERP) system built with Next.js 16, featuring complete procurement, sales, accounting, and role-based access control modules. Designed specifically for Pakistani businesses with support for local tax regulations (NTN, STRN, GST).

## Overview

DigiInvoice ERP is a full-featured business management system that handles:
- **Sales Management**: Customer management, sales invoicing, POS for walk-in sales
- **Procurement**: Supplier management, purchase orders, goods receipt, 3-way matching
- **Accounting**: Double-entry bookkeeping, chart of accounts, journal vouchers, financial reports
- **RBAC**: Role-based permissions, user management, granular access control

## Key Features

### Sales Module
- Customer Management with Pakistan tax info (NTN, STRN, GST)
- Sales Invoice generation with multi-item support
- Quick Sale (POS) for walk-in customers
- Auto-posting to Chart of Accounts
- Customer balance tracking

### Procurement Module
- Supplier Management with tax compliance
- Purchase Order creation and workflow (Draft → Sent → Confirmed)
- Email PO delivery to suppliers
- Goods Receipt Notes (GRN) with quality inspection
- Accept/Reject quantities and quality grading
- Purchase Invoice with 3-Way Matching (PO vs GRN vs Invoice)
- Variance detection and approval workflow
- Auto-posting to Accounts Payable

### Accounting Module
- Complete Chart of Accounts with hierarchy
- Double-entry bookkeeping system
- Journal Vouchers (manual and auto-generated)
- Account Ledger with running balance
- Trial Balance report
- Balance Sheet generation
- Auto-voucher creation from invoices
- Pakistan-compliant tax handling

### RBAC (Role-Based Access Control)
- Hierarchical roles with permission levels (0-100)
- Granular permissions by resource and action
- Permission management with checkbox interface
- System roles protection
- User-role assignment
- Permission categories (Sales, Procurement, Accounting, Admin, Reports)

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 18** - UI library
- **TailwindCSS** - Utility-first CSS framework
- **Flowbite** - UI component design system

### Backend
- **Next.js API Routes** - Server-side API
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

### Authentication & Security
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Middleware-based RBAC** - Route protection

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn** or **pnpm**
- **MongoDB** 6.0 or higher (local or cloud)
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd digi-invoice
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/digiinvoice
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digiinvoice

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (optional, for sending POs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# If using local MongoDB
sudo systemctl start mongod

# Check status
sudo systemctl status mongod
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Initial Setup

1. **Register an Admin Account**: Navigate to `/register` and create your first user
2. **Seed Permissions**: The system will auto-seed default permissions on first run
3. **Set Up Chart of Accounts**: Navigate to `/admin/accounts` and create your account structure
4. **Create Roles**: Go to `/admin/roles` and set up roles with permissions

## Project Structure

```
digi-invoice/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/                # Admin dashboard pages
│   │   │   ├── accounts/         # Chart of Accounts
│   │   │   ├── customers/        # Customer management
│   │   │   ├── grn/              # Goods Receipt Notes
│   │   │   ├── invoices/         # Sales Invoices
│   │   │   ├── purchase-invoices/# Purchase Invoices
│   │   │   ├── purchase-orders/  # Purchase Orders
│   │   │   ├── reports/          # Financial Reports
│   │   │   ├── roles/            # RBAC Management
│   │   │   ├── sales/            # POS/Quick Sale
│   │   │   ├── suppliers/        # Supplier management
│   │   │   └── vouchers/         # Journal Vouchers
│   │   ├── api/                  # API routes
│   │   │   ├── accounts/         # Account CRUD
│   │   │   ├── auth/             # Authentication
│   │   │   ├── customers/        # Customer CRUD
│   │   │   ├── grn/              # GRN APIs
│   │   │   ├── invoices/         # Sales Invoice APIs
│   │   │   ├── purchase-invoices/# Purchase Invoice APIs
│   │   │   ├── purchase-orders/  # PO APIs
│   │   │   ├── rbac/             # Roles & Permissions
│   │   │   ├── reports/          # Report generation
│   │   │   ├── suppliers/        # Supplier CRUD
│   │   │   └── vouchers/         # Voucher APIs
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   └── dashboard/            # Main dashboard
│   ├── components/               # Reusable React components
│   ├── lib/                      # Utility libraries
│   │   └── mongodb.js            # MongoDB connection
│   ├── middleware/               # Express-style middleware
│   │   └── auth.js               # JWT & RBAC middleware
│   ├── models/                   # Mongoose models
│   │   ├── Account.js            # Chart of Accounts
│   │   ├── Customer.js           # Customer model
│   │   ├── GRN.js                # Goods Receipt Note
│   │   ├── Invoice.js            # Sales Invoice
│   │   ├── JournalVoucher.js     # Voucher model
│   │   ├── Permission.js         # Permission model
│   │   ├── PurchaseInvoice.js    # Purchase Invoice
│   │   ├── PurchaseOrder.js      # Purchase Order
│   │   ├── Role.js               # Role model
│   │   ├── Supplier.js           # Supplier model
│   │   └── User.js               # User model
│   └── utils/                    # Helper utilities
│       ├── logger.js             # Logging utility
│       └── response.js           # API response helpers
├── public/                       # Static files
├── .env.local                    # Environment variables (not in git)
├── package.json                  # Dependencies
├── tailwind.config.js            # TailwindCSS config
├── next.config.js                # Next.js config
├── open-all-pages.sh             # Testing script
├── open-pages-by-module.sh       # Module testing script
├── PAGE_LIST.md                  # Complete page reference
├── TESTING_SCRIPTS.md            # Testing documentation
├── API_DOCUMENTATION.md          # API reference (see below)
├── ARCHITECTURE.md               # Architecture guide (see below)
├── SETUP_GUIDE.md                # Detailed setup (see below)
└── FEATURES.md                   # Feature documentation (see below)
```

## Testing

### Automated Testing Scripts

We provide shell scripts to quickly open all pages in Google Chrome for testing:

#### Open All Pages (27 pages)
```bash
chmod +x open-all-pages.sh
./open-all-pages.sh
```

#### Open by Module
```bash
chmod +x open-pages-by-module.sh

# Available modules: auth, sales, procurement, accounting, admin, all
./open-pages-by-module.sh sales
./open-pages-by-module.sh procurement
./open-pages-by-module.sh accounting
./open-pages-by-module.sh all
```

See `TESTING_SCRIPTS.md` for complete testing workflows and checklists.

## Usage Workflows

### Complete Procurement Flow

1. **Create Supplier** (`/admin/suppliers/new`)
   - Add supplier with NTN, STRN, GST info
   - Set payment terms

2. **Create Purchase Order** (`/admin/purchase-orders/new`)
   - Select supplier
   - Add items with quantities and prices
   - Save as draft or send to supplier

3. **Send PO to Supplier**
   - Click "Send to Supplier" on PO detail page
   - Email sent automatically

4. **Receive Goods** (`/admin/grn/new`)
   - Create GRN from PO
   - Inspect items (accept/reject quantities)
   - Set quality grades
   - Complete inspection

5. **Process Purchase Invoice** (`/admin/purchase-invoices/new`)
   - Create invoice from GRN
   - System performs 3-way matching (PO vs GRN vs Invoice)
   - Review variance report
   - Approve if matched
   - Post to accounts

6. **Verify Accounting**
   - Check supplier balance (`/admin/suppliers`)
   - View journal voucher (`/admin/vouchers`)
   - Check account ledger (`/admin/reports/ledger`)

### Sales Flow

1. **Create Customer** (`/admin/customers/new`)
2. **Create Sales Invoice** (`/admin/invoices/new`)
   - Select customer
   - Add items
   - Save and post to accounts
3. **Quick Sale (POS)** (`/admin/sales`)
   - For walk-in customers
   - Direct cash sales
   - Auto-posting

### Accounting Operations

1. **Set Up Chart of Accounts** (`/admin/accounts`)
   - Create account hierarchy
   - Assets, Liabilities, Equity, Revenue, Expenses

2. **Manual Vouchers** (`/admin/vouchers/new`)
   - For adjustments and manual entries
   - Must balance (debits = credits)

3. **Financial Reports**
   - Account Ledger (`/admin/reports/ledger`)
   - Trial Balance (`/admin/reports/trial-balance`)
   - Balance Sheet (`/admin/reports/balance-sheet`)

## API Documentation

Complete API documentation is available in `API_DOCUMENTATION.md`, including:
- All 43 API endpoints
- Request/response formats
- Authentication requirements
- Permission requirements
- Example requests

## Architecture

Detailed architecture documentation is available in `ARCHITECTURE.md`, covering:
- System design patterns
- Database schema
- Authentication flow
- RBAC implementation
- 3-way matching logic
- Double-entry accounting

## Additional Documentation

- **`PAGE_LIST.md`** - Complete list of all 27 pages
- **`TESTING_SCRIPTS.md`** - Testing workflows and scripts
- **`FEATURES.md`** - Detailed feature descriptions
- **`SETUP_GUIDE.md`** - Step-by-step setup guide
- **`API_DOCUMENTATION.md`** - API endpoint reference
- **`ARCHITECTURE.md`** - System architecture guide

## Development Workflow

### Branch Strategy

- **Main branch**: Production-ready code
- **Feature branches**: Named `claude/feature-name-sessionid`

### Making Changes

1. Create a new branch
2. Make your changes
3. Test locally
4. Build the project: `npm run build`
5. Commit with clear messages
6. Push to remote

### Commit Message Format

```
type: Brief description

Examples:
feat: Add supplier tax fields
fix: Correct GRN quantity calculation
docs: Update API documentation
style: Format purchase invoice page
```

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables (Production)

Ensure these are set in your production environment:
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Strong secret key (different from development)
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL` - Your production URL

### Database Backups

Regular backups are recommended:

```bash
# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/digiinvoice" --out=/path/to/backup

# Restore
mongorestore --uri="mongodb://localhost:27017/digiinvoice" /path/to/backup/digiinvoice
```

## Security Considerations

- All API routes protected with JWT authentication
- Role-based permissions enforced on sensitive operations
- Passwords hashed with bcrypt
- System roles cannot be modified
- Input validation on all forms
- HTTPS required in production

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check logs
sudo journalctl -u mongod
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

[Specify your license here]

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Review existing documentation
- Check `TROUBLESHOOTING.md` for common problems

## Acknowledgments

Built with:
- Next.js 16 by Vercel
- MongoDB for data persistence
- TailwindCSS for styling
- Flowbite for UI components

---

**Version**: 1.0.0
**Last Updated**: 2025-11-11
**Build Status**: 63 routes generated
**Status**: Production Ready
