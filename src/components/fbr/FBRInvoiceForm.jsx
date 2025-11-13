'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbrInvoiceSchema } from '@/schemas/fbrInvoice';
import Autocomplete from '@/components/common/Autocomplete';
import NumberInput from '@/components/common/NumberInput';
import { useFBRData } from '@/hooks/useFBRData';
import {
  getRegistrationType,
  getSaleTypeToRate,
  getSROSchedule,
  getSROItem,
} from '@/services/fbr-service';
import toast from 'react-hot-toast';

const FBRInvoiceForm = ({
  userFBRInfo,
  clientsList = [],
  environment = 'sandbox',
}) => {
  // Fetch FBR reference data
  const { invoiceTypes, hsCodes, saleTypes, uomList, loading } = useFBRData();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fbrInvoiceSchema),
    defaultValues: {
      invoiceType: '',
      invoiceDate: '',
      localInvoiceNumber: '',
      sellerNTNCNIC: userFBRInfo?.ntn2 || userFBRInfo?.ntnCnic || '',
      sellerBusinessName: userFBRInfo?.businessName || '',
      sellerProvince: userFBRInfo?.province || '',
      sellerAddress: userFBRInfo?.businessAddress || '',
      sellerGST: userFBRInfo?.gst || '',
      buyerNTNCNIC: '',
      buyerBusinessName: '',
      buyerProvince: '',
      buyerAddress: '',
      buyerRegistrationType: '',
      invoiceRefNo: '',
      stockName: '',
      hsCode: '',
      productDescription: '',
      saleType: '',
      rate: '',
      uoM: '',
      quantity: 0,
      totalValues: 0,
      valueSalesExcludingST: 0,
      fixedNotifiedValueOrRetailPrice: 0,
      salesTaxApplicable: 0,
      salesTaxWithheldAtSource: 0,
      extraTax: 0,
      furtherTax: 0,
      sroScheduleNo: '',
      fedPayable: 0,
      discount: 0,
      sroItemSerialNo: '',
    },
  });

  // Loading States for dynamic API calls
  const [loadingBuyerRegType, setLoadingBuyerRegType] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [loadingSRO, setLoadingSRO] = useState(false);
  const [loadingSROItem, setLoadingSROItem] = useState(false);
  const [rateOptions, setRateOptions] = useState([]);
  const [selectedRateId, setSelectedRateId] = useState(null);
  const [selectedSroId, setSelectedSroId] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isStockSelected, setIsStockSelected] = useState(false);

  // Watch form values for dependencies
  const watchBuyerNTNCNIC = watch('buyerNTNCNIC');
  const watchHSCode = watch('hsCode');
  const watchInvoiceDate = watch('invoiceDate');
  const watchSaleType = watch('saleType');
  const watchRate = watch('rate');
  const watchSROScheduleNo = watch('sroScheduleNo');
  const watchValueSalesExcludingST = watch('valueSalesExcludingST');
  const watchSalesTaxApplicable = watch('salesTaxApplicable');

  // Fetch stocks on mount
  useEffect(() => {
    const fetchStocks = async () => {
      setLoadingStocks(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/stocks', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setStocks(result.data);
        }
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setLoadingStocks(false);
      }
    };

    fetchStocks();
  }, []);

  // Auto-fill Product Description when HS Code changes
  useEffect(() => {
    if (watchHSCode && hsCodes.length > 0) {
      const selectedHS = hsCodes.find((item) => item.value === watchHSCode);
      if (selectedHS) {
        setValue('productDescription', selectedHS.description);
      }
    }
  }, [watchHSCode, hsCodes, setValue]);

  // Fetch Buyer Registration Type when Buyer NTN/CNIC changes
  useEffect(() => {
    if (watchBuyerNTNCNIC && watchBuyerNTNCNIC.length >= 7) {
      const fetchBuyerRegType = async () => {
        setLoadingBuyerRegType(true);
        try {
          const data = await getRegistrationType(watchBuyerNTNCNIC);
          // FBR API response: { statuscode: "00", REGISTRATION_TYPE: "Registered" or "unregistered" }
          if (data.statuscode === '00' && data.REGISTRATION_TYPE) {
            setValue('buyerRegistrationType', data.REGISTRATION_TYPE);
          } else {
            // If statuscode is "01" or buyer not found, default to "unregistered"
            setValue('buyerRegistrationType', 'unregistered');
          }
        } catch (error) {
          console.error('Failed to fetch buyer registration type:', error);
          // Default to "unregistered" if API fails
          setValue('buyerRegistrationType', 'unregistered');
        } finally {
          setLoadingBuyerRegType(false);
        }
      };
      fetchBuyerRegType();
    }
  }, [watchBuyerNTNCNIC, setValue]);

  // Auto-calculate Rate when dependencies are met
  useEffect(() => {
    if (watchInvoiceDate && watchSaleType && userFBRInfo?.provinceNumber) {
      const fetchRate = async () => {
        setLoadingRate(true);
        try {
          // Find the saleType ID from description for getRate API
          const selectedSaleType = saleTypes.find(
            (st) => st.description === watchSaleType,
          );
          const saleTypeId = selectedSaleType?.value || watchSaleType;

          const data = await getSaleTypeToRate(
            watchInvoiceDate,
            saleTypeId,
            userFBRInfo.provinceNumber,
          );

          // Format rate options from FBR API response
          if (data && Array.isArray(data)) {
            const formattedRates = data.map((rate) => ({
              label: `${rate.ratE_VALUE}% - ${rate.ratE_DESC}`,
              value: rate.ratE_VALUE,
              description: rate.ratE_DESC,
              rateId: rate.ratE_ID,
            }));
            setRateOptions(formattedRates);

            // Set first rate as default if available
            if (formattedRates.length > 0) {
              setValue('rate', `${formattedRates[0].value}%`);
              setSelectedRateId(formattedRates[0].rateId);
            }
          }
        } catch (error) {
          console.error('Failed to fetch rate:', error);
          setRateOptions([]);
        } finally {
          setLoadingRate(false);
        }
      };
      fetchRate();
    }
  }, [watchInvoiceDate, watchSaleType, userFBRInfo, setValue, saleTypes]);

  // Auto-fetch SRO Schedule when rate and date are available
  useEffect(() => {
    if (selectedRateId && watchInvoiceDate && userFBRInfo?.provinceNumber) {
      const fetchSRO = async () => {
        setLoadingSRO(true);
        try {
          const data = await getSROSchedule(
            selectedRateId,
            watchInvoiceDate,
            userFBRInfo.provinceNumber,
          );

          // Set SRO Schedule Number if available
          if (data && data.length > 0) {
            setValue('sroScheduleNo', data[0].srO_DESC || '');
            setSelectedSroId(data[0].srO_ID);
          }
        } catch (error) {
          console.error('Failed to fetch SRO schedule:', error);
          setValue('sroScheduleNo', '');
        } finally {
          setLoadingSRO(false);
        }
      };
      fetchSRO();
    }
  }, [selectedRateId, watchInvoiceDate, userFBRInfo, setValue]);

  // Auto-fetch SRO Item when SRO ID and date are available
  useEffect(() => {
    if (selectedSroId && watchInvoiceDate) {
      const fetchSROItem = async () => {
        setLoadingSROItem(true);
        try {
          const data = await getSROItem(watchInvoiceDate, selectedSroId);

          // Set SRO Item Serial Number if available
          if (data && data.length > 0) {
            setValue('sroItemSerialNo', data[0].srO_ITEM_DESC || '');
          }
        } catch (error) {
          console.error('Failed to fetch SRO item:', error);
          setValue('sroItemSerialNo', '');
        } finally {
          setLoadingSROItem(false);
        }
      };
      fetchSROItem();
    }
  }, [selectedSroId, watchInvoiceDate, setValue]);

  // Auto-calculate Sales Tax Applicable and Total Values
  useEffect(() => {
    if (watchValueSalesExcludingST && watchRate) {
      // Extract numeric rate value (remove % sign if present)
      const rateValue = parseFloat(watchRate.toString().replace('%', '')) || 0;
      const baseAmount = parseFloat(watchValueSalesExcludingST) || 0;

      // Calculate sales tax: (baseAmount * rate) / 100
      const salesTax = (baseAmount * rateValue) / 100;

      // Set Sales Tax Applicable
      setValue('salesTaxApplicable', parseFloat(salesTax.toFixed(2)));

      // Calculate and set Total Values
      const totalValue = baseAmount + salesTax;
      setValue('totalValues', parseFloat(totalValue.toFixed(2)));
    }
  }, [watchValueSalesExcludingST, watchRate, setValue]);

  // Recalculate Total Values when Sales Tax Applicable changes manually
  useEffect(() => {
    const baseAmount = parseFloat(watchValueSalesExcludingST) || 0;
    const salesTax = parseFloat(watchSalesTaxApplicable) || 0;
    const totalValue = baseAmount + salesTax;

    if (baseAmount > 0 || salesTax > 0) {
      setValue('totalValues', parseFloat(totalValue.toFixed(2)));
    }
  }, [watchSalesTaxApplicable, watchValueSalesExcludingST, setValue]);

  // Handle Buyer selection from autocomplete
  const handleBuyerSelect = (buyer) => {
    console.log('Selected buyer:', buyer);
    setValue('buyerNTNCNIC', buyer.buyerNTNCNIC || '');
    setValue('buyerBusinessName', buyer.buyerBusinessName || '');
    setValue('buyerProvince', buyer.buyerProvince || '');
    setValue('buyerAddress', buyer.buyerAddress || '');
    setValue('buyerRegistrationType', buyer.buyerRegistrationType || '');
  };

  // Handle Stock selection from autocomplete
  const handleStockSelect = (stock) => {
    console.log('Selected stock:', stock);
    // Auto-fill fields from stock data
    setValue('hsCode', stock.hsCode || '');
    // Use stock name instead of HS code description
    setValue('productDescription', stock.stockName || '');

    // Only set UoM and SaleType if they exist in stock
    if (stock.uoM) {
      setValue('uoM', stock.uoM);
    }
    if (stock.saleType) {
      setValue('saleType', stock.saleType);
    }

    // Mark that stock was selected
    setIsStockSelected(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const onSubmit = async (data) => {
    console.log(data);
    setIsSaving(true);
    const loadingToast = toast.loading('Saving invoice to database...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first', { id: loadingToast });
        return;
      }

      // Format data according to FBR API structure
      const formattedData = {
        invoiceType: data.invoiceType,
        invoiceDate: data.invoiceDate,
        localInvoiceNumber: data.localInvoiceNumber || '',
        sellerNTNCNIC: data.sellerNTNCNIC,
        sellerBusinessName: data.sellerBusinessName,
        sellerProvince: data.sellerProvince,
        sellerAddress: data.sellerAddress,
        buyerNTNCNIC: data.buyerNTNCNIC,
        buyerBusinessName: data.buyerBusinessName,
        buyerProvince: data.buyerProvince,
        buyerAddress: data.buyerAddress,
        buyerRegistrationType: data.buyerRegistrationType,
        invoiceRefNo: data.invoiceRefNo || '',
        stockName: data.stockName || '',
        items: [
          {
            hsCode: data.hsCode,
            productDescription: data.productDescription,
            rate: data.rate,
            uoM: data.uoM,
            quantity: parseFloat(Number(data.quantity).toFixed(4)) || 0,
            totalValues: parseFloat(Number(data.totalValues).toFixed(2)) || 0,
            valueSalesExcludingST:
              parseFloat(Number(data.valueSalesExcludingST).toFixed(2)) || 0,
            fixedNotifiedValueOrRetailPrice:
              parseFloat(
                Number(data.fixedNotifiedValueOrRetailPrice).toFixed(2),
              ) || 0,
            salesTaxApplicable:
              parseFloat(Number(data.salesTaxApplicable).toFixed(2)) || 0,
            salesTaxWithheldAtSource:
              parseFloat(Number(data.salesTaxWithheldAtSource).toFixed(2)) || 0,
            extraTax: parseFloat(Number(data.extraTax).toFixed(2)) || 0,
            furtherTax: parseFloat(Number(data.furtherTax).toFixed(2)) || 0,
            sroScheduleNo: data.sroScheduleNo || '',
            fedPayable: parseFloat(Number(data.fedPayable).toFixed(2)) || 0,
            discount: parseFloat(Number(data.discount).toFixed(2)) || 0,
            saleType: data.saleType,
            sroItemSerialNo: data.sroItemSerialNo || '',
          },
        ],
      };

      // Use different API endpoints based on environment
      const apiEndpoint =
        environment === 'production'
          ? '/api/production/save-invoice'
          : '/api/sandbox/save-invoice';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Invoice saved to database successfully!', {
          id: loadingToast,
        });
        console.log('Saved invoice:', result.data);
      } else {
        toast.error(result.message || result.error || 'Failed to save invoice', {
          id: loadingToast,
          duration: 5000,
        });
        console.error('Save error:', result.details);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Network error. Please try again.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostInvoice = async () => {
    const data = watch();
    setIsPosting(true);
    const loadingToast = toast.loading('Sending invoice to FBR...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first', { id: loadingToast });
        return;
      }

      // Format invoice data
      const invoiceData = {
        invoiceType: data.invoiceType,
        invoiceDate: data.invoiceDate,
        localInvoiceNumber: data.localInvoiceNumber || '',
        sellerNTNCNIC: data.sellerNTNCNIC,
        sellerBusinessName: data.sellerBusinessName,
        sellerProvince: data.sellerProvince,
        sellerAddress: data.sellerAddress,
        buyerNTNCNIC: data.buyerNTNCNIC,
        buyerBusinessName: data.buyerBusinessName,
        buyerProvince: data.buyerProvince,
        buyerAddress: data.buyerAddress,
        buyerRegistrationType: data.buyerRegistrationType,
        invoiceRefNo: data.invoiceRefNo || '',
        stockName: data.stockName || '',
        items: [
          {
            hsCode: data.hsCode,
            productDescription: data.productDescription,
            rate: data.rate,
            uoM: data.uoM,
            quantity: parseFloat(Number(data.quantity).toFixed(4)) || 0,
            totalValues: parseFloat(Number(data.totalValues).toFixed(2)) || 0,
            valueSalesExcludingST:
              parseFloat(Number(data.valueSalesExcludingST).toFixed(2)) || 0,
            fixedNotifiedValueOrRetailPrice:
              parseFloat(
                Number(data.fixedNotifiedValueOrRetailPrice).toFixed(2),
              ) || 0,
            salesTaxApplicable:
              parseFloat(Number(data.salesTaxApplicable).toFixed(2)) || 0,
            salesTaxWithheldAtSource:
              parseFloat(Number(data.salesTaxWithheldAtSource).toFixed(2)) || 0,
            extraTax: parseFloat(Number(data.extraTax).toFixed(2)) || 0,
            furtherTax: parseFloat(Number(data.furtherTax).toFixed(2)) || 0,
            sroScheduleNo: data.sroScheduleNo || '',
            fedPayable: parseFloat(Number(data.fedPayable).toFixed(2)) || 0,
            discount: parseFloat(Number(data.discount).toFixed(2)) || 0,
            saleType: data.saleType,
            sroItemSerialNo: data.sroItemSerialNo || '',
          },
        ],
      };

      const response = await fetch('/api/sandbox/post-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceData, environment }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Invoice sent to FBR successfully! (${environment})`, {
          id: loadingToast,
        });
        console.log('Post invoice response:', result.data);
      } else {
        toast.error(result.error || 'Failed to send invoice to FBR', {
          id: loadingToast,
        });
        console.error('Post invoice error:', result.details);
      }
    } catch (error) {
      console.error('Post invoice error:', error);
      toast.error('Network error. Please try again.', { id: loadingToast });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Seller Information */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Seller Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Seller NTN/CNIC */}
          <div>
            <label
              htmlFor="sellerNTNCNIC"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Seller NTN/CNIC
            </label>
            <input
              type="text"
              {...register('sellerNTNCNIC')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              readOnly
              tabIndex="-1"
            />
          </div>

          {/* Seller Business Name */}
          <div>
            <label
              htmlFor="sellerBusinessName"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Seller Business Name
            </label>
            <input
              type="text"
              {...register('sellerBusinessName')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              readOnly
              tabIndex="-1"
            />
          </div>

          {/* Seller Province */}
          <div>
            <label
              htmlFor="sellerProvince"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Seller Province
            </label>
            <input
              type="text"
              {...register('sellerProvince')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              readOnly
              tabIndex="-1"
            />
          </div>

          {/* Seller Address */}
          <div>
            <label
              htmlFor="sellerAddress"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Seller Address
            </label>
            <input
              type="text"
              {...register('sellerAddress')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              readOnly
              tabIndex="-1"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Buyer Information */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Buyer Information
          </h3>
          <a
            href="/admin/customers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <svg
              className="h-4 w-4"
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
            Add New Buyer
          </a>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Buyer Search */}
          <div className="md:col-span-2">
            <Controller
              name="buyerBusinessName"
              control={control}
              render={({ field }) => {
                // Debug: Log clients list
                console.log('FBR Form - clientsList:', clientsList);
                console.log('FBR Form - clientsList length:', clientsList?.length);

                const mappedOptions = clientsList.map((client) => ({
                  label: `${client.buyerBusinessName} (${client.buyerNTNCNIC})`,
                  value: client.buyerBusinessName,
                  ...client,
                }));

                console.log('FBR Form - Mapped options:', mappedOptions);

                return (
                  <Autocomplete
                    label="Search Buyer"
                    name="buyerBusinessName"
                    value={field.value}
                    onChange={field.onChange}
                    onSelect={handleBuyerSelect}
                    options={mappedOptions}
                    placeholder="Type to search buyer by name or NTN/CNIC"
                    error={errors.buyerBusinessName?.message}
                    required
                  />
                );
              }}
            />
          </div>

          {/* Buyer NTN/CNIC */}
          <div>
            <label
              htmlFor="buyerNTNCNIC"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Buyer NTN/CNIC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('buyerNTNCNIC')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              readOnly
              tabIndex="-1"
            />
            {errors.buyerNTNCNIC && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.buyerNTNCNIC.message}
              </p>
            )}
          </div>

          {/* Buyer Province */}
          <div>
            <label
              htmlFor="buyerProvince"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Buyer Province <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('buyerProvince')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              readOnly
              tabIndex="-1"
            />
            {errors.buyerProvince && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.buyerProvince.message}
              </p>
            )}
          </div>

          {/* Buyer Address */}
          <div>
            <label
              htmlFor="buyerAddress"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Buyer Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('buyerAddress')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              readOnly
              tabIndex="-1"
            />
            {errors.buyerAddress && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.buyerAddress.message}
              </p>
            )}
          </div>

          {/* Buyer Registration Type */}
          <div>
            <label
              htmlFor="buyerRegistrationType"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Buyer Registration Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('buyerRegistrationType')}
                className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
                readOnly
                tabIndex="-1"
              />
              {loadingBuyerRegType && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            {errors.buyerRegistrationType && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.buyerRegistrationType.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Invoice Details */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Invoice Details
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Invoice Type */}
          <Controller
            name="invoiceType"
            control={control}
            render={({ field }) => (
              <Autocomplete
                label="Invoice Type"
                name="invoiceType"
                value={field.value}
                onChange={field.onChange}
                onSelect={(option) =>
                  field.onChange(option.description || option.label)
                }
                options={invoiceTypes}
                displayKey="description"
                loading={loading.invoiceTypes}
                placeholder="Select invoice type"
                error={errors.invoiceType?.message}
                required
              />
            )}
          />

          {/* Invoice Date */}
          <div>
            <label
              htmlFor="invoiceDate"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('invoiceDate')}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.invoiceDate && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.invoiceDate.message}
              </p>
            )}
          </div>

          {/* Local Invoice Number */}
          <div>
            <label
              htmlFor="localInvoiceNumber"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Local Invoice Number
            </label>
            <input
              type="text"
              {...register('localInvoiceNumber')}
              placeholder="Enter invoice number"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Product Details */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Product Details
          </h3>
          <a
            href="/admin/stock-management"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Manage Stock
          </a>
        </div>
        <div className="space-y-4">
          {/* Stock Selection */}
          <div className="relative">
            <Controller
              name="stockName"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  label="Select Stock Item (Optional - Auto-fills HS Code)"
                  name="stockName"
                  value={field.value}
                  onChange={field.onChange}
                  onSelect={handleStockSelect}
                  options={stocks.map((stock) => ({
                    label: `${stock.stockName} (${stock.hsCode})`,
                    value: stock.stockName,
                    ...stock,
                  }))}
                  loading={loadingStocks}
                  placeholder="Type to search stock items"
                />
              )}
            />
            {isStockSelected && (
              <button
                type="button"
                onClick={() => {
                  setValue('stockName', '');
                  setIsStockSelected(false);
                }}
                className="absolute right-3 top-11 rounded-full bg-red-100 p-1 text-red-600 transition hover:bg-red-200"
                title="Clear stock selection"
              >
                <svg
                  className="h-4 w-4"
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
            )}
          </div>

          {/* HS Code, Sale Type, UoM */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  loading={loading.hsCodes}
                  placeholder="Type HS code"
                  error={errors.hsCode?.message}
                  required
                  readOnly={isStockSelected}
                />
              )}
            />

            {/* Sale Type */}
            <Controller
              name="saleType"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  label="Sale Type"
                  name="saleType"
                  value={field.value}
                  onChange={field.onChange}
                  onSelect={(option) =>
                    field.onChange(option.description || option.label)
                  }
                  options={saleTypes}
                  displayKey="description"
                  loading={loading.saleTypes}
                  placeholder="Select sale type"
                  error={errors.saleType?.message}
                  required
                  readOnly={isStockSelected}
                />
              )}
            />

            {/* UoM */}
            <Controller
              name="uoM"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  label="Unit of Measurement"
                  name="uoM"
                  value={field.value}
                  onChange={field.onChange}
                  onSelect={(option) =>
                    field.onChange(option.description || option.label)
                  }
                  options={uomList}
                  displayKey="description"
                  loading={loading.uomList}
                  placeholder="Select UoM"
                  error={errors.uoM?.message}
                  required
                  readOnly={isStockSelected}
                />
              )}
            />
          </div>

          {/* Rate, Quantity */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Rate */}
            <Controller
              name="rate"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  label="Rate"
                  name="rate"
                  value={field.value}
                  onChange={field.onChange}
                  onSelect={(option) => {
                    field.onChange(`${option.value}%`);
                    setSelectedRateId(option.rateId);
                  }}
                  options={rateOptions}
                  loading={loadingRate}
                  placeholder="Select rate"
                  error={errors.rate?.message}
                  required
                />
              )}
            />

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                {...register('quantity')}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.quantity && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label
              htmlFor="productDescription"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Product Description
            </label>
            <textarea
              {...register('productDescription')}
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-3 outline-none"
              rows="2"
              readOnly
              tabIndex="-1"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Financial Details */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Financial Details
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Value Sales Excluding ST */}
          <Controller
            name="valueSalesExcludingST"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Value Sales Excluding ST"
                name="valueSalesExcludingST"
                value={field.value}
                onChange={field.onChange}
                error={errors.valueSalesExcludingST?.message}
                required
                placeholder="0.00"
              />
            )}
          />

          {/* Sales Tax Applicable */}
          <Controller
            name="salesTaxApplicable"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Sales Tax Applicable"
                name="salesTaxApplicable"
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />

          {/* Total Values */}
          <Controller
            name="totalValues"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Total Values"
                name="totalValues"
                value={field.value}
                onChange={field.onChange}
                error={errors.totalValues?.message}
                required
                placeholder="0.00"
              />
            )}
          />

          {/* Fixed Notified Value/Retail Price */}
          <Controller
            name="fixedNotifiedValueOrRetailPrice"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Fixed Notified Value/Retail Price"
                name="fixedNotifiedValueOrRetailPrice"
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />

          {/* Sales Tax Withheld at Source */}
          <Controller
            name="salesTaxWithheldAtSource"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Sales Tax Withheld at Source"
                name="salesTaxWithheldAtSource"
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />

          {/* Extra Tax */}
          <Controller
            name="extraTax"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Extra Tax"
                name="extraTax"
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />

          {/* Further Tax */}
          <Controller
            name="furtherTax"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Further Tax"
                name="furtherTax"
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />

          {/* SRO Schedule Number */}
          <div>
            <label
              htmlFor="sroScheduleNo"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              SRO Schedule Number
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('sroScheduleNo')}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter SRO Schedule Number"
              />
              {loadingSRO && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* FED Payable */}
          <Controller
            name="fedPayable"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="FED Payable"
                name="fedPayable"
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />

          {/* Discount */}
          <Controller
            name="discount"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Discount"
                name="discount"
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />

          {/* SRO Item Serial Number */}
          <div>
            <label
              htmlFor="sroItemSerialNo"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              SRO Item Serial Number
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('sroItemSerialNo')}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter SRO Item Serial Number"
              />
              {loadingSROItem && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Invoice'}
        </button>
        <button
          type="button"
          onClick={handlePostInvoice}
          disabled={isPosting}
          className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPosting ? 'Sending...' : 'Send to FBR'}
        </button>
      </div>
    </form>
  );
};

export default FBRInvoiceForm;
