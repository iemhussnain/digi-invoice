# Excel/CSV Export Feature Documentation

## Overview
The DigiInvoice ERP system now includes comprehensive Excel export functionality for accountants and financial professionals. This feature allows users to export various reports and data to Excel (.xlsx) format with proper formatting, multiple sheets, and formulas.

## Technology Stack
- **Library**: XLSX (SheetJS) - `npm install xlsx`
- **Version**: Latest
- **Documentation**: https://docs.sheetjs.com/

## Features Implemented

### 1. **Core Export Utilities** (`/src/utils/excelExport.js`)
A comprehensive utility module that provides:
- Currency formatting for Excel
- Date formatting for Excel
- Multi-sheet workbook creation
- Column width and row height configuration
- Download functionality

### 2. **Trial Balance Export**
**Location**: `/admin/reports/trial-balance`

**Features**:
- Summary sheet with totals and balance status
- Detailed trial balance sheet with all accounts
- Grouped by account type sheet (Assets, Liabilities, Equity, Revenue, Expenses)
- Applied filters included in the export
- Currency formatting
- Color-coded sections

**Export Includes**:
- Generated date and time
- Applied filters (Start Date, End Date, Fiscal Year, Fiscal Period)
- Total Debits and Credits
- Difference and Balance Status
- Account Code, Name, Type
- Individual account balances
- Subtotals by account type

**File Name Format**: `Trial_Balance_YYYY-MM-DD.xlsx`

### 3. **Account Ledger Export**
**Location**: `/admin/reports/ledger`

**Features**:
- Account information sheet
- Complete transaction history
- Running balance for each transaction
- Summary of debits, credits, and net change
- Voucher references with hyperlinks

**Export Includes**:
- Account details (Code, Name, Type, Normal Balance)
- Opening and Closing Balance
- Total Debits and Credits
- Net Change
- Date, Voucher Number, Description
- Transaction amounts
- Running balance after each transaction

**File Name Format**: `Ledger_{AccountCode}_YYYY-MM-DD.xlsx`

### 4. **Chart of Accounts Export**
**Location**: `/admin/accounts`

**Features**:
- Summary sheet with account counts by type
- Complete accounts list
- Separate sheets for each account type
- Hierarchical structure indication
- System account identification

**Export Includes**:
- Total accounts count
- Accounts by type breakdown
- Account Code, Name, Type
- Normal Balance, Parent Account
- Group/Individual status
- Active/Inactive status
- Description

**File Name Format**: `Chart_of_Accounts_YYYY-MM-DD.xlsx`

### 5. **Sales Report Export**
**Location**: `/admin/invoices`

**Features**:
- Summary sheet with totals
- Detailed sales transactions
- Tax calculations
- Payment status tracking

**Export Includes**:
- Total invoices count
- Total sales amount
- Total tax amount
- Grand total
- Date, Invoice Number
- Customer details
- Item count
- Subtotal, Tax, Total
- Status and Payment Status

**File Name Format**: `Sales_Report_YYYY-MM-DD.xlsx`

### 6. **Purchase Report Export**
**Location**: `/admin/purchase-orders`

**Features**:
- Summary sheet with totals
- Detailed purchase transactions
- Supplier information
- Status tracking

**Export Includes**:
- Total orders count
- Total purchase amount
- Total tax amount
- Grand total
- Date, PO/GRN Number
- Supplier details
- Item count
- Subtotal, Tax, Total
- Status

**File Name Format**: `Purchase_Report_YYYY-MM-DD.xlsx`

## User Interface

### Export Button Design
All export buttons follow a consistent design:
- **Color**: Green background (`bg-green-600`)
- **Icon**: Download icon (SVG)
- **Text**: "Export to Excel"
- **Location**: Next to primary action buttons in the header
- **Behavior**: Only visible when data is available

### Button Example
```jsx
<button
  onClick={() => exportFunction(data, filters)}
  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  Export to Excel
</button>
```

## Usage Guide

### For Developers

#### 1. Import the Export Function
```javascript
import { exportTrialBalance, exportLedger, exportChartOfAccounts, exportSalesReport, exportPurchaseReport } from '@/utils/excelExport';
```

#### 2. Call the Export Function
```javascript
// Example: Export Trial Balance
exportTrialBalance(trialBalanceData, {
  startDate,
  endDate,
  fiscalYear,
  fiscalPeriod
});

// Example: Export Ledger
exportLedger(ledgerData, {
  startDate,
  endDate
});

// Example: Export Chart of Accounts
exportChartOfAccounts(accounts);

// Example: Export Sales Report
exportSalesReport(invoices, {
  filterStatus,
  filterPayment
});

// Example: Export Purchase Report
exportPurchaseReport(purchaseOrders, {
  status,
  supplier
});
```

#### 3. Generic Export Function
For custom exports, use the generic function:
```javascript
import { exportGenericData } from '@/utils/excelExport';

const columns = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Amount', key: 'amount', width: 15, type: 'currency' },
  { header: 'Date', key: 'date', width: 12, type: 'date' },
];

exportGenericData(data, columns, 'My Report', 'my_report_filename');
```

### For End Users (Accountants)

#### How to Export Reports:

1. **Navigate to the desired report page**:
   - Trial Balance: `/admin/reports/trial-balance`
   - Account Ledger: `/admin/reports/ledger`
   - Chart of Accounts: `/admin/accounts`
   - Sales Invoices: `/admin/invoices`
   - Purchase Orders: `/admin/purchase-orders`

2. **Apply filters** (if needed):
   - Date ranges
   - Fiscal periods
   - Account types
   - Status filters

3. **Generate the report** by clicking the "Generate Report" button

4. **Click "Export to Excel"** button (green button with download icon)

5. **The file will be downloaded** to your default downloads folder

6. **Open the Excel file**:
   - Multiple sheets for different views
   - Formatted columns and headers
   - Summary information
   - Ready for further analysis or printing

## Excel File Structure

### Multi-Sheet Organization
Each export contains multiple sheets for different views:

1. **Summary Sheet**: High-level overview with key metrics
2. **Detailed Sheet**: Complete data with all fields
3. **Grouped Sheets** (where applicable): Data organized by categories

### Formatting Features
- **Headers**: Bold, clear column headers
- **Currency**: Proper number formatting with currency symbol
- **Dates**: Localized date format (dd MMM yyyy)
- **Column Widths**: Auto-sized for readability
- **Totals**: Summary rows at the bottom of data sections

## File Naming Convention
All exported files follow this pattern:
- `{ReportType}_{YYYY-MM-DD}.xlsx`
- Example: `Trial_Balance_2024-11-12.xlsx`

This ensures:
- Easy identification
- Chronological sorting
- No file name conflicts

## Technical Details

### Browser Compatibility
- Works in all modern browsers
- Uses client-side file generation
- No server-side processing required

### Performance
- Efficient for datasets up to 10,000 rows
- Client-side generation (no server load)
- Instant download after processing

### File Size
- Typical file sizes:
  - Trial Balance: 20-50 KB
  - Ledger (100 transactions): 15-30 KB
  - Chart of Accounts (50 accounts): 10-25 KB
  - Sales/Purchase Reports: 30-100 KB

## Customization Options

### Adding New Export Functions
To add a new export function:

1. Create a function in `/src/utils/excelExport.js`
2. Define the data structure and sheets
3. Use the `createWorkbook` and `downloadWorkbook` utilities
4. Add the export button to your page component

Example:
```javascript
export const exportCustomReport = (data, filters = {}) => {
  const sheets = [
    {
      name: 'Summary',
      data: [
        ['Custom Report'],
        ['Generated On:', new Date().toLocaleString()],
        // ... more data
      ],
      columnWidths: [25, 20],
    },
    // ... more sheets
  ];

  const workbook = createWorkbook(sheets);
  downloadWorkbook(workbook, 'Custom_Report');
};
```

### Styling Options
XLSX supports:
- Cell formatting
- Font styles (bold, italic)
- Colors and backgrounds
- Borders
- Number formats
- Column widths and row heights

## Best Practices

### For Developers
1. Always validate data before export
2. Include filter information in the export
3. Use consistent naming conventions
4. Add generation timestamp
5. Provide summary sheets for large datasets
6. Test with various data sizes

### For Users
1. Apply filters before exporting for specific data
2. Check the summary sheet first for overview
3. Use pivot tables in Excel for advanced analysis
4. Save files with descriptive names
5. Regular backups of exported reports

## Troubleshooting

### Common Issues

**Issue**: Export button not visible
- **Solution**: Ensure data is loaded/available

**Issue**: Empty Excel file
- **Solution**: Check that data is properly formatted and not null

**Issue**: Download not starting
- **Solution**: Check browser download settings and permissions

**Issue**: Incorrect formatting
- **Solution**: Verify data types (numbers, dates) are correct

## Future Enhancements

Potential improvements:
1. PDF export option
2. CSV export alongside Excel
3. Email export directly from the system
4. Scheduled automatic exports
5. Custom template support
6. Advanced formatting options
7. Chart and graph inclusion
8. Consolidated multi-report exports

## Support

For issues or questions:
1. Check this documentation
2. Review the code in `/src/utils/excelExport.js`
3. Test with sample data first
4. Check browser console for errors

## Conclusion

The Excel export feature provides a powerful tool for accountants to:
- Extract data for external analysis
- Create backups of financial reports
- Share information with stakeholders
- Perform advanced calculations in Excel
- Generate audit trails

All exports maintain data integrity and formatting, making them immediately useful for financial analysis and reporting.
