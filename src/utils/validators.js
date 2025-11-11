/**
 * Validation Utilities
 * Email, password, and other input validations
 */

/**
 * Validate Email Format
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  // Remove whitespace
  email = email.trim();

  // Check length
  if (email.length < 5) {
    return { isValid: false, message: 'Email is too short' };
  }

  if (email.length > 100) {
    return { isValid: false, message: 'Email is too long (max 100 characters)' };
  }

  // Regex pattern for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format' };
  }

  // Additional validation - must have valid TLD
  const tldRegex = /\.[a-z]{2,}$/i;
  if (!tldRegex.test(email)) {
    return { isValid: false, message: 'Email must have a valid domain (e.g., .com, .pk)' };
  }

  return { isValid: true, message: 'Email is valid' };
}

/**
 * Validate Password Strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, message: string, strength: string }
 */
export function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required',
      strength: 'none'
    };
  }

  // Check minimum length
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
      strength: 'weak'
    };
  }

  // Check maximum length
  if (password.length > 100) {
    return {
      isValid: false,
      message: 'Password is too long (max 100 characters)',
      strength: 'weak'
    };
  }

  // Password strength criteria
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Calculate strength
  let strength = 0;
  let missingCriteria = [];

  if (hasUpperCase) strength++;
  else missingCriteria.push('uppercase letter');

  if (hasLowerCase) strength++;
  else missingCriteria.push('lowercase letter');

  if (hasNumber) strength++;
  else missingCriteria.push('number');

  if (hasSpecialChar) strength++;
  else missingCriteria.push('special character');

  // Require at least 3 out of 4 criteria
  if (strength < 3) {
    return {
      isValid: false,
      message: `Password must contain at least 3 of: uppercase, lowercase, number, special character. Missing: ${missingCriteria.join(', ')}`,
      strength: strength === 1 ? 'weak' : 'medium',
    };
  }

  // Determine strength level
  let strengthLevel;
  if (strength === 4 && password.length >= 12) {
    strengthLevel = 'very strong';
  } else if (strength === 4) {
    strengthLevel = 'strong';
  } else {
    strengthLevel = 'medium';
  }

  return {
    isValid: true,
    message: 'Password is valid',
    strength: strengthLevel,
  };
}

/**
 * Validate Name
 * @param {string} name - Name to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validateName(name) {
  if (!name) {
    return { isValid: false, message: 'Name is required' };
  }

  name = name.trim();

  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { isValid: false, message: 'Name is too long (max 100 characters)' };
  }

  // Check for invalid characters (only letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, message: 'Name is valid' };
}

/**
 * Validate Phone Number (Pakistan format)
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validatePhone(phone) {
  if (!phone) {
    return { isValid: true, message: 'Phone is optional' }; // Optional field
  }

  phone = phone.trim();

  // Pakistan phone number formats:
  // +92-3XX-XXXXXXX
  // 03XX-XXXXXXX
  // 03XXXXXXXXX
  const phoneRegex = /^(\+92|0)?3[0-9]{2}-?[0-9]{7}$/;

  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      message: 'Invalid phone number. Format: 03XX-XXXXXXX or +92-3XX-XXXXXXX'
    };
  }

  return { isValid: true, message: 'Phone is valid' };
}

/**
 * Validate Company/Organization Name
 * @param {string} companyName - Company name to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validateCompanyName(companyName) {
  if (!companyName) {
    return { isValid: false, message: 'Company name is required' };
  }

  companyName = companyName.trim();

  if (companyName.length < 2) {
    return { isValid: false, message: 'Company name must be at least 2 characters' };
  }

  if (companyName.length > 200) {
    return { isValid: false, message: 'Company name is too long (max 200 characters)' };
  }

  return { isValid: true, message: 'Company name is valid' };
}

/**
 * Validate NTN (National Tax Number) - Pakistan
 * @param {string} ntn - NTN to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validateNTN(ntn) {
  if (!ntn) {
    return { isValid: true, message: 'NTN is optional' }; // Optional field
  }

  ntn = ntn.trim();

  // NTN format: 7 digits followed by hyphen and 1 digit (e.g., 1234567-8)
  const ntnRegex = /^[0-9]{7}-[0-9]$/;

  if (!ntnRegex.test(ntn)) {
    return {
      isValid: false,
      message: 'Invalid NTN format. Format: 1234567-8'
    };
  }

  return { isValid: true, message: 'NTN is valid' };
}

/**
 * Validate STRN (Sales Tax Registration Number) - Pakistan
 * @param {string} strn - STRN to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validateSTRN(strn) {
  if (!strn) {
    return { isValid: true, message: 'STRN is optional' }; // Optional field
  }

  strn = strn.trim();

  // STRN format: XX-XX-XXXX-XXX-XX (e.g., 32-00-1234-567-89)
  const strnRegex = /^[0-9]{2}-[0-9]{2}-[0-9]{4}-[0-9]{3}-[0-9]{2}$/;

  if (!strnRegex.test(strn)) {
    return {
      isValid: false,
      message: 'Invalid STRN format. Format: 32-00-1234-567-89'
    };
  }

  return { isValid: true, message: 'STRN is valid' };
}

/**
 * Sanitize Input (prevent XSS)
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags
  input = input.replace(/<[^>]*>/g, '');

  // Remove script tags
  input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Trim whitespace
  input = input.trim();

  return input;
}

/**
 * Validate Multiple Fields at Once
 * @param {object} fields - Object with field names and values
 * @param {object} rules - Validation rules for each field
 * @returns {object} - { isValid: boolean, errors: object }
 */
export function validateFields(fields, rules) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    const rule = rules[fieldName];

    if (!rule) continue; // Skip if no rule defined

    let result;

    switch (rule) {
      case 'email':
        result = validateEmail(fieldValue);
        break;
      case 'password':
        result = validatePassword(fieldValue);
        break;
      case 'name':
        result = validateName(fieldValue);
        break;
      case 'phone':
        result = validatePhone(fieldValue);
        break;
      case 'companyName':
        result = validateCompanyName(fieldValue);
        break;
      case 'ntn':
        result = validateNTN(fieldValue);
        break;
      case 'strn':
        result = validateSTRN(fieldValue);
        break;
      default:
        continue;
    }

    if (!result.isValid) {
      errors[fieldName] = result.message;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Example usage:
 *
 * const result = validateEmail('user@example.com');
 * if (!result.isValid) {
 *   console.error(result.message);
 * }
 *
 * const pwdResult = validatePassword('MyP@ss123');
 * console.log(pwdResult.strength); // 'strong'
 *
 * const multiResult = validateFields(
 *   { email: 'test@example.com', name: 'John Doe' },
 *   { email: 'email', name: 'name' }
 * );
 * if (!multiResult.isValid) {
 *   console.error(multiResult.errors);
 * }
 */
