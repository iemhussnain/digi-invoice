# Library Recommendations for DigiInvoice ERP

Comprehensive guide to recommended libraries for enhancing DigiInvoice ERP functionality.

## Status Legend

- ✅ **Implemented** - Already installed and configured
- 🎯 **Recommended** - High priority for next phase
- 💡 **Optional** - Nice to have, can be added later
- ℹ️ **Already Using** - Native feature or existing solution

---

## Table of Contents

1. [Form Management](#1-form-management-) ✅
2. [API Data Management](#2-api-data-management-) ✅
3. [Data Tables](#3-data-tables-) ✅
4. [Global State Management](#4-global-state-management-) ✅
5. [UI Component Libraries](#5-ui-component-libraries-) 🎯
6. [Date Handling](#6-date-handling-) ℹ️
7. [PDF Generation](#7-pdf-generation-) 🎯
8. [Excel/CSV Export](#8-excelcsv-export-) 🎯
9. [Charts & Visualizations](#9-charts--visualizations-) 🎯
10. [Currency & Number Formatting](#10-currency--number-formatting-) ℹ️
11. [Loading States](#11-loading-states-) 💡
12. [Search & Autocomplete](#12-search--autocomplete-) 💡
13. [Authentication Enhancement](#13-authentication-enhancement-) 💡
14. [Email](#14-email-) 💡
15. [File Upload](#15-file-upload-) 💡

---

## 1. Form Management ✅

### Current Problem (Solved!)
- Manual `useState` for every form field
- Validation logic scattered everywhere
- Code duplication across forms
- No type safety

### Implemented Solution

**Libraries:** React Hook Form + Zod + @hookform/resolvers

```bash
npm install react-hook-form zod @hookform/resolvers
```

**Benefits:**
- ✅ No manual useState for fields
- ✅ Schema-based validation with Zod
- ✅ Type-safe form data
- ✅ Automatic error handling
- ✅ Performance optimized (uncontrolled components)

**Example:** `src/components/examples/CustomerFormExample.js`

**Usage:**
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  ntn: z.string().optional(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

**See:** `/admin/library-examples` → Form Example tab

---

## 2. API Data Management ✅

### Current Problem (Solved!)
- Manual `useEffect` + `fetch` in every component
- No caching - repeated API calls for same data
- Manual loading state management
- Stale data issues

### Implemented Solution

**Libraries:** TanStack Query + TanStack Query Devtools

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Benefits:**
- ✅ Automatic caching (5 minutes stale time)
- ✅ Background refetching
- ✅ Window focus refetching
- ✅ Built-in loading/error states
- ✅ Optimistic updates
- ✅ Dev tools for debugging

**Example:** `src/components/examples/CustomersTableExample.js`

**Usage:**
```javascript
import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['customers'],
  queryFn: () => apiGet('/customers'),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

const mutation = useMutation({
  mutationFn: (data) => apiPost('/customers', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  },
});
```

**See:** `/admin/library-examples` → Data Table Example tab

---

## 3. Data Tables ✅

### Current Problem (Solved!)
- Plain HTML tables with no features
- No sorting, filtering, or pagination
- Manual implementation required

### Implemented Solution

**Library:** TanStack Table

```bash
npm install @tanstack/react-table
```

**Benefits:**
- ✅ Built-in sorting (click column headers)
- ✅ Global filtering (search all columns)
- ✅ Pagination with page size selection
- ✅ Headless UI (full control over styling)
- ✅ Performance optimized for large datasets

**Example:** `src/components/examples/CustomersTableExample.js`

**Usage:**
```javascript
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data: customers,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
```

**Alternative for Complex Use Cases:**

**AG Grid** - Excel-like experience with advanced features (cell editing, grouping, export)

**When to use:** Financial reports with thousands of entries, complex aggregations

---

## 4. Global State Management ✅

### Current Problem (Solved!)
- User info fetched in every component (props drilling)
- Organization settings repeatedly loaded
- No state persistence

### Implemented Solution

**Library:** Zustand

```bash
npm install zustand
```

**Benefits:**
- ✅ Minimal boilerplate (vs Redux)
- ✅ Hook-based API
- ✅ Automatic localStorage persistence
- ✅ No context providers needed
- ✅ Only 1kb gzipped

**Stores Created:**
1. `useAuthStore` - User authentication, permissions
2. `useSettingsStore` - Organization settings, fiscal year
3. `useThemeStore` - Dark/light mode toggle

**Example:** `src/components/examples/ZustandExample.js`

**Usage:**
```javascript
import { useAuthStore } from '@/stores/useAuthStore';

function MyComponent() {
  const user = useAuthStore(state => state.user);
  const isAdmin = useAuthStore(state => state.isAdmin());
  const logout = useAuthStore(state => state.logout);

  return <div>Welcome, {user?.name}</div>;
}
```

**See:** `/admin/library-examples` → State Management tab

---

## 5. UI Component Libraries 🎯

### Current Problem
- Every modal, dropdown, button manually created
- Inconsistent UI
- Accessibility issues
- Time-consuming to build

### Recommended Solutions

#### Option 1: Flowbite React (🎯 **Recommended**)

**Why Perfect for this Project:**
- Already using TailwindCSS
- Tailwind-based pre-built components
- Professional design out of the box
- Good documentation

```bash
npm install flowbite flowbite-react
```

**Components:** Modals, Dropdowns, Tables, Cards, Badges, Tabs, Alerts, etc.

**Use Case:** Quick professional UI without custom CSS

**Example:**
```javascript
import { Modal, Button } from 'flowbite-react';

function MyModal() {
  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Modal Title</Modal.Header>
      <Modal.Body>Content here</Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
```

#### Option 2: Headless UI (💡 **For Custom Styling**)

**Concept:** Unstyled but accessible components

**Benefit:** Full control over styling, but behavior handled

```bash
npm install @headlessui/react
```

**Components:** Dialog/Modal, Menu, Tabs, Transitions, Disclosure

**Use Case:** Custom-styled components with proper accessibility

**Example:**
```javascript
import { Dialog } from '@headlessui/react';

function MyModal() {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel className="bg-white rounded-lg p-6">
        <Dialog.Title>Modal Title</Dialog.Title>
        {/* Your custom styled content */}
      </Dialog.Panel>
    </Dialog>
  );
}
```

#### Option 3: Shadcn UI (💡 **Trending in 2024-2025**)

**Concept:** Copy-paste components (not npm package)

**Benefit:** Full ownership, Tailwind + Radix UI primitives

**How it works:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
```

**Components are copied into your project** - you own and customize them

**Use Case:** Full customization with pre-built accessible components

---

## 6. Date Handling ℹ️

### Current State

✅ **Already Using:** `date-fns` (Excellent choice!)

**Why date-fns is Best:**
- Tree-shakeable (only import what you use)
- Immutable
- Functional programming style
- Better than Moment.js (deprecated)

**Keep using it!**

### Optional Addition: React Datepicker (💡)

**Concept:** Visual calendar picker

**Integrates with:** date-fns

```bash
npm install react-datepicker
```

**Use Case:** Invoice date selection, date range for reports

**Example:**
```javascript
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

<DatePicker
  selected={startDate}
  onChange={(date) => setStartDate(date)}
  dateFormat="dd/MM/yyyy"
/>
```

**Alternative:** `react-day-picker` - More flexible, integrates with React Hook Form

---

## 7. PDF Generation 🎯

### Current Problem
- Invoices need to be printed
- Reports need PDF export
- No PDF generation capability

### Recommended Solutions

#### Option 1: @react-pdf/renderer (🎯 **Recommended**)

**Concept:** Generate PDFs from React components

**Benefit:** Declarative, same as React UI code

```bash
npm install @react-pdf/renderer
```

**Use Case:**
- Sales invoices
- Purchase orders
- Vouchers
- Financial reports

**Example:**
```javascript
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const InvoicePDF = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>Invoice #{invoice.number}</Text>
        <Text>Customer: {invoice.customer.name}</Text>
      </View>
    </Page>
  </Document>
);

// In your component
<PDFDownloadLink document={<InvoicePDF invoice={data} />} fileName="invoice.pdf">
  {({ loading }) => (loading ? 'Loading PDF...' : 'Download PDF')}
</PDFDownloadLink>
```

**Benefits:**
- ✅ React-like syntax
- ✅ Good quality output
- ✅ Small file sizes
- ✅ Server-side rendering support

#### Option 2: jsPDF + html2canvas (💡 **Alternative**)

**Concept:** Screenshot HTML and convert to PDF

```bash
npm install jspdf html2canvas
```

**Benefit:** Existing UI directly converts to PDF

**Drawback:** Quality issues, large file sizes

**Use Case:** Quick & dirty PDFs, when you don't want to rebuild layout

---

## 8. Excel/CSV Export 🎯

### Current Problem
- Accountants need data in Excel
- Reports need spreadsheet export
- No export functionality

### Recommended Solution

**Library:** XLSX (SheetJS)

```bash
npm install xlsx
```

**Features:**
- ✅ .xlsx file generation
- ✅ Multiple sheets
- ✅ Cell formatting, formulas
- ✅ Read & write Excel files

**Use Case:**
- Trial Balance export
- Ledger export
- Sales/Purchase reports
- Chart of Accounts export
- Customer/Supplier lists

**Example:**
```javascript
import * as XLSX from 'xlsx';

function exportToExcel(data, filename) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Add formatting
  worksheet['!cols'] = [
    { width: 20 }, // Column A width
    { width: 30 }, // Column B width
  ];

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Usage
exportToExcel(customers, 'customers-list');
```

**Alternative:** `papaparse` for CSV-only (smaller, simpler)

---

## 9. Charts & Visualizations 🎯

### Current Problem
- Dashboard has numbers, no graphs
- No visual insights
- Hard to see trends

### Recommended Solutions

#### Option 1: Recharts (🎯 **Recommended**)

**Concept:** React-first charting library

**Benefit:** Declarative, composable, built for React

```bash
npm install recharts
```

**Charts:** Line, Bar, Pie, Area, Radar, Scatter

**Use Case:**
- Sales trends (monthly revenue)
- Expense breakdown (pie chart)
- Cash flow graph
- Top customers/suppliers
- Account balance over time

**Example:**
```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { month: 'Jan', sales: 4000, expenses: 2400 },
  { month: 'Feb', sales: 3000, expenses: 1398 },
  { month: 'Mar', sales: 2000, expenses: 9800 },
];

<LineChart width={600} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="sales" stroke="#8884d8" />
  <Line type="monotone" dataKey="expenses" stroke="#82ca9d" />
</LineChart>
```

#### Option 2: Chart.js (💡 **Alternative**)

**More features, but imperative API**

**When to use:** Need more advanced chart types, already familiar with Chart.js

---

## 10. Currency & Number Formatting ℹ️

### Current Problem
- Pakistani format needed: 1,00,000 (not 100,000)
- Currency symbol: ₨ (PKR)

### Recommended Solutions

#### Option 1: Intl API (ℹ️ **Recommended - Built-in**)

**No installation needed!**

**Pakistani format:**
```javascript
// Currency
const formatter = new Intl.NumberFormat('ur-PK', {
  style: 'currency',
  currency: 'PKR'
});

formatter.format(100000);
// Output: ₨1,00,000.00

// Plain number with Pakistani grouping
const numberFormatter = new Intl.NumberFormat('ur-PK');
numberFormatter.format(100000);
// Output: 1,00,000
```

**Benefits:**
- ✅ Native, no library needed
- ✅ Supports all currencies
- ✅ Locale-aware formatting
- ✅ Small footprint

**Integrate with Zustand:**
```javascript
// In useSettingsStore
formatCurrency: (amount) => {
  const { organization } = get();
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: organization.currency || 'PKR',
  }).format(amount);
}
```

#### Option 2: Numeral.js (💡 **For Custom Formats**)

```bash
npm install numeral
```

**More control, custom formats**

**Example:**
```javascript
import numeral from 'numeral';

numeral(100000).format('0,0'); // 100,000
numeral(1000).format('$0,0.00'); // $1,000.00
```

**Use Case:** Complex number formatting requirements

---

## 11. Loading States 💡

### Current Problem
- "Loading..." text looks unprofessional
- Poor user experience while data loads

### Recommended Solution

**Library:** React Loading Skeleton

```bash
npm install react-loading-skeleton
```

**Concept:** Placeholder UI while data loads (skeleton screens)

**Benefit:** Better perceived performance, professional look

**Use Case:**
- Table rows loading
- Card content loading
- Form loading
- Dashboard loading

**Example:**
```javascript
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function CustomerCard() {
  if (isLoading) {
    return (
      <div>
        <Skeleton height={30} width={200} />
        <Skeleton height={20} width={150} />
        <Skeleton height={40} />
      </div>
    );
  }

  return <div>{customer.name}</div>;
}
```

**Alternative:** Build custom skeleton with TailwindCSS `animate-pulse`

---

## 12. Search & Autocomplete 💡

### Current Problem
- Account selection requires scrolling through long dropdown
- No customer/supplier search
- No autocomplete

### Recommended Solutions

#### Option 1: React Select (💡 **Simple Cases**)

```bash
npm install react-select
```

**Features:**
- Multi-select
- Async loading
- Search/filter
- Customizable

**Use Case:** Account selector, customer selector

**Example:**
```javascript
import Select from 'react-select';

const options = accounts.map(acc => ({
  value: acc._id,
  label: `${acc.code} - ${acc.name}`
}));

<Select
  options={options}
  onChange={(selected) => setAccount(selected.value)}
  isSearchable
  placeholder="Search accounts..."
/>
```

#### Option 2: Downshift (💡 **Flexible**)

```bash
npm install downshift
```

**Concept:** Flexible autocomplete/combobox (headless)

**Use Case:**
- Complex autocomplete requirements
- Custom styling needed
- Account search in voucher entry
- Product search (future inventory)

---

## 13. Authentication Enhancement 💡

### Current State

✅ **Already Have:** Custom JWT authentication (Good!)

### Optional Future Enhancement

**Library:** NextAuth.js

```bash
npm install next-auth
```

**Concept:** Next.js official auth solution

**Features:**
- Social login (Google, Facebook, GitHub)
- Email magic links
- Database sessions
- JWT support
- OAuth providers

**When to use:** If social login is required in future

**Note:** Current custom JWT system is fine for most use cases

---

## 14. Email 💡

### For Sending Emails

**Library:** Nodemailer

```bash
npm install nodemailer
```

**Use Case:**
- Send PO to supplier email (already planned)
- Invoice email to customers
- Password reset emails
- Notifications

**Example:**
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.sendMail({
  from: 'noreply@digiinvoice.com',
  to: supplier.email,
  subject: `Purchase Order ${po.poNumber}`,
  html: `<p>Please find attached PO...</p>`,
  attachments: [{ filename: 'PO.pdf', content: pdfBuffer }],
});
```

---

## 15. File Upload 💡

### For Future File Management

**Libraries:**

#### Client-side
```bash
npm install react-dropzone
```

**Drag & drop file uploads**

#### Server-side
```bash
npm install formidable
# or
npm install multer
```

**Handle file uploads in API routes**

---

## Implementation Priority

### Phase 1: High Priority (Immediate Impact) 🎯

1. **Flowbite React** - Consistent UI components
2. **@react-pdf/renderer** - Invoice/Report PDFs
3. **XLSX** - Excel export for reports
4. **Recharts** - Dashboard visualizations

### Phase 2: Medium Priority (Enhanced UX) 💡

5. **React Datepicker** - Better date selection
6. **React Select** - Improved dropdowns
7. **React Loading Skeleton** - Professional loading states
8. **Nodemailer** - Email functionality

### Phase 3: Optional Enhancements 💡

9. **NextAuth.js** - Social login (if needed)
10. **React Dropzone** - File uploads (for attachments)

---

## Installation Commands

### Quick Install All High Priority

```bash
npm install flowbite flowbite-react @react-pdf/renderer xlsx recharts
```

### Quick Install All Medium Priority

```bash
npm install react-datepicker react-select react-loading-skeleton nodemailer
```

---

## Integration with Existing Stack

| Category | Current | Recommended | Status |
|----------|---------|-------------|--------|
| Forms | Manual useState | React Hook Form + Zod | ✅ Done |
| API | Manual fetch | TanStack Query | ✅ Done |
| Tables | Plain HTML | TanStack Table | ✅ Done |
| State | Props drilling | Zustand | ✅ Done |
| UI Components | Custom | Flowbite React | 🎯 Next |
| PDF | None | @react-pdf/renderer | 🎯 Next |
| Excel | None | XLSX | 🎯 Next |
| Charts | None | Recharts | 🎯 Next |
| Date | date-fns | date-fns + React Datepicker | ℹ️ Partial |
| Currency | Manual | Intl API | ℹ️ Built-in |

---

## Summary

### ✅ Implemented (4/15)

1. React Hook Form + Zod
2. TanStack Query
3. TanStack Table
4. Zustand

### 🎯 High Priority (4/15)

5. Flowbite React
6. @react-pdf/renderer
7. XLSX
8. Recharts

### 💡 Optional (5/15)

9. React Datepicker
10. React Select
11. React Loading Skeleton
12. Nodemailer
13. NextAuth.js

### ℹ️ Already Available (2/15)

14. date-fns
15. Intl API (Currency formatting)

---

**Total Libraries:** 15 categories, 4 implemented, 11 remaining

**Next Steps:**
1. Install Phase 1 high priority libraries
2. Create examples for each
3. Refactor existing code to use new libraries
4. Update documentation

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-11
**Status:** Comprehensive recommendations complete
