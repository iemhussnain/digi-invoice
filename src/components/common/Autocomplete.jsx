'use client';

import Select from 'react-select';

/**
 * Autocomplete Component using react-select
 * Matches your existing component API
 */
const Autocomplete = ({
  label,
  name,
  value,
  onChange,
  onSelect,
  options = [],
  displayKey = 'label',
  loading = false,
  placeholder = 'Select...',
  error,
  required = false,
  readOnly = false,
  className = '',
}) => {
  // Format options for react-select
  const selectOptions = options.map((option) => ({
    value: option.value,
    label: option[displayKey] || option.label,
    ...option, // Keep all original data
  }));

  // Find selected option
  const selectedOption = selectOptions.find((opt) => opt.value === value || opt.label === value);

  // Handle selection change
  const handleChange = (selected) => {
    if (selected) {
      onChange(selected.value);
      if (onSelect) {
        onSelect(selected);
      }
    } else {
      onChange('');
    }
  };

  // Custom styles to match your Tailwind design
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '0.75rem', // rounded-xl
      borderWidth: '2px',
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb', // blue-500 : gray-200
      padding: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      },
      backgroundColor: readOnly ? '#f3f4f6' : 'white',
      cursor: readOnly ? 'not-allowed' : 'pointer',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.75rem',
      marginTop: '0.25rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#eff6ff'
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer',
      padding: '0.75rem 1rem',
      '&:active': {
        backgroundColor: '#3b82f6',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#374151',
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: '#3b82f6',
    }),
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="mb-2 block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Select
        id={name}
        name={name}
        value={selectedOption || null}
        onChange={handleChange}
        options={selectOptions}
        styles={customStyles}
        placeholder={placeholder}
        isLoading={loading}
        isDisabled={readOnly}
        isClearable={!required}
        isSearchable
        noOptionsMessage={() => 'No options found'}
        loadingMessage={() => 'Loading...'}
      />
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Autocomplete;
