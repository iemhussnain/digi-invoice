# Testing Scripts for DigiInvoice ERP

Quick scripts to open all application pages in Google Chrome for testing.

## 📋 Available Scripts

### 1. Open All Pages (`open-all-pages.sh`)
Opens all 27 pages in separate Chrome tabs at once.

```bash
./open-all-pages.sh
```

**Opens:**
- Authentication pages (5)
- Sales module (5)
- Procurement module (7)
- Accounting module (8)
- Administration (1)
- Dashboard (1)

### 2. Open by Module (`open-pages-by-module.sh`)
Opens pages for a specific module only.

```bash
# Show available modules
./open-pages-by-module.sh

# Open specific module
./open-pages-by-module.sh sales
./open-pages-by-module.sh procurement
./open-pages-by-module.sh accounting
./open-pages-by-module.sh auth
./open-pages-by-module.sh admin
./open-pages-by-module.sh all
```

**Available Modules:**
- `auth` - Authentication & Dashboard (5 pages)
- `sales` - Sales Module (5 pages)
- `procurement` - Procurement Module (7 pages)
- `accounting` - Accounting Module (8 pages)
- `admin` - Administration (1 page)
- `all` - All pages (27 pages)

## 🚀 Quick Start

### First Time Setup

1. Make scripts executable:
```bash
chmod +x open-all-pages.sh
chmod +x open-pages-by-module.sh
```

2. Start the development server:
```bash
npm run dev
```

3. Run a script:
```bash
# Open all pages
./open-all-pages.sh

# Or open specific module
./open-pages-by-module.sh procurement
```

## 📊 Module Breakdown

### Authentication Module (5 pages)
- Home page
- Login
- Register
- Forgot Password
- Dashboard

### Sales Module (5 pages)
- Quick Sale (POS)
- Customers List
- New Customer
- Sales Invoices List
- New Sales Invoice

### Procurement Module (7 pages)
- Suppliers List
- New Supplier
- Purchase Orders List
- New Purchase Order
- Goods Receipt Notes (GRN)
- Purchase Invoices List
- New Purchase Invoice

### Accounting Module (8 pages)
- Chart of Accounts
- New Account
- Vouchers List
- New Voucher
- Reports Dashboard
- Account Ledger
- Trial Balance
- Balance Sheet

### Administration (1 page)
- Roles & Permissions

## 💡 Usage Tips

### Testing Workflows

**Test Procurement Flow:**
```bash
./open-pages-by-module.sh procurement
```
Then test in order:
1. Create Supplier
2. Create Purchase Order
3. Send PO to Supplier
4. Create GRN from PO
5. Inspect & Accept Items
6. Create Purchase Invoice from GRN
7. Verify 3-Way Matching
8. Approve & Post to Accounts

**Test Sales Flow:**
```bash
./open-pages-by-module.sh sales
```
Then test in order:
1. Create Customer
2. Create Sales Invoice
3. Post to Accounts
Or use Quick Sale (POS) for walk-in sales

**Test Accounting:**
```bash
./open-pages-by-module.sh accounting
```
Then test:
1. Review Chart of Accounts
2. Create Manual Vouchers (if needed)
3. View Account Ledger
4. Generate Trial Balance
5. View Balance Sheet

### Browser Requirements

The scripts will automatically detect and use:
- `google-chrome`
- `google-chrome-stable`
- `chromium-browser`
- `chromium`

If none found, you'll get an error message.

## 🔧 Troubleshooting

**Issue: "Permission denied"**
```bash
chmod +x *.sh
```

**Issue: "Chrome not found"**
Install Google Chrome:
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
```

Or use Chromium:
```bash
sudo apt install chromium-browser
```

**Issue: "Cannot connect"**
Make sure dev server is running:
```bash
npm run dev
```

## 📝 Notes

- All pages require authentication except login/register
- Create an admin account first via the register page
- MongoDB must be running
- Default URL: http://localhost:3000
- Scripts open pages in new tabs in the same window

## 🎯 Testing Checklist

### Phase 5: Procurement Module Testing

- [ ] **Suppliers**
  - [ ] Create supplier with Pakistan tax info (NTN, STRN, GST)
  - [ ] Edit supplier details
  - [ ] View supplier balance

- [ ] **Purchase Orders**
  - [ ] Create PO with multiple items
  - [ ] Send PO to supplier email
  - [ ] View PO status (draft → sent → confirmed)

- [ ] **Goods Receipt**
  - [ ] Create GRN from PO
  - [ ] Inspect items (accept/reject quantities)
  - [ ] Set quality grades
  - [ ] Complete inspection
  - [ ] Verify PO received quantities updated

- [ ] **Purchase Invoices (3-Way Matching)**
  - [ ] Create invoice from GRN
  - [ ] Compare PO vs GRN vs Invoice quantities
  - [ ] Verify matching status
  - [ ] Approve invoice
  - [ ] Post to accounts
  - [ ] Verify voucher created
  - [ ] Check supplier balance updated

### Complete Test Flow
```bash
# 1. Open all procurement pages
./open-pages-by-module.sh procurement

# 2. Open accounting to verify postings
./open-pages-by-module.sh accounting

# 3. Check dashboard
./open-pages-by-module.sh auth
```

## 📚 Additional Resources

- Full page list: `PAGE_LIST.md`
- API documentation: See PAGE_LIST.md API section
- Build info: 63 routes generated
