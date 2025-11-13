# FBR Integration - Next Implementation Steps

## Current Status
✅ Backend APIs integrated (12 FBR endpoints)
✅ React Query hooks created
✅ Basic components created
❌ Redux integration needed (currently using React Query)
❌ Form structure needs to match existing pattern

## Required Changes to Match Existing Structure

### 1. **Redux Setup for FBR** (instead of React Query)

You need to create Redux actions and reducers similar to your existing pattern:

```javascript
// Required files to create:
src/redux/actions/fbrActions.js
src/redux/reducers/fbrReducer.js
```

**Actions needed:**
- `fetchInvoiceTypes()`
- `fetchHSCodes()`
- `fetchSaleTypes()`
- `fetchUomList()`
- `fetchProvinces()`
- `fetchDocumentTypes()`
- `fetchTransactionTypes()`

### 2. **Convert React Query Hooks to Redux**

Current: `useFBRProvinceCodes()` (React Query)
Needed: `dispatch(fetchProvinces())` (Redux)

### 3. **Form Structure**

Your existing form has this structure:
```
Section 1: Seller Information (Read-only from userFBRInfo)
Section 2: Buyer Information (Autocomplete + Auto-fill)
Section 3: Invoice Details (Type, Date, Local Invoice #)
Section 4: Product Details (Stock search, HS Code, Sale Type, UOM, Rate, Quantity)
Section 5: Financial Details (All calculations)
```

### 4. **API Integration Pattern**

Your current pattern:
```javascript
// 1. Buyer NTN → Get Registration Type
useEffect(() => {
  if (watchBuyerNTNCNIC && watchBuyerNTNCNIC.length >= 7) {
    getBuyerRegistrationType(watchBuyerNTNCNIC)
      .then(data => setValue("buyerRegistrationType", data.REGISTRATION_TYPE))
  }
}, [watchBuyerNTNCNIC]);

// 2. Date + SaleType + Province → Get Rates
useEffect(() => {
  if (watchInvoiceDate && watchSaleType && userFBRInfo?.provinceNumber) {
    getRate(formattedDate, saleTypeId, userFBRInfo.provinceNumber)
      .then(data => setRateOptions(data))
  }
}, [watchInvoiceDate, watchSaleType]);

// 3. RateId + Date + Province → Get SRO Schedule
useEffect(() => {
  if (selectedRateId && watchInvoiceDate && userFBRInfo?.provinceNumber) {
    getSROSchedule(selectedRateId, formattedDate, userFBRInfo.provinceNumber)
      .then(data => setValue("sroScheduleNo", data[0].srO_DESC))
  }
}, [selectedRateId, watchInvoiceDate]);

// 4. SroId + Date → Get SRO Item
useEffect(() => {
  if (selectedSroId && watchInvoiceDate) {
    getSROItem(watchInvoiceDate, selectedSroId)
      .then(data => setValue("sroItemSerialNo", data[0].srO_ITEM_DESC))
  }
}, [selectedSroId, watchInvoiceDate]);
```

### 5. **Auto-calculations**

```javascript
// Sales Tax Applicable = (ValueSalesExcludingST * Rate) / 100
// Total Values = ValueSalesExcludingST + SalesTaxApplicable
```

## Implementation Options

### Option 1: Keep React Query (Simpler)
- ✅ Already implemented
- ✅ Better caching
- ✅ Automatic refetching
- ❌ Different from your existing pattern

### Option 2: Migrate to Redux (Consistent)
- ✅ Matches your existing codebase
- ✅ Centralized state management
- ❌ Need to create actions/reducers
- ❌ More boilerplate code

## Recommended Approach

**Keep React Query for FBR APIs** but create a **wrapper layer** that makes it feel like Redux:

```javascript
// src/hooks/useFBRData.js
export function useFBRData() {
  const { data: invoiceTypes, isLoading: loadingInvoiceTypes } = useFBRDocumentTypes();
  const { data: hsCodes, isLoading: loadingHSCodes } = useFBRItemCodes();
  const { data: saleTypes, isLoading: loadingSaleTypes } = useFBRTransactionTypes();
  const { data: uomList, isLoading: loadingUomList } = useFBRUOMs();

  return {
    invoiceTypes: invoiceTypes?.map(dt => ({
      value: dt.docTypeId,
      label: dt.docDescription,
      description: dt.docDescription,
    })) || [],
    hsCodes: hsCodes?.map(item => ({
      value: item.hS_CODE,
      label: item.hS_CODE,
      description: item.description,
    })) || [],
    saleTypes: saleTypes?.map(tt => ({
      value: tt.transactioN_TYPE_ID,
      label: tt.transactioN_DESC,
      description: tt.transactioN_DESC,
    })) || [],
    uomList: uomList?.map(uom => ({
      value: uom.uoM_ID,
      label: uom.description,
      description: uom.description,
    })) || [],
    loading: {
      invoiceTypes: loadingInvoiceTypes,
      hsCodes: loadingHSCodes,
      saleTypes: loadingSaleTypes,
      uomList: loadingUomList,
    }
  };
}
```

## What to Do Next

1. **Use existing FBR components and hooks** I created
2. **Create wrapper hook** `useFBRData()` to match your data structure
3. **Copy your form structure** and replace data sources with FBR hooks
4. **Keep your validation schema** (yup)
5. **Keep your Autocomplete component**
6. **Use FBR API service functions** I created for dynamic calls

## Files You Can Reuse

✅ `src/services/fbr-service.js` - All API functions
✅ `src/hooks/useFBR.js` - React Query hooks
✅ `src/lib/fbr-api.js` - API client
✅ `src/components/fbr/*` - FBR components

## Files You Need to Create

1. `src/hooks/useFBRData.js` - Wrapper hook
2. `src/app/admin/invoices/fbr-new/page.js` - New form using your structure
3. `src/validations/fbrInvoice.js` - Yup schema for FBR invoice

## Quick Start

Want me to create the form **exactly like your structure** using the FBR APIs I already integrated?

I can:
1. Create wrapper hook for data compatibility
2. Build form matching your exact structure
3. Wire up all the useEffect dependencies
4. Add all auto-calculations
5. Keep your existing Autocomplete and NumberInput components

**Should I proceed with this approach?**
