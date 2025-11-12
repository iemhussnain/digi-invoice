/**
 * React Query Hooks for FBR Digital Invoicing APIs
 * Custom hooks for fetching and caching FBR reference data
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getProvinceCodes,
  getDocumentTypes,
  getItemCodes,
  getSROItemCodes,
  getTransactionTypes,
  getUOMs,
  getSROSchedule,
  getSaleTypeToRate,
  getHSCodeUOM,
  getSROItem,
  getSTATL,
  getRegistrationType,
  validateRegistration,
  findProvinceByCode,
  findDocumentTypeById,
  searchHSCode,
  findUOMById,
} from '@/services/fbr-service';

// ==================== REFERENCE DATA HOOKS ====================
// These fetch static reference data with longer cache times

/**
 * Hook to fetch all province codes
 * Cache time: 24 hours (reference data rarely changes)
 */
export function useFBRProvinceCodes() {
  return useQuery({
    queryKey: ['fbr', 'provinces'],
    queryFn: getProvinceCodes,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  });
}

/**
 * Hook to fetch all document types
 * Cache time: 24 hours
 */
export function useFBRDocumentTypes() {
  return useQuery({
    queryKey: ['fbr', 'documentTypes'],
    queryFn: getDocumentTypes,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch all HS/Item codes
 * Cache time: 12 hours (large dataset)
 */
export function useFBRItemCodes() {
  return useQuery({
    queryKey: ['fbr', 'itemCodes'],
    queryFn: getItemCodes,
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch all SRO item codes
 * Cache time: 12 hours
 */
export function useFBRSROItemCodes() {
  return useQuery({
    queryKey: ['fbr', 'sroItemCodes'],
    queryFn: getSROItemCodes,
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch all transaction types
 * Cache time: 24 hours
 */
export function useFBRTransactionTypes() {
  return useQuery({
    queryKey: ['fbr', 'transactionTypes'],
    queryFn: getTransactionTypes,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch all Unit of Measure (UOM) codes
 * Cache time: 24 hours
 */
export function useFBRUOMs() {
  return useQuery({
    queryKey: ['fbr', 'uoms'],
    queryFn: getUOMs,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
}

// ==================== DYNAMIC LOOKUP HOOKS ====================
// These fetch data based on parameters with shorter cache times

/**
 * Hook to fetch SRO Schedule
 * @param {number} rateId - Rate ID
 * @param {Date|string} date - Date for lookup
 * @param {number} originationSupplierCsv - Province ID
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRSROSchedule(rateId, date, originationSupplierCsv, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'sroSchedule', rateId, date, originationSupplierCsv],
    queryFn: () => getSROSchedule(rateId, date, originationSupplierCsv),
    enabled: enabled && !!rateId && !!date && !!originationSupplierCsv,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
  });
}

/**
 * Hook to fetch Sale Type To Rate
 * @param {Date|string} date - Date for lookup
 * @param {number} transTypeId - Transaction type ID
 * @param {number} originationSupplier - Province ID
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRSaleTypeToRate(date, transTypeId, originationSupplier, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'saleTypeToRate', date, transTypeId, originationSupplier],
    queryFn: () => getSaleTypeToRate(date, transTypeId, originationSupplier),
    enabled: enabled && !!date && !!transTypeId && !!originationSupplier,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
  });
}

/**
 * Hook to fetch HS Code with UOM
 * @param {string} hsCode - HS code
 * @param {number} annexureId - Sales annexure ID
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRHSCodeUOM(hsCode, annexureId, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'hsCodeUOM', hsCode, annexureId],
    queryFn: () => getHSCodeUOM(hsCode, annexureId),
    enabled: enabled && !!hsCode && !!annexureId,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    retry: 2,
  });
}

/**
 * Hook to fetch SRO Item Details
 * @param {Date|string} date - Date for lookup
 * @param {number} sroId - SRO ID
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRSROItem(date, sroId, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'sroItem', date, sroId],
    queryFn: () => getSROItem(date, sroId),
    enabled: enabled && !!date && !!sroId,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
  });
}

/**
 * Hook to check STATL status
 * @param {string} regno - Registration number
 * @param {Date|string} date - Date for lookup
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRSTATL(regno, date, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'statl', regno, date],
    queryFn: () => getSTATL(regno, date),
    enabled: enabled && !!regno && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes (status can change)
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

/**
 * Hook to get registration type
 * @param {string} registrationNo - Registration number
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRRegistrationType(registrationNo, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'registrationType', registrationNo],
    queryFn: () => getRegistrationType(registrationNo),
    enabled: enabled && !!registrationNo,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

/**
 * Hook to validate complete registration
 * Combines STATL and Registration Type checks
 * @param {string} registrationNo - Registration number
 * @param {Date|string} date - Date for validation
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRValidateRegistration(registrationNo, date, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'validateRegistration', registrationNo, date],
    queryFn: () => validateRegistration(registrationNo, date),
    enabled: enabled && !!registrationNo && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

// ==================== HELPER HOOKS ====================

/**
 * Hook to find province by code
 * @param {number} code - Province code
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRFindProvince(code, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'findProvince', code],
    queryFn: () => findProvinceByCode(code),
    enabled: enabled && !!code,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to find document type by ID
 * @param {number} id - Document type ID
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRFindDocumentType(id, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'findDocumentType', id],
    queryFn: () => findDocumentTypeById(id),
    enabled: enabled && !!id,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to search HS codes
 * @param {string} code - HS code to search
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRSearchHSCode(code, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'searchHSCode', code],
    queryFn: () => searchHSCode(code),
    enabled: enabled && !!code && code.length >= 2, // At least 2 characters
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
  });
}

/**
 * Hook to find UOM by ID
 * @param {number} id - UOM ID
 * @param {boolean} enabled - Enable/disable query
 */
export function useFBRFindUOM(id, enabled = true) {
  return useQuery({
    queryKey: ['fbr', 'findUOM', id],
    queryFn: () => findUOMById(id),
    enabled: enabled && !!id,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

// ==================== PREFETCH UTILITY ====================

/**
 * Utility function to prefetch all reference data
 * Call this on app initialization or login to cache FBR data
 * @param {QueryClient} queryClient - React Query client
 */
export async function prefetchFBRReferenceData(queryClient) {
  const prefetchPromises = [
    queryClient.prefetchQuery({
      queryKey: ['fbr', 'provinces'],
      queryFn: getProvinceCodes,
      staleTime: 24 * 60 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['fbr', 'documentTypes'],
      queryFn: getDocumentTypes,
      staleTime: 24 * 60 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['fbr', 'transactionTypes'],
      queryFn: getTransactionTypes,
      staleTime: 24 * 60 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['fbr', 'uoms'],
      queryFn: getUOMs,
      staleTime: 24 * 60 * 60 * 1000,
    }),
  ];

  try {
    await Promise.all(prefetchPromises);
    console.log('✅ FBR reference data prefetched successfully');
  } catch (error) {
    console.error('❌ Failed to prefetch FBR reference data:', error);
  }
}
