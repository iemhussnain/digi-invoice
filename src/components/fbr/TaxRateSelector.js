'use client';

import { useFBRSaleTypeToRate } from '@/hooks/useFBR';

/**
 * Tax Rate Selector Component
 * Fetches applicable tax rates based on date, transaction type, and province
 */
export function TaxRateSelector({
  date,
  transactionTypeId,
  provinceId,
  value,
  onChange,
  required = false,
  disabled = false,
  onRateData,
}) {
  const { data: taxRates, isLoading, error } = useFBRSaleTypeToRate(
    date,
    transactionTypeId,
    provinceId,
    !!(date && transactionTypeId && provinceId) // Only fetch when all params are provided
  );

  // Notify parent about available rates
  if (taxRates && onRateData) {
    onRateData(taxRates);
  }

  if (!date || !transactionTypeId || !provinceId) {
    return (
      <div className="text-sm text-gray-500 italic">
        Please select date, transaction type, and province first
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        ⚠️ Failed to load tax rates. Check FBR settings.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span>Loading tax rates...</span>
      </div>
    );
  }

  if (!taxRates || taxRates.length === 0) {
    return (
      <div className="text-sm text-orange-600">
        ⚠️ No tax rates found for the selected criteria
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => {
        const selectedRateId = e.target.value ? Number(e.target.value) : null;
        const selectedRate = taxRates.find((r) => r.ratE_ID === selectedRateId);
        onChange(selectedRateId, selectedRate);
      }}
      required={required}
      disabled={disabled}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
    >
      <option value="">Select Tax Rate</option>
      {taxRates.map((rate) => (
        <option key={rate.ratE_ID} value={rate.ratE_ID}>
          {rate.ratE_VALUE}% - {rate.ratE_DESC}
        </option>
      ))}
    </select>
  );
}

/**
 * Tax Rate Display (Read-only)
 */
export function TaxRateDisplay({ date, transactionTypeId, provinceId, rateId }) {
  const { data: taxRates } = useFBRSaleTypeToRate(
    date,
    transactionTypeId,
    provinceId,
    !!(date && transactionTypeId && provinceId)
  );

  const selectedRate = taxRates?.find((r) => r.ratE_ID === rateId);

  if (!selectedRate) {
    return <span className="text-gray-400">N/A</span>;
  }

  return (
    <span>
      {selectedRate.ratE_VALUE}% - {selectedRate.ratE_DESC}
    </span>
  );
}

/**
 * Quick Tax Rate Picker with Value Display
 */
export function QuickTaxRatePicker({
  date,
  transactionTypeId,
  provinceId,
  onSelect,
  showDetails = true,
}) {
  const { data: taxRates, isLoading } = useFBRSaleTypeToRate(
    date,
    transactionTypeId,
    provinceId,
    !!(date && transactionTypeId && provinceId)
  );

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading rates...</div>;
  }

  if (!taxRates || taxRates.length === 0) {
    return <div className="text-sm text-gray-500">No rates available</div>;
  }

  return (
    <div className="space-y-2">
      {taxRates.map((rate) => (
        <button
          key={rate.ratE_ID}
          type="button"
          onClick={() => onSelect(rate)}
          className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-lg">{rate.ratE_VALUE}%</span>
              {showDetails && (
                <p className="text-xs text-gray-600 mt-1">{rate.ratE_DESC}</p>
              )}
            </div>
            <span className="text-blue-600">→</span>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Tax Rate Card (for displaying in grids)
 */
export function TaxRateCard({ rate, selected = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 border-2 rounded-lg cursor-pointer transition-all
        ${selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="text-2xl font-bold text-gray-900">{rate.ratE_VALUE}%</div>
      <div className="text-sm text-gray-600 mt-2">{rate.ratE_DESC}</div>
      {selected && (
        <div className="mt-2 text-blue-600 font-medium text-sm">✓ Selected</div>
      )}
    </div>
  );
}
