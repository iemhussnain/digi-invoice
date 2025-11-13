/**
 * FBR Digital Invoicing API Type Definitions
 * Using JSDoc for type safety in JavaScript
 */

/**
 * @typedef {Object} ProvinceCode
 * @property {number} stateProvinceCode - Province code
 * @property {string} stateProvinceDesc - Description of the province
 */

/**
 * @typedef {Object} DocumentType
 * @property {number} docTypeId - ID for the document type
 * @property {string} docDescription - Description of the document type
 */

/**
 * @typedef {Object} ItemCode
 * @property {string} hS_CODE - HS Code
 * @property {string} description - Description of the HS Code
 */

/**
 * @typedef {Object} SROItem
 * @property {number} srO_ITEM_ID - SRO item ID
 * @property {string} srO_ITEM_DESC - SRO Item Description
 */

/**
 * @typedef {Object} TransactionType
 * @property {number} transactioN_TYPE_ID - Transaction type ID
 * @property {string} transactioN_DESC - Description of the transaction type
 */

/**
 * @typedef {Object} UnitOfMeasure
 * @property {number} uoM_ID - ID of the UOM
 * @property {string} description - Description of the UOM
 */

/**
 * @typedef {Object} SROSchedule
 * @property {number} srO_ID - ID of the SRO
 * @property {string} srO_DESC - Description of the SRO
 */

/**
 * @typedef {Object} SaleTypeRate
 * @property {number} ratE_ID - ID of the rate
 * @property {string} ratE_DESC - Description of the rate
 * @property {number} ratE_VALUE - Value of the rate
 */

/**
 * @typedef {Object} HSCodeUOM
 * @property {number} uoM_ID - ID of the unit of measure
 * @property {string} description - Description of the unit of measure
 */

/**
 * @typedef {Object} SROItemDetail
 * @property {number} srO_ITEM_ID - Item ID
 * @property {string} srO_ITEM_DESC - Description of the Item
 */

/**
 * @typedef {Object} STATLResponse
 * @property {string} status_code - Status code (01 or 02)
 * @property {string} status - Status (Active or In-Active)
 */

/**
 * @typedef {Object} RegistrationTypeResponse
 * @property {string} statuscode - Status code (00 or 01)
 * @property {string} REGISTRATION_NO - Registration number
 * @property {string} REGISTRATION_TYPE - Registration type (Registered or unregistered)
 */

/**
 * @typedef {Object} SROScheduleParams
 * @property {number} rate_id - Rate ID
 * @property {string} date - Date in format DD-MMM-YYYY (e.g., "04-Feb-2024")
 * @property {number} origination_supplier_csv - Province ID
 */

/**
 * @typedef {Object} SaleTypeToRateParams
 * @property {string} date - Date in format DD-MMM-YYYY (e.g., "24-Feb-2024")
 * @property {number} transTypeId - ID of the transaction type
 * @property {number} originationSupplier - Province ID
 */

/**
 * @typedef {Object} HSCodeUOMParams
 * @property {string} hs_code - HS code (e.g., "5904.9000")
 * @property {number} annexure_id - Sales annexure ID
 */

/**
 * @typedef {Object} SROItemParams
 * @property {string} date - Date in format YYYY-MM-DD (e.g., "2025-03-25")
 * @property {number} sro_id - SRO ID
 */

/**
 * @typedef {Object} STATLRequest
 * @property {string} regno - Registration number
 * @property {string} date - Date in format YYYY-MM-DD (e.g., "2025-05-18")
 */

/**
 * @typedef {Object} RegistrationTypeRequest
 * @property {string} Registration_No - Registration number
 */

/**
 * @typedef {Object} FBRErrorResponse
 * @property {number} status - HTTP status code
 * @property {string} message - Error message
 */

// Export for JSDoc usage
export {};
