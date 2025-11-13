/**
 * FBR Digital Invoicing API Service
 * All FBR API endpoints for reference data and lookups
 */

import { fbrApiGet, fbrApiPost } from '@/lib/fbr-api';

/**
 * Format date to DD-MMM-YYYY format (e.g., "04-Feb-2024")
 */
function formatDateDDMMMYYYY(date) {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format date to YYYY-MM-DD format
 */
function formatDateYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==================== REFERENCE DATA APIs ====================

/**
 * Get Province Codes
 * Endpoint: GET /pdi/v1/provinces
 * Returns list of all provinces with codes and descriptions
 * @param {string} environment - 'sandbox' or 'production' (defaults to production)
 */
export async function getProvinceCodes(environment = 'production') {
  return fbrApiGet('/pdi/v1/provinces', {}, environment);
}

/**
 * Get Document Type Codes
 * Endpoint: GET /pdi/v1/doctypecode
 * Returns list of all document types (Sale Invoice, Debit Note, etc.)
 */
export async function getDocumentTypes() {
  return fbrApiGet('/pdi/v1/doctypecode');
}

/**
 * Get Item Description Codes (HS Codes)
 * Endpoint: GET /pdi/v1/itemdesccode
 * Returns list of all HS codes with descriptions
 */
export async function getItemCodes() {
  return fbrApiGet('/pdi/v1/itemdesccode');
}

/**
 * Get SRO Item Codes
 * Endpoint: GET /pdi/v1/sroitemcode
 * Returns list of all SRO item IDs and descriptions
 */
export async function getSROItemCodes() {
  return fbrApiGet('/pdi/v1/sroitemcode');
}

/**
 * Get Transaction Type Codes
 * Endpoint: GET /pdi/v1/transtypecode
 * Returns list of all transaction types
 */
export async function getTransactionTypes() {
  return fbrApiGet('/pdi/v1/transtypecode');
}

/**
 * Get Unit of Measure (UOM) Codes
 * Endpoint: GET /pdi/v1/uom
 * Returns list of all UOMs (KG, Square Metre, etc.)
 */
export async function getUOMs() {
  return fbrApiGet('/pdi/v1/uom');
}

// ==================== DYNAMIC LOOKUP APIs ====================

/**
 * Get SRO Schedule
 * Endpoint: GET /pdi/v1/SroSchedule
 * @param {number} rateId - Rate ID
 * @param {Date|string} date - Date for lookup
 * @param {number} originationSupplierCsv - Province ID
 */
export async function getSROSchedule(rateId, date, originationSupplierCsv) {
  const formattedDate = formatDateDDMMMYYYY(date);
  return fbrApiGet('/pdi/v1/SroSchedule', {
    rate_id: rateId,
    date: formattedDate,
    origination_supplier_csv: originationSupplierCsv,
  });
}

/**
 * Get Sale Type To Rate
 * Endpoint: GET /pdi/v2/SaleTypeToRate
 * @param {Date|string} date - Date for lookup
 * @param {number} transTypeId - Transaction type ID
 * @param {number} originationSupplier - Province ID
 */
export async function getSaleTypeToRate(date, transTypeId, originationSupplier) {
  const formattedDate = formatDateDDMMMYYYY(date);
  return fbrApiGet('/pdi/v2/SaleTypeToRate', {
    date: formattedDate,
    transTypeId: transTypeId,
    originationSupplier: originationSupplier,
  });
}

/**
 * Get HS Code with UOM
 * Endpoint: GET /pdi/v2/HS_UOM
 * @param {string} hsCode - HS code (e.g., "5904.9000")
 * @param {number} annexureId - Sales annexure ID
 */
export async function getHSCodeUOM(hsCode, annexureId) {
  return fbrApiGet('/pdi/v2/HS_UOM', {
    hs_code: hsCode,
    annexure_id: annexureId,
  });
}

/**
 * Get SRO Item Details
 * Endpoint: GET /pdi/v2/SROItem
 * @param {Date|string} date - Date for lookup
 * @param {number} sroId - SRO ID
 */
export async function getSROItem(date, sroId) {
  const formattedDate = formatDateYYYYMMDD(date);
  return fbrApiGet('/pdi/v2/SROItem', {
    date: formattedDate,
    sro_id: sroId,
  });
}

/**
 * Get STATL (Status Check)
 * Endpoint: POST /dist/v1/statl
 * @param {string} regno - Registration number
 * @param {Date|string} date - Date for lookup
 */
export async function getSTATL(regno, date) {
  const formattedDate = formatDateYYYYMMDD(date);
  return fbrApiPost('/dist/v1/statl', {
    regno: regno,
    date: formattedDate,
  });
}

/**
 * Get Registration Type
 * Endpoint: POST /dist/v1/Get_Reg_Type
 * @param {string} registrationNo - Registration number
 */
export async function getRegistrationType(registrationNo) {
  return fbrApiPost('/dist/v1/Get_Reg_Type', {
    Registration_No: registrationNo,
  });
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Search province by code
 * @param {number} code - Province code
 */
export async function findProvinceByCode(code) {
  const provinces = await getProvinceCodes();
  return provinces.find((p) => p.stateProvinceCode === code);
}

/**
 * Search document type by ID
 * @param {number} id - Document type ID
 */
export async function findDocumentTypeById(id) {
  const docTypes = await getDocumentTypes();
  return docTypes.find((dt) => dt.docTypeId === id);
}

/**
 * Search HS code
 * @param {string} code - HS code to search
 */
export async function searchHSCode(code) {
  const items = await getItemCodes();
  return items.filter((item) => item.hS_CODE.includes(code));
}

/**
 * Search UOM by ID
 * @param {number} id - UOM ID
 */
export async function findUOMById(id) {
  const uoms = await getUOMs();
  return uoms.find((uom) => uom.uoM_ID === id);
}

/**
 * Validate registration status
 * Check both STATL and Registration Type
 * @param {string} registrationNo - Registration number
 * @param {Date|string} date - Date for validation
 */
export async function validateRegistration(registrationNo, date = new Date()) {
  try {
    const [statlResult, regTypeResult] = await Promise.all([
      getSTATL(registrationNo, date),
      getRegistrationType(registrationNo),
    ]);

    return {
      isActive: statlResult.status_code === '01',
      isRegistered: regTypeResult.statuscode === '00',
      statlStatus: statlResult.status,
      registrationType: regTypeResult.REGISTRATION_TYPE,
      registrationNo: registrationNo,
    };
  } catch (error) {
    throw new Error(`Failed to validate registration: ${error.message}`);
  }
}
