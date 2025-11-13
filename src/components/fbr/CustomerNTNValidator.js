'use client';

import { useState, useEffect } from 'react';
import { useFBRValidateRegistration } from '@/hooks/useFBR';

/**
 * Customer NTN Validation Component
 * Validates customer NTN against FBR in real-time
 */
export function CustomerNTNValidator({ ntn, date = new Date(), onChange, showDetails = true }) {
  const [debouncedNTN, setDebouncedNTN] = useState(ntn);

  // Debounce NTN input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNTN(ntn);
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timer);
  }, [ntn]);

  const { data: validation, isLoading, error } = useFBRValidateRegistration(
    debouncedNTN,
    date,
    !!(debouncedNTN && debouncedNTN.length >= 6) // Only validate if NTN has at least 6 characters
  );

  // Notify parent component about validation status
  useEffect(() => {
    if (validation && onChange) {
      onChange(validation);
    }
  }, [validation, onChange]);

  if (!ntn || ntn.length < 6) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span>Validating NTN...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-orange-600 mt-1">
        ⚠️ Unable to validate NTN. Check FBR connection.
      </div>
    );
  }

  if (!validation) return null;

  const { isRegistered, isActive, registrationType, statlStatus } = validation;

  return (
    <div className="mt-2 space-y-1">
      {/* Registration Status */}
      <div className="flex items-center gap-2 text-sm">
        {isRegistered ? (
          <>
            <span className="text-green-600 font-semibold">✓ Registered</span>
            {showDetails && (
              <span className="text-gray-600 text-xs">({registrationType})</span>
            )}
          </>
        ) : (
          <span className="text-red-600 font-semibold">✗ Not Registered</span>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-2 text-sm">
        {isActive ? (
          <span className="text-green-600 font-semibold">✓ Active</span>
        ) : (
          <>
            <span className="text-orange-600 font-semibold">⚠ Inactive</span>
            {showDetails && statlStatus && (
              <span className="text-gray-600 text-xs">({statlStatus})</span>
            )}
          </>
        )}
      </div>

      {/* Warning for unregistered/inactive */}
      {(!isRegistered || !isActive) && (
        <div className="bg-orange-50 border border-orange-200 rounded p-2 mt-2">
          <p className="text-xs text-orange-800">
            ⚠️ This customer's registration status may affect invoice compliance.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline NTN Validator Badge (Compact Version)
 */
export function NTNValidatorBadge({ ntn, date = new Date() }) {
  const { data: validation, isLoading } = useFBRValidateRegistration(
    ntn,
    date,
    !!(ntn && ntn.length >= 6)
  );

  if (!ntn) return null;

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
        <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        Validating...
      </span>
    );
  }

  if (!validation) return null;

  const { isRegistered, isActive } = validation;

  if (isRegistered && isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
        ✓ Verified
      </span>
    );
  }

  if (isRegistered && !isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
        ⚠ Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
      ✗ Unregistered
    </span>
  );
}

/**
 * NTN Input Field with Built-in Validation
 */
export function NTNInput({ value, onChange, onValidation, required = false, className = '' }) {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Enter NTN (e.g., 0788762)"
        required={required}
        className={className || 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
        maxLength={20}
      />
      <CustomerNTNValidator
        ntn={localValue}
        onChange={onValidation}
        showDetails={true}
      />
    </div>
  );
}
