'use client';

import {
  useFBRProvinceCodes,
  useFBRDocumentTypes,
  useFBRTransactionTypes,
  useFBRUOMs,
} from '@/hooks/useFBR';

/**
 * Province Selector Component
 */
export function ProvinceSelect({ value, onChange, required = false, disabled = false }) {
  const { data: provinces, isLoading, error } = useFBRProvinceCodes();

  if (error) {
    return (
      <div className="text-sm text-red-600">
        ⚠️ Failed to load provinces. Check FBR settings.
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      required={required}
      disabled={disabled || isLoading}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
    >
      <option value="">
        {isLoading ? 'Loading provinces...' : 'Select Province'}
      </option>
      {provinces?.map((province) => (
        <option key={province.stateProvinceCode} value={province.stateProvinceCode}>
          {province.stateProvinceDesc}
        </option>
      ))}
    </select>
  );
}

/**
 * Document Type Selector Component
 */
export function DocumentTypeSelect({ value, onChange, required = false, disabled = false }) {
  const { data: docTypes, isLoading, error } = useFBRDocumentTypes();

  if (error) {
    return (
      <div className="text-sm text-red-600">
        ⚠️ Failed to load document types. Check FBR settings.
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      required={required}
      disabled={disabled || isLoading}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
    >
      <option value="">
        {isLoading ? 'Loading document types...' : 'Select Document Type'}
      </option>
      {docTypes?.map((docType) => (
        <option key={docType.docTypeId} value={docType.docTypeId}>
          {docType.docDescription}
        </option>
      ))}
    </select>
  );
}

/**
 * Transaction Type Selector Component
 */
export function TransactionTypeSelect({ value, onChange, required = false, disabled = false }) {
  const { data: transTypes, isLoading, error } = useFBRTransactionTypes();

  if (error) {
    return (
      <div className="text-sm text-red-600">
        ⚠️ Failed to load transaction types. Check FBR settings.
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      required={required}
      disabled={disabled || isLoading}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
    >
      <option value="">
        {isLoading ? 'Loading transaction types...' : 'Select Transaction Type'}
      </option>
      {transTypes?.map((transType) => (
        <option key={transType.transactioN_TYPE_ID} value={transType.transactioN_TYPE_ID}>
          {transType.transactioN_DESC}
        </option>
      ))}
    </select>
  );
}

/**
 * UOM (Unit of Measure) Selector Component
 */
export function UOMSelect({ value, onChange, required = false, disabled = false, className = '' }) {
  const { data: uoms, isLoading, error } = useFBRUOMs();

  if (error) {
    return (
      <div className="text-sm text-red-600">
        ⚠️ Failed to load UOMs
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      required={required}
      disabled={disabled || isLoading}
      className={className || 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'}
    >
      <option value="">
        {isLoading ? 'Loading...' : 'Select UOM'}
      </option>
      {uoms?.map((uom) => (
        <option key={uom.uoM_ID} value={uom.uoM_ID}>
          {uom.description}
        </option>
      ))}
    </select>
  );
}

/**
 * Display selected province name
 */
export function ProvinceDisplay({ code }) {
  const { data: provinces } = useFBRProvinceCodes();
  const province = provinces?.find((p) => p.stateProvinceCode === code);
  return <span>{province?.stateProvinceDesc || code || 'N/A'}</span>;
}

/**
 * Display selected document type name
 */
export function DocumentTypeDisplay({ id }) {
  const { data: docTypes } = useFBRDocumentTypes();
  const docType = docTypes?.find((dt) => dt.docTypeId === id);
  return <span>{docType?.docDescription || id || 'N/A'}</span>;
}

/**
 * Display selected UOM name
 */
export function UOMDisplay({ id }) {
  const { data: uoms } = useFBRUOMs();
  const uom = uoms?.find((u) => u.uoM_ID === id);
  return <span>{uom?.description || id || 'N/A'}</span>;
}
