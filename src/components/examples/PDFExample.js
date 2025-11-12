'use client';

import { useState } from 'react';
import { PDFDownloadLink, PDFViewer, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

/**
 * @react-pdf/renderer - PDF Generation Examples
 *
 * Benefits:
 * - Create PDFs using React components
 * - Professional document generation
 * - Declarative syntax
 * - Print invoices, reports, vouchers
 * - Export financial statements
 */

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #3B82F6',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  // Title
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#111827',
  },
  // Info Section
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  // Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottom: '1 solid #D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 5,
    backgroundColor: '#F9FAFB',
  },
  col1: { width: '5%' },
  col2: { width: '40%' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '25%', textAlign: 'right' },
  // Totals
  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTop: '1 solid #E5E7EB',
  },
  grandTotal: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTop: '2 solid #3B82F6',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
    fontSize: 8,
    color: '#6B7280',
  },
  footerText: {
    textAlign: 'center',
    marginBottom: 3,
  },
  // Notes
  notesSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78716C',
  },
});

// Sales Invoice PDF Template
const SalesInvoicePDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>DigiInvoice ERP</Text>
        <Text style={styles.companyDetails}>123 Business Street, Karachi, Pakistan</Text>
        <Text style={styles.companyDetails}>Phone: +92-300-1234567 | Email: info@digiinvoice.pk</Text>
        <Text style={styles.companyDetails}>NTN: 1234567-8 | STRN: 32-00-0000-000-00</Text>
      </View>

      {/* Title */}
      <Text style={styles.documentTitle}>SALES INVOICE</Text>

      {/* Invoice Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Bill To:</Text>
          <Text style={styles.infoValue}>{data.customer.name}</Text>
          <Text style={styles.companyDetails}>{data.customer.address}</Text>
          <Text style={styles.companyDetails}>Phone: {data.customer.phone}</Text>
          <Text style={styles.companyDetails}>NTN: {data.customer.ntn}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Invoice #:</Text>
          <Text style={styles.infoValue}>{data.invoiceNumber}</Text>

          <Text style={styles.infoLabel}>Invoice Date:</Text>
          <Text style={styles.infoValue}>{data.invoiceDate}</Text>

          <Text style={styles.infoLabel}>Due Date:</Text>
          <Text style={styles.infoValue}>{data.dueDate}</Text>
        </View>
      </View>

      {/* Line Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>#</Text>
          <Text style={styles.col2}>Description</Text>
          <Text style={styles.col3}>Quantity</Text>
          <Text style={styles.col4}>Rate</Text>
          <Text style={styles.col5}>Amount</Text>
        </View>

        {data.items.map((item, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.col1}>{index + 1}</Text>
            <Text style={styles.col2}>{item.description}</Text>
            <Text style={styles.col3}>{item.quantity}</Text>
            <Text style={styles.col4}>PKR {item.rate.toLocaleString()}</Text>
            <Text style={styles.col5}>PKR {item.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>PKR {data.subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Tax ({data.taxRate}%):</Text>
          <Text>PKR {data.tax.toLocaleString()}</Text>
        </View>
        <View style={styles.grandTotal}>
          <Text>Total Amount:</Text>
          <Text>PKR {data.total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Payment Terms:</Text>
        <Text style={styles.notesText}>Payment due within 30 days. Please include invoice number with payment.</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for your business!</Text>
        <Text style={styles.footerText}>This is a computer-generated invoice and does not require a signature.</Text>
      </View>
    </Page>
  </Document>
);

// Purchase Order PDF Template
const PurchaseOrderPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>DigiInvoice ERP</Text>
        <Text style={styles.companyDetails}>123 Business Street, Karachi, Pakistan</Text>
        <Text style={styles.companyDetails}>Phone: +92-300-1234567 | Email: procurement@digiinvoice.pk</Text>
      </View>

      {/* Title */}
      <Text style={styles.documentTitle}>PURCHASE ORDER</Text>

      {/* PO Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Vendor:</Text>
          <Text style={styles.infoValue}>{data.supplier.name}</Text>
          <Text style={styles.companyDetails}>{data.supplier.address}</Text>
          <Text style={styles.companyDetails}>Contact: {data.supplier.contact}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>PO Number:</Text>
          <Text style={styles.infoValue}>{data.poNumber}</Text>

          <Text style={styles.infoLabel}>PO Date:</Text>
          <Text style={styles.infoValue}>{data.poDate}</Text>

          <Text style={styles.infoLabel}>Expected Delivery:</Text>
          <Text style={styles.infoValue}>{data.deliveryDate}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>#</Text>
          <Text style={styles.col2}>Item Description</Text>
          <Text style={styles.col3}>Qty</Text>
          <Text style={styles.col4}>Unit Price</Text>
          <Text style={styles.col5}>Total</Text>
        </View>

        {data.items.map((item, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.col1}>{index + 1}</Text>
            <Text style={styles.col2}>{item.description}</Text>
            <Text style={styles.col3}>{item.quantity}</Text>
            <Text style={styles.col4}>PKR {item.unitPrice.toLocaleString()}</Text>
            <Text style={styles.col5}>PKR {item.total.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.grandTotal}>
          <Text>Total Amount:</Text>
          <Text>PKR {data.total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Terms */}
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Terms & Conditions:</Text>
        <Text style={styles.notesText}>• Payment Terms: {data.paymentTerms}</Text>
        <Text style={styles.notesText}>• Delivery to warehouse by specified date</Text>
        <Text style={styles.notesText}>• Quality inspection upon receipt</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Authorized by: ___________________  Date: ___________</Text>
      </View>
    </Page>
  </Document>
);

// Trial Balance PDF Template
const TrialBalancePDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>DigiInvoice ERP</Text>
        <Text style={styles.companyDetails}>Financial Reports</Text>
      </View>

      {/* Title */}
      <Text style={styles.documentTitle}>TRIAL BALANCE</Text>
      <Text style={{ textAlign: 'center', fontSize: 10, marginBottom: 15, color: '#6B7280' }}>
        As of {data.asOfDate}
      </Text>

      {/* Accounts Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={{ width: '10%' }}>Code</Text>
          <Text style={{ width: '50%' }}>Account Name</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>Debit</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>Credit</Text>
        </View>

        {data.accounts.map((account, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={{ width: '10%' }}>{account.code}</Text>
            <Text style={{ width: '50%' }}>{account.name}</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>
              {account.debit > 0 ? `PKR ${account.debit.toLocaleString()}` : '-'}
            </Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>
              {account.credit > 0 ? `PKR ${account.credit.toLocaleString()}` : '-'}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.grandTotal}>
          <Text style={{ width: '60%', textAlign: 'right' }}>Total:</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>PKR {data.totalDebit.toLocaleString()}</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>PKR {data.totalCredit.toLocaleString()}</Text>
        </View>
      </View>

      {/* Balance Check */}
      <View style={[styles.notesSection, { backgroundColor: data.balanced ? '#D1FAE5' : '#FEE2E2' }]}>
        <Text style={styles.notesTitle}>
          {data.balanced ? '✓ Trial Balance is Balanced' : '✗ Trial Balance is NOT Balanced'}
        </Text>
        <Text style={styles.notesText}>
          Difference: PKR {Math.abs(data.totalDebit - data.totalCredit).toLocaleString()}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        <Text style={styles.footerText}>DigiInvoice ERP - Financial Accounting System</Text>
      </View>
    </Page>
  </Document>
);

// Main Example Component
export default function PDFExample() {
  const [selectedTemplate, setSelectedTemplate] = useState('invoice');

  // Sample Data
  const invoiceData = {
    invoiceNumber: 'INV-2025-001',
    invoiceDate: '11/11/2025',
    dueDate: '11/12/2025',
    customer: {
      name: 'ABC Corporation Ltd.',
      address: '456 Corporate Avenue, Lahore, Pakistan',
      phone: '+92-300-7654321',
      ntn: '9876543-2',
    },
    items: [
      { description: 'Web Development Services', quantity: 1, rate: 150000, amount: 150000 },
      { description: 'Mobile App Development', quantity: 1, rate: 200000, amount: 200000 },
      { description: 'UI/UX Design Services', quantity: 2, rate: 50000, amount: 100000 },
    ],
    subtotal: 450000,
    taxRate: 17,
    tax: 76500,
    total: 526500,
  };

  const poData = {
    poNumber: 'PO-2025-045',
    poDate: '11/11/2025',
    deliveryDate: '25/11/2025',
    supplier: {
      name: 'Tech Supplies Pakistan',
      address: '789 Industrial Area, Karachi',
      contact: 'Mr. Ahmed - +92-321-1111111',
    },
    items: [
      { description: 'Dell Laptops (i7, 16GB RAM)', quantity: 10, unitPrice: 150000, total: 1500000 },
      { description: 'HP Printers (LaserJet)', quantity: 5, unitPrice: 45000, total: 225000 },
      { description: 'Office Chairs (Ergonomic)', quantity: 20, unitPrice: 15000, total: 300000 },
    ],
    total: 2025000,
    paymentTerms: 'Net 30 days',
  };

  const trialBalanceData = {
    asOfDate: '30/11/2025',
    accounts: [
      { code: '1000', name: 'Cash', debit: 500000, credit: 0 },
      { code: '1100', name: 'Accounts Receivable', debit: 750000, credit: 0 },
      { code: '1500', name: 'Inventory', debit: 1200000, credit: 0 },
      { code: '2000', name: 'Accounts Payable', debit: 0, credit: 650000 },
      { code: '2100', name: 'Sales Tax Payable', debit: 0, credit: 85000 },
      { code: '3000', name: 'Capital', debit: 0, credit: 1000000 },
      { code: '4000', name: 'Sales Revenue', debit: 0, credit: 2500000 },
      { code: '5000', name: 'Cost of Goods Sold', debit: 1200000, credit: 0 },
      { code: '6000', name: 'Salaries Expense', debit: 450000, credit: 0 },
      { code: '6100', name: 'Rent Expense', debit: 135000, credit: 0 },
    ],
    totalDebit: 4235000,
    totalCredit: 4235000,
    balanced: true,
  };

  const templates = [
    { id: 'invoice', name: 'Sales Invoice', icon: '📄', component: SalesInvoicePDF, data: invoiceData },
    { id: 'po', name: 'Purchase Order', icon: '📋', component: PurchaseOrderPDF, data: poData },
    { id: 'trial', name: 'Trial Balance', icon: '📊', component: TrialBalancePDF, data: trialBalanceData },
  ];

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);
  const PDFComponent = currentTemplate.component;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          @react-pdf/renderer - PDF Generation
        </h2>
        <p className="text-gray-600 mb-6">
          Generate professional PDFs for invoices, purchase orders, and financial reports
        </p>
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select PDF Template
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{template.icon}</div>
              <div className="font-semibold text-gray-900">{template.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* PDF Preview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            PDF Preview
          </h3>
          <PDFDownloadLink
            document={<PDFComponent data={currentTemplate.data} />}
            fileName={`${currentTemplate.id}-${Date.now()}.pdf`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {({ loading }) => (loading ? 'Generating PDF...' : '⬇️ Download PDF')}
          </PDFDownloadLink>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <PDFViewer width="100%" height="100%">
            <PDFComponent data={currentTemplate.data} />
          </PDFViewer>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Perfect Use Cases in DigiInvoice ERP
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Sales Module:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Sales invoices with company letterhead</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Tax invoices for GST compliance</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Delivery notes</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Payment receipts</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Procurement:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Purchase orders to send to suppliers</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Goods receipt notes (GRN)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Purchase invoices</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Supplier payment vouchers</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Accounting:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Journal vouchers</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Payment vouchers</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Receipt vouchers</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Bank reconciliation statements</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Financial Reports:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Trial balance</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Balance sheet</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Profit & Loss statement</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Account ledgers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Usage Example
        </h3>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
          <code>{`// Import @react-pdf/renderer
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

// Create PDF template component
const InvoicePDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>SALES INVOICE</Text>
      <Text>Invoice #: {data.invoiceNumber}</Text>
      <Text>Customer: {data.customerName}</Text>
      {/* ... more content ... */}
    </Page>
  </Document>
);

// Use in your component
function InvoicePage({ invoice }) {
  return (
    <PDFDownloadLink
      document={<InvoicePDF data={invoice} />}
      fileName="invoice.pdf"
    >
      {({ loading }) => (loading ? 'Generating...' : 'Download PDF')}
    </PDFDownloadLink>
  );
}`}</code>
        </pre>
      </div>

      {/* Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Before vs After Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">
              ❌ Before (Manual PDF Creation)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Manual formatting in Word/Excel</li>
              <li>• Export to PDF manually</li>
              <li>• Inconsistent templates</li>
              <li>• Time-consuming process</li>
              <li>• Hard to automate</li>
              <li>• Prone to human errors</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ After (@react-pdf/renderer)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Automatic PDF generation</li>
              <li>• One-click download</li>
              <li>• Consistent professional templates</li>
              <li>• Instant generation</li>
              <li>• Fully automated</li>
              <li>• No manual errors</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">⚛️</div>
            <h4 className="font-semibold text-gray-900 mb-2">React Components</h4>
            <p className="text-sm text-gray-700">
              Use familiar React syntax to create PDF layouts
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🎨</div>
            <h4 className="font-semibold text-gray-900 mb-2">Styling with CSS</h4>
            <p className="text-sm text-gray-700">
              StyleSheet API similar to React Native for PDF styling
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-semibold text-gray-900 mb-2">Responsive</h4>
            <p className="text-sm text-gray-700">
              Create responsive PDF layouts that work on any page size
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">Fast Generation</h4>
            <p className="text-sm text-gray-700">
              PDFs are generated instantly in the browser
            </p>
          </div>

          <div className="p-4 bg-pink-50 rounded-lg">
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="font-semibold text-gray-900 mb-2">Dynamic Content</h4>
            <p className="text-sm text-gray-700">
              Generate PDFs with live data from your database
            </p>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl mb-2">📥</div>
            <h4 className="font-semibold text-gray-900 mb-2">Download & Preview</h4>
            <p className="text-sm text-gray-700">
              Preview in browser or download directly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
