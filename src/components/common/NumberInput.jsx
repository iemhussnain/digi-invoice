'use client';

/**
 * NumberInput Component
 * Specialized input for numerical values with proper formatting
 */
const NumberInput = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder = '0.00',
  min = 0,
  step = '0.01',
  readOnly = false,
  className = '',
}) => {
  const handleChange = (e) => {
    const newValue = e.target.value;
    // Allow empty string, numbers, and decimals
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    // Format to 2 decimal places on blur if value exists
    if (value && value !== '') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onChange(numValue.toFixed(2));
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="mb-2 block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="text"
        id={name}
        name={name}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors ${
          readOnly
            ? 'cursor-not-allowed border-gray-200 bg-gray-100'
            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
        } ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default NumberInput;
