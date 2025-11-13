'use client';

import { useState, useEffect, useRef } from 'react';
import { useFBRSearchHSCode, useFBRItemCodes } from '@/hooks/useFBR';

/**
 * HS Code Search with Autocomplete
 * Searches and selects HS codes from FBR
 */
export function HSCodeSearch({ value, onChange, onSelect, required = false, placeholder = 'Search HS Code...' }) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search HS codes
  const { data: results, isLoading } = useFBRSearchHSCode(
    debouncedTerm,
    debouncedTerm.length >= 2
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when results are available
  useEffect(() => {
    if (results && results.length > 0 && searchTerm.length >= 2) {
      setShowDropdown(true);
    }
  }, [results, searchTerm]);

  const handleSelect = (item) => {
    setSearchTerm(item.hS_CODE);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onChange(item.hS_CODE);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleKeyDown = (e) => {
    if (!results || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results && results.length > 0) setShowDropdown(true);
        }}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {isLoading && searchTerm.length >= 2 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {showDropdown && results && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((item, index) => (
            <div
              key={item.hS_CODE}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
                ${selectedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'}
              `}
            >
              <div className="font-semibold text-sm text-gray-900">{item.hS_CODE}</div>
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && debouncedTerm.length >= 2 && !isLoading && (!results || results.length === 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">No HS codes found for "{debouncedTerm}"</p>
        </div>
      )}

      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <div className="text-xs text-gray-500 mt-1">Type at least 2 characters to search</div>
      )}
    </div>
  );
}

/**
 * HS Code Browser (List View)
 * Shows all HS codes in a browsable list
 */
export function HSCodeBrowser({ onSelect, pageSize = 20 }) {
  const [page, setPage] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');
  const { data: allCodes, isLoading } = useFBRItemCodes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!allCodes || allCodes.length === 0) {
    return <div className="text-center text-gray-500 p-8">No HS codes available</div>;
  }

  // Filter codes
  const filteredCodes = searchFilter
    ? allCodes.filter(
        (code) =>
          code.hS_CODE.toLowerCase().includes(searchFilter.toLowerCase()) ||
          code.description.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : allCodes;

  // Paginate
  const startIndex = (page - 1) * pageSize;
  const paginatedCodes = filteredCodes.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredCodes.length / pageSize);

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <input
        type="text"
        value={searchFilter}
        onChange={(e) => {
          setSearchFilter(e.target.value);
          setPage(1);
        }}
        placeholder="Filter HS codes..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredCodes.length)} of {filteredCodes.length} codes
      </div>

      {/* HS Code List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {paginatedCodes.map((code) => (
          <div
            key={code.hS_CODE}
            onClick={() => onSelect(code)}
            className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 cursor-pointer transition-colors"
          >
            <div className="font-semibold text-sm">{code.hS_CODE}</div>
            <div className="text-xs text-gray-600 mt-1">{code.description}</div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * HS Code Display (Read-only)
 */
export function HSCodeDisplay({ code }) {
  const { data: allCodes } = useFBRItemCodes();
  const hsCode = allCodes?.find((c) => c.hS_CODE === code);

  if (!hsCode) {
    return <span className="text-gray-400">{code || 'N/A'}</span>;
  }

  return (
    <div>
      <div className="font-semibold">{hsCode.hS_CODE}</div>
      <div className="text-xs text-gray-600">{hsCode.description}</div>
    </div>
  );
}
