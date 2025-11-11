'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * React Datepicker Examples with date-fns Integration
 *
 * Benefits:
 * - Visual calendar picker
 * - Date range selection
 * - Time picker
 * - Integrates with date-fns
 * - Keyboard navigation
 * - Accessibility support
 */
export default function DatePickerExample() {
  // Basic Date Pickers
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(addDays(new Date(), 30));
  const [birthDate, setBirthDate] = useState(null);

  // Date Range Pickers
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [fiscalYearStart, setFiscalYearStart] = useState(startOfYear(new Date()));
  const [fiscalYearEnd, setFiscalYearEnd] = useState(endOfYear(new Date()));

  // Time Pickers
  const [dateTime, setDateTime] = useState(new Date());
  const [timeOnly, setTimeOnly] = useState(new Date());

  // Filtered Dates
  const [paymentDate, setPaymentDate] = useState(new Date());

  // Exclude weekends for payment dates
  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
  };

  // Highlight specific dates (e.g., payment due dates)
  const highlightDates = [
    addDays(new Date(), 7),
    addDays(new Date(), 14),
    addDays(new Date(), 21),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          React Datepicker + date-fns
        </h2>
        <p className="text-gray-600 mb-6">
          Visual calendar pickers integrated with date-fns for formatting
        </p>
      </div>

      {/* Basic Date Pickers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Date Pickers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Date
            </label>
            <DatePicker
              selected={invoiceDate}
              onChange={(date) => setInvoiceDate(date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="dd/MM/yyyy"
              placeholderText="Select invoice date"
            />
            {invoiceDate && (
              <p className="mt-2 text-xs text-gray-600">
                Formatted: {format(invoiceDate, 'dd MMMM yyyy')}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (30 days default)
            </label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              minDate={new Date()} // Can't select past dates
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="dd/MM/yyyy"
              placeholderText="Select due date"
            />
            {dueDate && (
              <p className="mt-2 text-xs text-gray-600">
                Formatted: {format(dueDate, 'PPP')}
              </p>
            )}
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Birth Date (Max Date Example)
            </label>
            <DatePicker
              selected={birthDate}
              onChange={(date) => setBirthDate(date)}
              maxDate={subDays(new Date(), 6570)} // Must be 18+ years old
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="dd/MM/yyyy"
              placeholderText="DD/MM/YYYY"
            />
            {birthDate && (
              <p className="mt-2 text-xs text-gray-600">
                Age: {Math.floor((new Date() - birthDate) / 31557600000)} years
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Pickers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Date Range Pickers (For Reports)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Period (Current Month)
            </label>
            <div className="flex gap-3">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                dateFormat="dd/MM/yyyy"
                placeholderText="Start Date"
              />
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                dateFormat="dd/MM/yyyy"
                placeholderText="End Date"
              />
            </div>
            {startDate && endDate && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">
                  Period: {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>

          {/* Fiscal Year Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fiscal Year Range
            </label>
            <div className="flex gap-3">
              <DatePicker
                selected={fiscalYearStart}
                onChange={(date) => setFiscalYearStart(date)}
                selectsStart
                startDate={fiscalYearStart}
                endDate={fiscalYearEnd}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                dateFormat="dd/MM/yyyy"
                placeholderText="FY Start"
              />
              <DatePicker
                selected={fiscalYearEnd}
                onChange={(date) => setFiscalYearEnd(date)}
                selectsEnd
                startDate={fiscalYearStart}
                endDate={fiscalYearEnd}
                minDate={fiscalYearStart}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                dateFormat="dd/MM/yyyy"
                placeholderText="FY End"
              />
            </div>
            {fiscalYearStart && fiscalYearEnd && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900 font-medium">
                  FY: {format(fiscalYearStart, 'yyyy')} - {format(fiscalYearEnd, 'yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Pickers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Date & Time Pickers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date + Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Date & Time
            </label>
            <DatePicker
              selected={dateTime}
              onChange={(date) => setDateTime(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholderText="Select date and time"
            />
            {dateTime && (
              <p className="mt-2 text-xs text-gray-600">
                ISO: {dateTime.toISOString()}
              </p>
            )}
          </div>

          {/* Time Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Only (e.g., Store Opening)
            </label>
            <DatePicker
              selected={timeOnly}
              onChange={(date) => setTimeOnly(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={30}
              timeCaption="Time"
              dateFormat="h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholderText="Select time"
            />
            {timeOnly && (
              <p className="mt-2 text-xs text-gray-600">
                24h Format: {format(timeOnly, 'HH:mm')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Advanced Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exclude Weekends */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date (Weekdays Only)
            </label>
            <DatePicker
              selected={paymentDate}
              onChange={(date) => setPaymentDate(date)}
              filterDate={isWeekday}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="dd/MM/yyyy"
              placeholderText="Select weekday"
            />
            <p className="mt-2 text-xs text-gray-500">
              Weekends are disabled (banks closed)
            </p>
          </div>

          {/* Highlight Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upcoming Due Dates (Highlighted)
            </label>
            <DatePicker
              selected={paymentDate}
              onChange={(date) => setPaymentDate(date)}
              highlightDates={highlightDates}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date"
            />
            <p className="mt-2 text-xs text-gray-500">
              Highlighted dates: Next 3 payment due dates
            </p>
          </div>
        </div>
      </div>

      {/* Quick Date Shortcuts */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Date Shortcuts
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setStartDate(new Date());
              setEndDate(new Date());
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Today
          </button>
          <button
            onClick={() => {
              setStartDate(subDays(new Date(), 7));
              setEndDate(new Date());
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setStartDate(subDays(new Date(), 30));
              setEndDate(new Date());
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              setStartDate(startOfMonth(new Date()));
              setEndDate(endOfMonth(new Date()));
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              setStartDate(startOfMonth(lastMonth));
              setEndDate(endOfMonth(lastMonth));
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Last Month
          </button>
          <button
            onClick={() => {
              setStartDate(startOfYear(new Date()));
              setEndDate(endOfYear(new Date()));
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            This Year
          </button>
          <button
            onClick={() => {
              const lastYear = new Date();
              lastYear.setFullYear(lastYear.getFullYear() - 1);
              setStartDate(startOfYear(lastYear));
              setEndDate(endOfYear(lastYear));
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Last Year
          </button>
          <button
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium text-red-700 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Use Cases in ERP */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Perfect Use Cases in DigiInvoice ERP
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Sales Module:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Invoice date selection</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Payment due date (auto-calculate 30 days)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Sales report date range</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Customer payment history filter</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Procurement:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Purchase order date</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Expected delivery date</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>GRN (Goods Receipt) date</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Supplier payment terms</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Accounting:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Journal voucher date</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Fiscal year selection</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Trial balance period</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Ledger date filter</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Reports:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Balance sheet date</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>P&L period (monthly/quarterly/yearly)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Cash flow date range</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Aging report cutoff date</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* date-fns Integration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          date-fns Integration Examples
        </h3>

        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100">
            <code>{`// Import date-fns functions
import { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Format date for display
format(new Date(), 'dd/MM/yyyy') // "11/11/2025"
format(new Date(), 'dd MMMM yyyy') // "11 November 2025"
format(new Date(), 'PPP') // "November 11th, 2025"

// Calculate due date (30 days from invoice date)
const invoiceDate = new Date();
const dueDate = addDays(invoiceDate, 30);

// Get current month range for reports
const monthStart = startOfMonth(new Date());
const monthEnd = endOfMonth(new Date());

// Date picker integration
<DatePicker
  selected={invoiceDate}
  onChange={(date) => setInvoiceDate(date)}
  dateFormat="dd/MM/yyyy"  // Pakistani format
  minDate={new Date()}      // No past dates
  maxDate={addDays(new Date(), 365)}  // Max 1 year ahead
/>`}</code>
          </pre>
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Before vs After Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">
              ❌ Before (Manual Input)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Type date manually: "11/11/2025"</li>
              <li>• Risk of invalid dates</li>
              <li>• No format validation</li>
              <li>• Confusing date formats (MM/DD vs DD/MM)</li>
              <li>• Can't select weekdays only</li>
              <li>• No quick shortcuts</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ After (React Datepicker)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Visual calendar - click to select</li>
              <li>• Always valid dates</li>
              <li>• Consistent DD/MM/YYYY format</li>
              <li>• Clear date selection UI</li>
              <li>• Filter dates (weekdays, future only, etc.)</li>
              <li>• Quick shortcuts (Today, This Month, etc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
