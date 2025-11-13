'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Autocomplete from '@/components/common/Autocomplete';
import NumberInput from '@/components/common/NumberInput';
import { useFBRData } from '@/hooks/useFBRData';
import toast from 'react-hot-toast';

// Zod validation schema for stock
const stockSchema = z.object({
  stockName: z.string().min(1, 'Stock name is required'),
  hsCode: z.string().min(1, 'HS Code is required'),
  description: z.string().optional(),
  saleType: z.string().min(1, 'Sale type is required'),
  uoM: z.string().min(1, 'Unit of measurement is required'),
  quantity: z.coerce.number().nonnegative('Quantity must be 0 or greater'),
});

export default function StockManagementPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  // Fetch FBR reference data
  const { hsCodes, saleTypes, uomList, loading: fbrLoading } = useFBRData();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      stockName: '',
      hsCode: '',
      description: '',
      saleType: '',
      uoM: '',
      quantity: 0,
    },
  });

  const watchHSCode = watch('hsCode');

  // Auto-fill description from HS Code
  useEffect(() => {
    if (watchHSCode && hsCodes.length > 0) {
      const selectedHS = hsCodes.find((item) => item.value === watchHSCode);
      if (selectedHS) {
        setValue('description', selectedHS.description);
      }
    }
  }, [watchHSCode, hsCodes, setValue]);

  // Fetch stocks
  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stocks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setStocks(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Failed to load stocks');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    const loadingToast = toast.loading(editingStock ? 'Updating stock...' : 'Adding stock...');

    try {
      const token = localStorage.getItem('token');
      const url = editingStock ? `/api/stocks/${editingStock._id}` : '/api/stocks';
      const method = editingStock ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(editingStock ? 'Stock updated successfully!' : 'Stock added successfully!', {
          id: loadingToast,
        });
        setIsModalOpen(false);
        reset();
        setEditingStock(null);
        fetchStocks();
      } else {
        toast.error(result.message || 'Failed to save stock', { id: loadingToast });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Network error. Please try again.', { id: loadingToast });
    }
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    reset({
      stockName: stock.stockName,
      hsCode: stock.hsCode,
      description: stock.description,
      saleType: stock.saleType,
      uoM: stock.uoM,
      quantity: stock.quantity,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;

    const loadingToast = toast.loading('Deleting stock...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stocks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Stock deleted successfully!', { id: loadingToast });
        fetchStocks();
      } else {
        toast.error(result.message || 'Failed to delete stock', { id: loadingToast });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Network error. Please try again.', { id: loadingToast });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStock(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-2">Manage your inventory with FBR compliance</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold transition hover:bg-blue-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Stock
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading stocks...</p>
            </div>
          ) : stocks.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-600 text-lg mb-2">No stock items found</p>
              <p className="text-gray-500 text-sm">Add your first stock item to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HS Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UoM
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stocks.map((stock) => (
                    <tr key={stock._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stock.stockName}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {stock.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-mono">{stock.hsCode}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{stock.saleType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{stock.uoM}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">{stock.quantity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEdit(stock)}
                          className="text-blue-600 hover:text-blue-900 mr-3 transition"
                        >
                          <svg
                            className="h-5 w-5 inline"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(stock._id)}
                          className="text-red-600 hover:text-red-900 transition"
                        >
                          <svg
                            className="h-5 w-5 inline"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingStock ? 'Edit Stock' : 'Add New Stock'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Stock Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('stockName')}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter stock name"
                />
                {errors.stockName && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.stockName.message}</p>
                )}
              </div>

              {/* HS Code */}
              <Controller
                name="hsCode"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    label="HS Code"
                    name="hsCode"
                    value={field.value}
                    onChange={field.onChange}
                    onSelect={(option) => field.onChange(option.value)}
                    options={hsCodes}
                    loading={fbrLoading.hsCodes}
                    placeholder="Type HS code"
                    error={errors.hsCode?.message}
                    required
                  />
                )}
              />

              {/* Description (Auto-filled) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Auto-filled from HS Code)
                </label>
                <textarea
                  {...register('description')}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
                  rows="2"
                  readOnly
                />
              </div>

              {/* Sale Type & UoM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="saleType"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      label="Sale Type"
                      name="saleType"
                      value={field.value}
                      onChange={field.onChange}
                      onSelect={(option) => field.onChange(option.description || option.label)}
                      options={saleTypes}
                      displayKey="description"
                      loading={fbrLoading.saleTypes}
                      placeholder="Select sale type"
                      error={errors.saleType?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name="uoM"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      label="Unit of Measurement"
                      name="uoM"
                      value={field.value}
                      onChange={field.onChange}
                      onSelect={(option) => field.onChange(option.description || option.label)}
                      options={uomList}
                      displayKey="description"
                      loading={fbrLoading.uomList}
                      placeholder="Select UoM"
                      error={errors.uoM?.message}
                      required
                    />
                  )}
                />
              </div>

              {/* Quantity */}
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="Quantity"
                    name="quantity"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.quantity?.message}
                    placeholder="0"
                  />
                )}
              />

              {/* Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  {editingStock ? 'Update Stock' : 'Add Stock'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
