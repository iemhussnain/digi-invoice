# FBR Integration - Complete Project Structure

## 📁 Project Directory Structure

```
digi-invoice/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── fbr/
│   │   │       ├── configuration/
│   │   │       │   └── page.jsx                 # FBR Configuration Page
│   │   │       ├── invoices/
│   │   │       │   ├── page.jsx                 # Invoice List Page
│   │   │       │   ├── create/
│   │   │       │   │   └── page.jsx             # Create Invoice Page
│   │   │       │   └── [id]/
│   │   │       │       └── page.jsx             # Invoice Detail Page
│   │   │       └── dashboard/
│   │   │           └── page.jsx                 # FBR Dashboard
│   │   │
│   │   └── api/
│   │       └── fbr/
│   │           ├── configuration/
│   │           │   └── route.js                 # GET, POST /api/fbr/configuration
│   │           ├── invoices/
│   │           │   ├── route.js                 # GET, POST /api/fbr/invoices
│   │           │   ├── [id]/
│   │           │   │   └── route.js             # GET, PUT, DELETE /api/fbr/invoices/:id
│   │           │   ├── validate/
│   │           │   │   └── route.js             # POST /api/fbr/invoices/validate
│   │           │   └── submit/
│   │           │       └── route.js             # POST /api/fbr/invoices/submit
│   │           ├── reference/
│   │           │   ├── provinces/
│   │           │   │   └── route.js             # GET /api/fbr/reference/provinces
│   │           │   ├── hs-codes/
│   │           │   │   └── route.js             # GET /api/fbr/reference/hs-codes
│   │           │   ├── uoms/
│   │           │   │   └── route.js             # GET /api/fbr/reference/uoms
│   │           │   ├── scenarios/
│   │           │   │   └── route.js             # GET /api/fbr/reference/scenarios
│   │           │   └── sync/
│   │           │       └── route.js             # POST /api/fbr/reference/sync
│   │           └── verify/
│   │               └── buyer/
│   │                   └── route.js             # POST /api/fbr/verify/buyer
│   │
│   ├── components/
│   │   └── fbr/
│   │       ├── FBRConfigurationForm.jsx         # Configuration form component
│   │       ├── InvoiceCreationForm.jsx          # Invoice creation form
│   │       ├── InvoiceItemFields.jsx            # Invoice item form fields
│   │       ├── InvoiceList.jsx                  # Invoice list table
│   │       ├── InvoiceDetail.jsx                # Invoice detail view
│   │       ├── ValidationResults.jsx            # Validation results display
│   │       ├── QRCodeDisplay.jsx                # QR code viewer
│   │       ├── InvoicePDF.jsx                   # PDF document component
│   │       └── BuyerSelector.jsx                # Buyer search/select component
│   │
│   ├── hooks/
│   │   ├── useFBRConfiguration.js               # Configuration queries/mutations
│   │   ├── useFBRInvoices.js                    # Invoice queries/mutations
│   │   ├── useFBRReferenceData.js              # Reference data queries
│   │   └── useFBRValidation.js                  # Validation utilities
│   │
│   ├── lib/
│   │   ├── fbr/
│   │   │   ├── api-client.js                    # FBR API client
│   │   │   ├── invoice-service.js               # Invoice validation/submission
│   │   │   ├── reference-service.js             # Reference data sync
│   │   │   └── qr-service.js                    # QR code generation
│   │   ├── encryption.js                        # Token encryption utilities
│   │   └── dbConnect.js                         # MongoDB connection (existing)
│   │
│   ├── models/
│   │   ├── FBRConfiguration.js                  # FBR configuration schema
│   │   ├── FBRInvoice.js                        # FBR invoice schema
│   │   └── FBRReferenceData.js                  # Reference data schemas
│   │
│   ├── schemas/
│   │   └── fbrSchemas.js                        # Zod validation schemas
│   │
│   ├── stores/
│   │   └── fbrStore.js                          # Zustand state management
│   │
│   └── utils/
│       └── fbr/
│           ├── tax-calculator.js                # Tax calculation utilities
│           ├── scenario-mapper.js               # Scenario determination
│           ├── error-mapper.js                  # Error code mapping
│           └── format-helpers.js                # Data formatting helpers
│
├── public/
│   └── fbr/
│       └── logo.png                             # FBR logo for invoices
│
├── .env.local                                   # Environment variables
├── FBR_INTEGRATION_GUIDE.md                    # Main documentation (Part 1)
├── FBR_INTEGRATION_GUIDE_PART2.md              # Main documentation (Part 2)
├── FBR_QUICK_START.md                          # Quick start guide
└── FBR_PROJECT_STRUCTURE.md                    # This file
```

---

## 🗂️ File Purpose Summary

### **Models Layer**
| File | Purpose | Key Features |
|------|---------|--------------|
| `FBRConfiguration.js` | User FBR settings | Seller info, tokens, business activity |
| `FBRInvoice.js` | Invoice data & status | Header, items, FBR response, QR code |
| `FBRReferenceData.js` | Master data cache | Provinces, HS codes, UOMs, scenarios |

### **API Routes Layer**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fbr/configuration` | GET, POST | Get/save FBR config |
| `/api/fbr/invoices` | GET, POST | List/create invoices |
| `/api/fbr/invoices/validate` | POST | Validate with FBR |
| `/api/fbr/invoices/submit` | POST | Submit to FBR |
| `/api/fbr/reference/*` | GET | Fetch reference data |

### **Service Layer**
| File | Purpose | Dependencies |
|------|---------|--------------|
| `api-client.js` | HTTP client for FBR | axios, retry logic |
| `invoice-service.js` | Validate & submit | API client, QR generator |
| `reference-service.js` | Sync master data | API client, database |
| `qr-service.js` | Generate QR codes | qrcode library |

### **Hooks Layer (React Query)**
| Hook | Purpose | Mutations |
|------|---------|-----------|
| `useFBRConfiguration` | Config CRUD | Save config |
| `useFBRInvoices` | Invoice CRUD | Create, validate, submit |
| `useFBRReferenceData` | Fetch master data | None (read-only) |

### **Component Layer**
| Component | Purpose | Form Library |
|-----------|---------|--------------|
| `FBRConfigurationForm` | Setup wizard | React Hook Form + Zod |
| `InvoiceCreationForm` | Invoice entry | React Hook Form + Zod |
| `InvoiceList` | Browse invoices | Flowbite Table |
| `InvoicePDF` | Printable invoice | @react-pdf/renderer |

---

## 🔄 Data Flow Diagram

```
┌─────────────┐
│   User UI   │ (Flowbite Components)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ React Hook  │ (Form Validation: Zod)
│    Form     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│React Query  │ (Mutations & Queries)
│   Hooks     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Routes  │ (Next.js App Router)
│ /api/fbr/*  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │ (Business Logic)
│  Layer      │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────┐
│  MongoDB    │    │FBR API   │
│  (Mongoose) │    │ Client   │
└─────────────┘    └──────────┘
       │                  │
       │                  ▼
       │           ┌─────────────┐
       │           │FBR Gateway  │
       │           │(Sandbox/Prod)│
       │           └─────────────┘
       │
       ▼
┌─────────────┐
│  Zustand    │ (Client State)
│   Store     │
└─────────────┘
```

---

## 🎯 Implementation Workflow

### **Phase 1: Foundation** ✅
```
Database Models → API Routes → Service Layer
```
**Output:** Working backend API

### **Phase 2: Integration** ✅
```
FBR API Client → Invoice Service → QR Generator
```
**Output:** Can communicate with FBR

### **Phase 3: State Management** ✅
```
React Query Hooks → Zustand Store
```
**Output:** Data fetching & caching working

### **Phase 4: Forms** ✅
```
Zod Schemas → React Hook Form → Flowbite Components
```
**Output:** Validated forms

### **Phase 5: UI** ✅
```
Configuration Page → Invoice Creation → Invoice List
```
**Output:** Complete user interface

### **Phase 6: PDF** ✅
```
PDF Template → QR Code Integration → Download
```
**Output:** Printable invoices

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────┐
│         User Credentials                │
│  (Stored in database, encrypted)        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     FBR Tokens (Encrypted at Rest)      │
│  • Sandbox Token: AES-256-GCM           │
│  • Production Token: AES-256-GCM        │
│  • Never exposed to frontend            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    API Routes (Server-Side Only)        │
│  • Decrypt tokens on demand             │
│  • Add Bearer token to requests         │
│  • HTTPS communication to FBR           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         FBR API Gateway                 │
│  • Validates Bearer token               │
│  • Processes request                    │
│  • Returns response                     │
└─────────────────────────────────────────┘
```

---

## 📊 Database Schema Relationships

```
┌──────────────────┐
│      User        │
│   (Existing)     │
└────────┬─────────┘
         │
         │ 1:1
         │
         ▼
┌──────────────────┐
│FBRConfiguration  │
│ • sellerInfo     │
│ • tokens         │
│ • settings       │
└─────────┬────────┘
          │
          │ 1:N
          │
          ▼
┌──────────────────┐
│   FBRInvoice     │
│ • header         │
│ • buyer          │
│ • status         │
│ • FBR response   │
└─────────┬────────┘
          │
          │ 1:N
          │
          ▼
┌──────────────────┐
│ FBRInvoiceItem   │
│ • product        │
│ • quantity       │
│ • tax details    │
└──────────────────┘

┌──────────────────┐
│ FBRReferenceData │ (Shared across all users)
│ • Provinces      │
│ • HS Codes       │
│ • UOMs           │
│ • Scenarios      │
└──────────────────┘
```

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Database** | MongoDB + Mongoose | NoSQL document storage |
| **State (Server)** | TanStack React Query | Server state, caching |
| **State (Client)** | Zustand | Simple client state |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **UI Library** | Flowbite React | Pre-built components |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **HTTP Client** | Axios | API requests with retry |
| **QR Codes** | qrcode | QR generation |
| **PDF** | @react-pdf/renderer | PDF documents |
| **Notifications** | react-hot-toast | Toast messages |
| **Dates** | date-fns | Date manipulation |

---

## 📝 Environment Variables Reference

```env
# Required
MONGODB_URI=mongodb://localhost:27017/digi-invoice
ENCRYPTION_KEY=<32-character-hex-string>
JWT_SECRET=<your-secret>

# Optional
NEXT_PUBLIC_FBR_SANDBOX_URL=https://gw.fbr.gov.pk
NEXT_PUBLIC_FBR_PRODUCTION_URL=https://gw.fbr.gov.pk
```

---

## 🚦 Testing Checklist

### **Unit Tests**
- [ ] Tax calculation functions
- [ ] Encryption/decryption
- [ ] Data transformation utilities
- [ ] Zod schema validation

### **Integration Tests**
- [ ] API routes respond correctly
- [ ] Database operations work
- [ ] FBR API client handles errors
- [ ] QR code generation

### **E2E Tests**
- [ ] Configuration save/load
- [ ] Invoice creation flow
- [ ] Validation workflow
- [ ] Submission workflow
- [ ] PDF generation

### **Manual Testing**
- [ ] All 28 scenarios in sandbox
- [ ] Error handling
- [ ] Responsive design
- [ ] Print functionality

---

## 🎓 Learning Path

**For New Developers:**

1. **Day 1-2:** Understand MongoDB models and Mongoose
2. **Day 3-4:** Learn Next.js App Router API routes
3. **Day 5-6:** Master React Query for data fetching
4. **Day 7-8:** Practice React Hook Form + Zod
5. **Day 9-10:** Build UI with Flowbite components
6. **Day 11-12:** Integrate FBR API and test

**Key Concepts to Master:**
- Server vs Client Components in Next.js
- React Query mutations and queries
- Zod schema composition
- Mongoose middleware and virtuals
- JWT token verification
- AES encryption

---

## 📚 Documentation Index

1. **Quick Start:** `FBR_QUICK_START.md` - Get running in 30 minutes
2. **Full Guide Part 1:** `FBR_INTEGRATION_GUIDE.md` - Models, APIs, Services
3. **Full Guide Part 2:** `FBR_INTEGRATION_GUIDE_PART2.md` - Forms, UI, PDF
4. **Structure:** `FBR_PROJECT_STRUCTURE.md` - This file
5. **FBR Spec:** Official FBR documentation (provided separately)

---

## 🆘 Getting Help

**Common Issues:**
1. Check `FBR_QUICK_START.md` troubleshooting section
2. Review error codes in FBR documentation
3. Verify environment variables are set
4. Check MongoDB connection
5. Inspect browser console and server logs

**Resources:**
- Next.js Docs: https://nextjs.org/docs
- React Query: https://tanstack.com/query
- Flowbite: https://flowbite-react.com
- FBR Technical Spec: (provided document)

---

**Created:** 2025-11-12
**Version:** 1.0
**Maintained by:** Development Team
