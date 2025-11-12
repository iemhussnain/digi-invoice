# FBR Integration - Quick Start Guide

## 🚀 Quick Start

This guide will help you get started with FBR Digital Invoicing integration in your Next.js application.

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ MongoDB running locally or cloud instance
- ✅ Existing digi-invoice project setup
- ✅ FBR Sandbox Token (get from FBR)

---

## Step 1: Install Dependencies

```bash
npm install axios qrcode
npm install -D @types/qrcode
```

---

## Step 2: Update Environment Variables

Add to `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/digi-invoice

# Encryption Key (Generate a secure 32-character key)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# JWT Secret
JWT_SECRET=your-jwt-secret-here

# FBR API URLs
NEXT_PUBLIC_FBR_SANDBOX_URL=https://gw.fbr.gov.pk
NEXT_PUBLIC_FBR_PRODUCTION_URL=https://gw.fbr.gov.pk
```

**Generate Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Create Folder Structure

```bash
# Create folders
mkdir -p src/models
mkdir -p src/lib/fbr
mkdir -p src/app/api/fbr/{configuration,invoices,reference}
mkdir -p src/components/fbr
mkdir -p src/hooks
mkdir -p src/schemas
mkdir -p src/stores
```

---

## Step 4: Create Database Models

### 4.1 FBR Configuration Model

Create `src/models/FBRConfiguration.js`:

```javascript
import mongoose from 'mongoose';

const fbrConfigurationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  sellerNTNCNIC: { type: String, required: true, minlength: 7, maxlength: 13 },
  sellerBusinessName: { type: String, required: true },
  sellerProvinceCode: { type: String, required: true },
  sellerProvinceName: { type: String, required: true },
  sellerAddress: { type: String, required: true },
  businessActivity: {
    type: String,
    required: true,
    enum: ['Manufacturer', 'Importer', 'Distributor', 'Wholesaler',
           'Retailer', 'Exporter', 'Service Provider', 'Other']
  },
  sector: {
    type: String,
    required: true,
    enum: ['Steel', 'FMCG', 'Textile', 'Telecom', 'Petroleum',
           'Electricity', 'Gas', 'Services', 'Automobile', 'CNG',
           'Pharmaceuticals', 'Retail', 'Other']
  },
  sandboxToken: { type: String, select: false },
  productionToken: { type: String, select: false },
  environmentMode: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
  defaultTaxRate: { type: Number, default: 18.00 },
  autoValidate: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.FBRConfiguration ||
  mongoose.model('FBRConfiguration', fbrConfigurationSchema);
```

### 4.2 FBR Invoice Model

Create `src/models/FBRInvoice.js`:

```javascript
import mongoose from 'mongoose';

const fbrInvoiceItemSchema = new mongoose.Schema({
  itemSerialNumber: { type: Number, required: true },
  hsCode: { type: String, required: true },
  productDescription: { type: String, required: true },
  quantity: Number,
  uom: { type: String, required: true },
  valueSalesExcludingST: { type: Number, default: 0 },
  salesTaxApplicable: { type: Number, required: true },
  rate: { type: String, required: true },
  saleType: { type: String, required: true }
  // ... add other fields as needed
});

const fbrInvoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fbrInvoiceNumber: { type: String, unique: true, sparse: true },
  invoiceType: { type: String, required: true, enum: ['Sale Invoice', 'Debit Note'] },
  invoiceDate: { type: Date, required: true },
  sellerNTNCNIC: { type: String, required: true },
  sellerBusinessName: { type: String, required: true },
  buyerNTNCNIC: String,
  buyerBusinessName: { type: String, required: true },
  buyerRegistrationType: { type: String, required: true, enum: ['Registered', 'Unregistered'] },
  submissionStatus: {
    type: String,
    enum: ['draft', 'validated', 'submitted', 'registered', 'failed'],
    default: 'draft'
  },
  items: [fbrInvoiceItemSchema],
  qrCodeData: String,
  environment: { type: String, enum: ['sandbox', 'production'] }
}, { timestamps: true });

export default mongoose.models.FBRInvoice ||
  mongoose.model('FBRInvoice', fbrInvoiceSchema);
```

---

## Step 5: Create Encryption Utility

Create `src/lib/encryption.js`:

```javascript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY;
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export function encryptToken(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## Step 6: Create FBR API Client

Create `src/lib/fbr/api-client.js`:

```javascript
import axios from 'axios';

const FBR_BASE_URLS = {
  sandbox: { dataAcquisition: 'https://gw.fbr.gov.pk/di_data/v1/di' },
  production: { dataAcquisition: 'https://gw.fbr.gov.pk/di_data/v1/di' }
};

class FBRApiClient {
  constructor(environment, token) {
    this.environment = environment;
    this.client = axios.create({
      baseURL: FBR_BASE_URLS[environment].dataAcquisition,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async validateInvoice(payload) {
    const endpoint = this.environment === 'sandbox'
      ? '/validateinvoicedata_sb'
      : '/validateinvoicedata';
    const { data } = await this.client.post(endpoint, payload);
    return data;
  }

  async submitInvoice(payload) {
    const endpoint = this.environment === 'sandbox'
      ? '/postinvoicedata_sb'
      : '/postinvoicedata';
    const { data } = await this.client.post(endpoint, payload);
    return data;
  }
}

export default FBRApiClient;
```

---

## Step 7: Create API Routes

### 7.1 Configuration Route

Create `src/app/api/fbr/configuration/route.js`:

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FBRConfiguration from '@/models/FBRConfiguration';
import { verifyToken } from '@/lib/auth';
import { encryptToken } from '@/lib/encryption';

export async function GET(request) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const config = await FBRConfiguration.findOne({ userId: user.id });

  if (!config) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: config });
}

export async function POST(request) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  await dbConnect();

  const updateData = { userId: user.id, ...body };
  if (body.sandboxToken) updateData.sandboxToken = encryptToken(body.sandboxToken);
  if (body.productionToken) updateData.productionToken = encryptToken(body.productionToken);

  const config = await FBRConfiguration.findOneAndUpdate(
    { userId: user.id },
    updateData,
    { new: true, upsert: true, runValidators: true }
  );

  return NextResponse.json({ success: true, data: config });
}
```

---

## Step 8: Create React Query Hooks

Create `src/hooks/useFBRConfiguration.js`:

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

export function useFBRConfiguration() {
  return useQuery({
    queryKey: ['fbr-configuration'],
    queryFn: async () => {
      const { data } = await axios.get('/api/fbr/configuration');
      return data.data;
    }
  });
}

export function useSaveFBRConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configData) => {
      const { data } = await axios.post('/api/fbr/configuration', configData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fbr-configuration'] });
      toast.success('Configuration saved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save');
    }
  });
}
```

---

## Step 9: Create Configuration Form

Create `src/components/fbr/FBRConfigurationForm.jsx`:

```jsx
'use client';

import { useForm } from 'react-hook-form';
import { useFBRConfiguration, useSaveFBRConfiguration } from '@/hooks/useFBRConfiguration';
import { Label, TextInput, Select, Button } from 'flowbite-react';
import { useEffect } from 'react';

export default function FBRConfigurationForm() {
  const { data: config } = useFBRConfiguration();
  const saveMutation = useSaveFBRConfiguration();

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Seller NTN/CNIC *</Label>
          <TextInput {...register('sellerNTNCNIC', { required: true })} />
          {errors.sellerNTNCNIC && <span className="text-red-500 text-sm">Required</span>}
        </div>

        <div>
          <Label>Business Name *</Label>
          <TextInput {...register('sellerBusinessName', { required: true })} />
        </div>

        <div>
          <Label>Business Activity *</Label>
          <Select {...register('businessActivity', { required: true })}>
            <option value="">Select</option>
            <option value="Manufacturer">Manufacturer</option>
            <option value="Retailer">Retailer</option>
            {/* Add more options */}
          </Select>
        </div>

        <div>
          <Label>Sandbox Token</Label>
          <TextInput type="password" {...register('sandboxToken')} />
        </div>
      </div>

      <Button type="submit" disabled={saveMutation.isLoading}>
        {saveMutation.isLoading ? 'Saving...' : 'Save Configuration'}
      </Button>
    </form>
  );
}
```

---

## Step 10: Create Configuration Page

Create `src/app/admin/fbr/configuration/page.jsx`:

```jsx
import FBRConfigurationForm from '@/components/fbr/FBRConfigurationForm';

export default function FBRConfigurationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FBR Configuration</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <FBRConfigurationForm />
      </div>
    </div>
  );
}
```

---

## Step 11: Add Navigation Link

Add to your admin navigation (e.g., `src/components/Sidebar.jsx`):

```jsx
import { HiDocumentText } from 'react-icons/hi';

// In your navigation items array:
{
  name: 'FBR Integration',
  icon: HiDocumentText,
  children: [
    { name: 'Configuration', href: '/admin/fbr/configuration' },
    { name: 'Invoices', href: '/admin/fbr/invoices' },
    { name: 'Create Invoice', href: '/admin/fbr/invoices/create' }
  ]
}
```

---

## Step 12: Test Your Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000/admin/fbr/configuration`

3. **Fill in the form:**
   - Enter your seller NTN/CNIC
   - Enter business name
   - Select business activity and sector
   - Paste your FBR sandbox token
   - Click Save

4. **Verify in MongoDB:**
   ```bash
   mongosh digi-invoice
   db.fbrconfigurations.find().pretty()
   ```

---

## Common Issues & Solutions

### Issue: "ENCRYPTION_KEY is not defined"
**Solution:** Make sure `.env.local` has `ENCRYPTION_KEY` set
```bash
# Generate a new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: "Cannot connect to MongoDB"
**Solution:** Check MongoDB is running
```bash
# For local MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### Issue: "FBR API returns 401 Unauthorized"
**Solution:**
- Verify your sandbox token is correct
- Check token is properly encrypted and stored
- Ensure Authorization header is being sent

---

## Next Steps

Once configuration is working:

1. ✅ Build invoice creation form
2. ✅ Implement invoice validation
3. ✅ Add invoice submission
4. ✅ Generate QR codes
5. ✅ Create PDF invoices
6. ✅ Test all 28 scenarios

---

## Development Checklist

- [ ] Environment variables configured
- [ ] Database models created
- [ ] Encryption utility working
- [ ] FBR API client implemented
- [ ] Configuration API route working
- [ ] Configuration form functional
- [ ] Can save and retrieve configuration
- [ ] Tokens are encrypted in database
- [ ] Navigation link added
- [ ] Tested end-to-end

---

## Resources

- **FBR Documentation:** Technical Specification for DI API v1.12
- **Full Guide:** See `FBR_INTEGRATION_GUIDE.md` and `FBR_INTEGRATION_GUIDE_PART2.md`
- **Support:** Check error logs in browser console and server terminal

---

**Ready to proceed?** Follow the full implementation guide for complete features!
