import * as XLSX from 'xlsx';

/**
 * Excel Export Utilities for DigiInvoice ERP
 * Using SheetJS (XLSX) for Excel file generation
 */

/**
 * Format currency for Excel (as number)
 * @param {number} amount - Amount to format
 * @returns {number} Formatted amount
 */
export const formatCurrencyForExcel = (amount) => {
  return typeof amount === 'number' ? amount : parseFloat(amount) || 0;
};

/**
 * Format date for Excel
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDateForExcel = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-PK');
};

/**
 * Create Excel workbook with multiple sheets
 * @param {Array} sheets - Array of sheet objects {name, data, options}
 * @returns {XLSX.WorkBook} Excel workbook
 */
export const createWorkbook = (sheets = []) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);

    // Apply column widths if specified
    if (sheet.columnWidths) {
      worksheet['!cols'] = sheet.columnWidths.map(width => ({ wch: width }));
    }

    // Apply row heights if specified
    if (sheet.rowHeights) {
      worksheet['!rows'] = sheet.rowHeights.map(height => ({ hpt: height }));
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  return workbook;
};

/**
 * Download workbook as Excel file
 * @param {XLSX.WorkBook} workbook - Excel workbook
 * @param {string} filename - Output filename (without extension)
 */
export const downloadWorkbook = (workbook, filename) => {
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export Trial Balance to Excel
 * @param {Object} trialBalanceData - Trial balance data from API
 * @param {Object} filters - Applied filters
 */
export const exportTrialBalance = (trialBalanceData, filters = {}) => {
  if (!trialBalanceData) return;

  const sheets = [];

  // Summary Sheet
  const summaryData = [
    ['Trial Balance Report'],
    ['DigiInvoice ERP'],
    [''],
    ['Generated On:', new Date().toLocaleString('en-PK')],
    [''],
  ];

  // Add filters
  if (filters.startDate) summaryData.push(['Start Date:', filters.startDate]);
  if (filters.endDate) summaryData.push(['End Date:', filters.endDate]);
  if (filters.fiscalYear) summaryData.push(['Fiscal Year:', filters.fiscalYear]);
  if (filters.fiscalPeriod) summaryData.push(['Fiscal Period:', filters.fiscalPeriod]);

  summaryData.push(
    [''],
    ['Summary'],
    ['Total Debits:', formatCurrencyForExcel(trialBalanceData.totals.debit)],
    ['Total Credits:', formatCurrencyForExcel(trialBalanceData.totals.credit)],
    ['Difference:', formatCurrencyForExcel(trialBalanceData.totals.difference)],
    ['Status:', trialBalanceData.isBalanced ? 'BALANCED' : 'NOT BALANCED'],
    [''],
  );

  sheets.push({
    name: 'Summary',
    data: summaryData,
    columnWidths: [25, 20],
  });

  // Detailed Trial Balance Sheet
  const detailedData = [
    ['Trial Balance - Detailed View'],
    [''],
    ['Account Code', 'Account Name', 'Account Type', 'Debit', 'Credit'],
  ];

  trialBalanceData.trialBalance.forEach(item => {
    detailedData.push([
      item.account.code,
      item.account.name,
      item.account.type,
      formatCurrencyForExcel(item.netDebit),
      formatCurrencyForExcel(item.netCredit),
    ]);
  });

  // Add totals row
  detailedData.push(
    [''],
    ['', 'GRAND TOTAL', '', formatCurrencyForExcel(trialBalanceData.totals.debit), formatCurrencyForExcel(trialBalanceData.totals.credit)],
  );

  sheets.push({
    name: 'Trial Balance',
    data: detailedData,
    columnWidths: [15, 35, 15, 18, 18],
  });

  // Grouped by Type Sheet (if available)
  if (trialBalanceData.groupedByType) {
    const groupedData = [
      ['Trial Balance - Grouped by Account Type'],
      [''],
    ];

    const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    const typeLabels = {
      asset: 'Assets',
      liability: 'Liabilities',
      equity: 'Equity',
      revenue: 'Revenue',
      expense: 'Expense',
    };

    accountTypes.forEach(type => {
      const items = trialBalanceData.groupedByType[type];
      if (!items || items.length === 0) return;

      groupedData.push(
        [''],
        [typeLabels[type]],
        ['Account Code', 'Account Name', 'Debit', 'Credit'],
      );

      let groupDebitTotal = 0;
      let groupCreditTotal = 0;

      items.forEach(item => {
        groupedData.push([
          item.account.code,
          item.account.name,
          formatCurrencyForExcel(item.netDebit),
          formatCurrencyForExcel(item.netCredit),
        ]);
        groupDebitTotal += item.netDebit;
        groupCreditTotal += item.netCredit;
      });

      groupedData.push([
        '',
        `Total ${typeLabels[type]}`,
        formatCurrencyForExcel(groupDebitTotal),
        formatCurrencyForExcel(groupCreditTotal),
      ]);
    });

    sheets.push({
      name: 'Grouped by Type',
      data: groupedData,
      columnWidths: [15, 35, 18, 18],
    });
  }

  const workbook = createWorkbook(sheets);
  const filename = `Trial_Balance_${new Date().toISOString().split('T')[0]}`;
  downloadWorkbook(workbook, filename);
};

/**
 * Export Account Ledger to Excel
 * @param {Object} ledgerData - Ledger data from API
 * @param {Object} filters - Applied filters
 */
export const exportLedger = (ledgerData, filters = {}) => {
  if (!ledgerData) return;

  const sheets = [];

  // Account Info Sheet
  const infoData = [
    ['Account Ledger Report'],
    ['DigiInvoice ERP'],
    [''],
    ['Generated On:', new Date().toLocaleString('en-PK')],
    [''],
    ['Account Information'],
    ['Account Code:', ledgerData.account.code],
    ['Account Name:', ledgerData.account.name],
    ['Account Type:', ledgerData.account.type],
    ['Normal Balance:', ledgerData.account.normalBalance],
    [''],
  ];

  if (filters.startDate) infoData.push(['Start Date:', filters.startDate]);
  if (filters.endDate) infoData.push(['End Date:', filters.endDate]);

  infoData.push(
    [''],
    ['Summary'],
    ['Opening Balance:', formatCurrencyForExcel(ledgerData.openingBalance)],
    ['Total Debits:', formatCurrencyForExcel(ledgerData.totalDebit)],
    ['Total Credits:', formatCurrencyForExcel(ledgerData.totalCredit)],
    ['Net Change:', formatCurrencyForExcel(ledgerData.closingBalance - ledgerData.openingBalance)],
    ['Closing Balance:', formatCurrencyForExcel(ledgerData.closingBalance)],
    [''],
  );

  sheets.push({
    name: 'Account Info',
    data: infoData,
    columnWidths: [25, 25],
  });

  // Transactions Sheet
  const transactionsData = [
    ['Account Ledger - Transactions'],
    ['Account:', `${ledgerData.account.code} - ${ledgerData.account.name}`],
    [''],
    ['Date', 'Voucher Number', 'Description', 'Debit', 'Credit', 'Balance'],
  ];

  ledgerData.entries.forEach(entry => {
    transactionsData.push([
      formatDateForExcel(entry.entryDate),
      entry.voucherId?.voucherNumber || '-',
      entry.description || entry.voucherId?.narration || '-',
      entry.type === 'debit' ? formatCurrencyForExcel(entry.amount) : '',
      entry.type === 'credit' ? formatCurrencyForExcel(entry.amount) : '',
      formatCurrencyForExcel(entry.runningBalance),
    ]);
  });

  sheets.push({
    name: 'Transactions',
    data: transactionsData,
    columnWidths: [12, 18, 40, 15, 15, 15],
  });

  const workbook = createWorkbook(sheets);
  const filename = `Ledger_${ledgerData.account.code}_${new Date().toISOString().split('T')[0]}`;
  downloadWorkbook(workbook, filename);
};

/**
 * Export Chart of Accounts to Excel
 * @param {Array} accounts - Array of account objects
 */
export const exportChartOfAccounts = (accounts) => {
  if (!accounts || accounts.length === 0) return;

  const sheets = [];

  // Summary Sheet
  const summaryData = [
    ['Chart of Accounts'],
    ['DigiInvoice ERP'],
    [''],
    ['Generated On:', new Date().toLocaleString('en-PK')],
    ['Total Accounts:', accounts.length],
    [''],
  ];

  // Count by type
  const typeCounts = accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1;
    return acc;
  }, {});

  summaryData.push(['Accounts by Type:']);
  Object.entries(typeCounts).forEach(([type, count]) => {
    summaryData.push([type, count]);
  });

  sheets.push({
    name: 'Summary',
    data: summaryData,
    columnWidths: [25, 15],
  });

  // All Accounts Sheet
  const accountsData = [
    ['Chart of Accounts - Complete List'],
    [''],
    ['Code', 'Name', 'Type', 'Normal Balance', 'Parent', 'Is Group', 'Status', 'Description'],
  ];

  accounts.forEach(account => {
    accountsData.push([
      account.code,
      account.name,
      account.type,
      account.normalBalance,
      account.parentAccount?.name || '-',
      account.isGroup ? 'Yes' : 'No',
      account.isActive ? 'Active' : 'Inactive',
      account.description || '-',
    ]);
  });

  sheets.push({
    name: 'All Accounts',
    data: accountsData,
    columnWidths: [12, 30, 12, 15, 25, 10, 10, 35],
  });

  // Accounts by Type Sheets
  const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  const typeLabels = {
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expenses',
  };

  accountTypes.forEach(type => {
    const typeAccounts = accounts.filter(acc => acc.type === type);
    if (typeAccounts.length === 0) return;

    const typeData = [
      [`${typeLabels[type]} Accounts`],
      [''],
      ['Code', 'Name', 'Normal Balance', 'Parent', 'Is Group', 'Status'],
    ];

    typeAccounts.forEach(account => {
      typeData.push([
        account.code,
        account.name,
        account.normalBalance,
        account.parentAccount?.name || '-',
        account.isGroup ? 'Yes' : 'No',
        account.isActive ? 'Active' : 'Inactive',
      ]);
    });

    sheets.push({
      name: typeLabels[type],
      data: typeData,
      columnWidths: [12, 30, 15, 25, 10, 10],
    });
  });

  const workbook = createWorkbook(sheets);
  const filename = `Chart_of_Accounts_${new Date().toISOString().split('T')[0]}`;
  downloadWorkbook(workbook, filename);
};

/**
 * Export Sales Report to Excel
 * @param {Array} sales - Array of sales/invoice objects
 * @param {Object} filters - Applied filters
 */
export const exportSalesReport = (sales, filters = {}) => {
  if (!sales || sales.length === 0) return;

  const sheets = [];

  // Summary Sheet
  const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalTax = sales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);

  const summaryData = [
    ['Sales Report'],
    ['DigiInvoice ERP'],
    [''],
    ['Generated On:', new Date().toLocaleString('en-PK')],
    [''],
  ];

  if (filters.startDate) summaryData.push(['Start Date:', filters.startDate]);
  if (filters.endDate) summaryData.push(['End Date:', filters.endDate]);
  if (filters.customer) summaryData.push(['Customer:', filters.customer]);

  summaryData.push(
    [''],
    ['Summary'],
    ['Total Invoices:', sales.length],
    ['Total Sales Amount:', formatCurrencyForExcel(totalSales)],
    ['Total Tax Amount:', formatCurrencyForExcel(totalTax)],
    ['Grand Total:', formatCurrencyForExcel(totalSales + totalTax)],
    [''],
  );

  sheets.push({
    name: 'Summary',
    data: summaryData,
    columnWidths: [25, 20],
  });

  // Sales Details Sheet
  const salesData = [
    ['Sales Report - Details'],
    [''],
    ['Date', 'Invoice No', 'Customer', 'Items', 'Subtotal', 'Tax', 'Total', 'Status', 'Payment Status'],
  ];

  sales.forEach(sale => {
    salesData.push([
      formatDateForExcel(sale.invoiceDate || sale.createdAt),
      sale.invoiceNumber || '-',
      sale.customer?.name || sale.customerName || '-',
      sale.items?.length || 0,
      formatCurrencyForExcel(sale.subtotal || sale.totalAmount),
      formatCurrencyForExcel(sale.taxAmount || 0),
      formatCurrencyForExcel(sale.totalAmount || 0),
      sale.status || '-',
      sale.paymentStatus || '-',
    ]);
  });

  // Add totals row
  salesData.push(
    [''],
    ['', '', 'TOTALS', sales.length, '', formatCurrencyForExcel(totalTax), formatCurrencyForExcel(totalSales + totalTax), '', ''],
  );

  sheets.push({
    name: 'Sales Details',
    data: salesData,
    columnWidths: [12, 18, 30, 8, 15, 15, 15, 12, 15],
  });

  const workbook = createWorkbook(sheets);
  const filename = `Sales_Report_${new Date().toISOString().split('T')[0]}`;
  downloadWorkbook(workbook, filename);
};

/**
 * Export Purchase Report to Excel
 * @param {Array} purchases - Array of purchase/GRN objects
 * @param {Object} filters - Applied filters
 */
export const exportPurchaseReport = (purchases, filters = {}) => {
  if (!purchases || purchases.length === 0) return;

  const sheets = [];

  // Summary Sheet
  const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
  const totalTax = purchases.reduce((sum, purchase) => sum + (purchase.taxAmount || 0), 0);

  const summaryData = [
    ['Purchase Report'],
    ['DigiInvoice ERP'],
    [''],
    ['Generated On:', new Date().toLocaleString('en-PK')],
    [''],
  ];

  if (filters.startDate) summaryData.push(['Start Date:', filters.startDate]);
  if (filters.endDate) summaryData.push(['End Date:', filters.endDate]);
  if (filters.supplier) summaryData.push(['Supplier:', filters.supplier]);

  summaryData.push(
    [''],
    ['Summary'],
    ['Total Orders:', purchases.length],
    ['Total Purchase Amount:', formatCurrencyForExcel(totalPurchases)],
    ['Total Tax Amount:', formatCurrencyForExcel(totalTax)],
    ['Grand Total:', formatCurrencyForExcel(totalPurchases + totalTax)],
    [''],
  );

  sheets.push({
    name: 'Summary',
    data: summaryData,
    columnWidths: [25, 20],
  });

  // Purchase Details Sheet
  const purchaseData = [
    ['Purchase Report - Details'],
    [''],
    ['Date', 'PO/GRN No', 'Supplier', 'Items', 'Subtotal', 'Tax', 'Total', 'Status'],
  ];

  purchases.forEach(purchase => {
    purchaseData.push([
      formatDateForExcel(purchase.orderDate || purchase.grnDate || purchase.createdAt),
      purchase.poNumber || purchase.grnNumber || '-',
      purchase.supplier?.name || purchase.supplierName || '-',
      purchase.items?.length || 0,
      formatCurrencyForExcel(purchase.subtotal || purchase.totalAmount),
      formatCurrencyForExcel(purchase.taxAmount || 0),
      formatCurrencyForExcel(purchase.totalAmount || 0),
      purchase.status || '-',
    ]);
  });

  // Add totals row
  purchaseData.push(
    [''],
    ['', '', 'TOTALS', purchases.length, '', formatCurrencyForExcel(totalTax), formatCurrencyForExcel(totalPurchases + totalTax), ''],
  );

  sheets.push({
    name: 'Purchase Details',
    data: purchaseData,
    columnWidths: [12, 18, 30, 8, 15, 15, 15, 12],
  });

  const workbook = createWorkbook(sheets);
  const filename = `Purchase_Report_${new Date().toISOString().split('T')[0]}`;
  downloadWorkbook(workbook, filename);
};

/**
 * Generic export function for custom data
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Column definitions {header, key, width}
 * @param {string} sheetName - Sheet name
 * @param {string} filename - Output filename
 */
export const exportGenericData = (data, columns, sheetName, filename) => {
  if (!data || data.length === 0) return;

  const exportData = [
    [sheetName],
    [''],
    columns.map(col => col.header),
  ];

  data.forEach(row => {
    exportData.push(
      columns.map(col => {
        const value = row[col.key];
        if (col.type === 'currency') return formatCurrencyForExcel(value);
        if (col.type === 'date') return formatDateForExcel(value);
        return value || '-';
      })
    );
  });

  const sheets = [{
    name: sheetName,
    data: exportData,
    columnWidths: columns.map(col => col.width || 15),
  }];

  const workbook = createWorkbook(sheets);
  downloadWorkbook(workbook, `${filename}_${new Date().toISOString().split('T')[0]}`);
};

export default {
  exportTrialBalance,
  exportLedger,
  exportChartOfAccounts,
  exportSalesReport,
  exportPurchaseReport,
  exportGenericData,
  createWorkbook,
  downloadWorkbook,
};
