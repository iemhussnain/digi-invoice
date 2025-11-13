/**
 * FBR Data Wrapper Hook
 * Wraps React Query hooks to match Redux-like data structure
 * This provides consistency with your existing codebase pattern
 */

'use client';

import {
  useFBRProvinceCodes,
  useFBRDocumentTypes,
  useFBRTransactionTypes,
  useFBRUOMs,
  useFBRItemCodes,
} from './useFBR';

/**
 * Main hook to fetch all FBR reference data
 * Returns data in Redux-like structure
 */
export function useFBRData() {
  // Fetch all reference data using React Query hooks
  const { data: provinces, isLoading: loadingProvinces, error: provincesError } = useFBRProvinceCodes();
  const { data: docTypes, isLoading: loadingDocTypes, error: docTypesError } = useFBRDocumentTypes();
  const { data: transTypes, isLoading: loadingTransTypes, error: transTypesError } = useFBRTransactionTypes();
  const { data: uoms, isLoading: loadingUoms, error: uomsError } = useFBRUOMs();
  const { data: items, isLoading: loadingItems, error: itemsError } = useFBRItemCodes();

  // Format data to match your existing structure
  // Each item should have: { value, label, description }
  const invoiceTypes = docTypes?.map((dt) => ({
    value: dt.docTypeId,
    label: dt.docDescription,
    description: dt.docDescription,
  })) || [];

  const hsCodes = items?.map((item) => ({
    value: item.hS_CODE,
    label: item.hS_CODE,
    description: item.description,
  })) || [];

  const saleTypes = transTypes?.map((tt) => ({
    value: tt.transactioN_TYPE_ID,
    label: tt.transactioN_DESC,
    description: tt.transactioN_DESC,
  })) || [];

  const uomList = uoms?.map((uom) => ({
    value: uom.uoM_ID,
    label: uom.description,
    description: uom.description,
  })) || [];

  const provinceList = provinces?.map((province) => ({
    value: province.stateProvinceCode,
    label: province.stateProvinceDesc,
    description: province.stateProvinceDesc,
  })) || [];

  // Return in Redux-like structure with loading states
  return {
    invoiceTypes,
    hsCodes,
    saleTypes,
    uomList,
    provinceList,
    loading: {
      invoiceTypes: loadingDocTypes,
      hsCodes: loadingItems,
      saleTypes: loadingTransTypes,
      uomList: loadingUoms,
      provinces: loadingProvinces,
    },
  };
}

/**
 * Helper hook to get specific FBR data by ID
 */
export function useFBRLookup() {
  const { invoiceTypes, hsCodes, saleTypes, uomList, provinceList } = useFBRData();

  return {
    findInvoiceType: (id) => invoiceTypes.find((item) => item.value === id),
    findHSCode: (code) => hsCodes.find((item) => item.value === code),
    findSaleType: (id) => saleTypes.find((item) => item.value === id),
    findUOM: (id) => uomList.find((item) => item.value === id),
    findProvince: (code) => provinceList.find((item) => item.value === code),
  };
}

export default useFBRData;
