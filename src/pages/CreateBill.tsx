import { useState, useEffect, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useCurrencyExchange } from '../hooks/useCurrencyExchange'
import { useBillCreation } from '../hooks/useBillCreation'
import {
  useQRCode,
  generateBillURL,
  generateShareText,
} from '../hooks/useQRCode'

interface BillFormData {
  totalAmount: string
  currency: string
  shares: string
  description: string
}

const CURRENCIES = [
  { value: 'NZD', label: 'NZD (New Zealand Dollar)' },
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'GBP', label: 'GBP (British Pound)' },
  { value: 'AUD', label: 'AUD (Australian Dollar)' },
  { value: 'CAD', label: 'CAD (Canadian Dollar)' },
]

export default function CreateBill() {
  const { isConnected } = useAccount()
  const {
    convertToUSDT,
    loading: exchangeLoading,
    error: exchangeError,
    lastUpdated,
    refresh,
  } = useCurrencyExchange()

  const {
    createBill,
    isLoading: isCreatingBill,
    isSuccess: billCreated,
    isError: billCreationError,
    error: billError,
    txHash,
    billId,
    reset: resetBillCreation,
  } = useBillCreation()

  const {
    qrCodeDataURL,
    isGenerating: isGeneratingQR,
    error: qrError,
    generateQRCode,
    copyToClipboard,
    shareURL,
  } = useQRCode()

  const [formData, setFormData] = useState<BillFormData>({
    totalAmount: '',
    currency: 'NZD',
    shares: '',
    description: '',
  })

  const [errors, setErrors] = useState<Partial<BillFormData>>({})
  const [billURL, setBillURL] = useState<string>('')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof BillFormData, boolean>>
  >({})

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Generate QR code when bill is created successfully
  useEffect(() => {
    if (billCreated && billId) {
      const url = generateBillURL(billId)
      setBillURL(url)
      generateQRCode(url)
    }
  }, [billCreated, billId, generateQRCode])

  const handleInputChange = (field: keyof BillFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormTouched((prev) => ({ ...prev, [field]: true }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    // Real-time validation for better UX
    if (formTouched[field]) {
      validateField(field, value)
    }
  }

  const validateField = useCallback(
    (field: keyof BillFormData, value?: string) => {
      const fieldValue = value !== undefined ? value : formData[field]
      let error: string | undefined

      switch (field) {
        case 'totalAmount':
          if (!fieldValue || fieldValue.trim() === '') {
            error = 'Total amount is required'
          } else {
            const amount = parseFloat(fieldValue)
            if (isNaN(amount)) {
              error = 'Please enter a valid number'
            } else if (amount <= 0) {
              error = 'Total amount must be greater than 0'
            } else if (amount > 1000000) {
              error = 'Total amount cannot exceed 1,000,000'
            } else if (
              fieldValue.includes('.') &&
              (fieldValue.split('.')[1]?.length ?? 0) > 6
            ) {
              error = 'Maximum 6 decimal places allowed'
            }
          }
          break

        case 'shares':
          if (!fieldValue || fieldValue.trim() === '') {
            error = 'Number of shares is required'
          } else {
            const shares = parseInt(fieldValue)
            if (isNaN(shares) || !Number.isInteger(Number(fieldValue))) {
              error = 'Please enter a whole number'
            } else if (shares <= 0) {
              error = 'Number of shares must be at least 1'
            } else if (shares > 100) {
              error = 'Number of shares cannot exceed 100'
            }
          }
          break

        case 'description':
          if (!fieldValue || fieldValue.trim() === '') {
            error = 'Description is required'
          } else if (fieldValue.trim().length < 3) {
            error = 'Description must be at least 3 characters'
          } else if (fieldValue.length > 200) {
            error = 'Description cannot exceed 200 characters'
          }
          break

        case 'currency':
          if (!fieldValue) {
            error = 'Please select a currency'
          }
          break
      }

      setErrors((prev) => ({ ...prev, [field]: error }))
      return !error
    },
    [formData]
  )

  const validateForm = (): boolean => {
    const fields: (keyof BillFormData)[] = [
      'totalAmount',
      'currency',
      'shares',
      'description',
    ]
    const isValid = fields.every((field) => validateField(field))

    // Mark all fields as touched for error display
    setFormTouched({
      totalAmount: true,
      currency: true,
      shares: true,
      description: true,
    })

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!isConnected) {
      setErrors({ totalAmount: 'Please connect your wallet to create bills' })
      return
    }

    if (!isOnline) {
      setErrors({
        totalAmount:
          'No internet connection. Please check your network and try again.',
      })
      return
    }

    try {
      // Create bill on blockchain
      const result = await createBill(formData, totalUSDT)

      if (result) {
        console.log('Bill created:', {
          billId: result.billId,
          txHash: result.txHash,
          formData,
          usdtAmount: totalUSDT,
        })

        // Don't reset form immediately - let user see success state
        // Form will be reset when success modal is closed or user navigates away
      }
    } catch (error) {
      console.error('Error creating bill:', error)

      // Handle specific error types
      let errorMessage = 'Failed to create bill. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user'
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction'
        } else if (error.message.includes('network')) {
          errorMessage =
            'Network error. Please check your connection and try again.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Transaction timeout. Please try again.'
        }
      }

      setErrors({ totalAmount: errorMessage })
    }
  }

  // Reset form when bill creation is successful and user wants to create another
  const handleCreateAnother = () => {
    setFormData({
      totalAmount: '',
      currency: 'NZD',
      shares: '',
      description: '',
    })
    resetBillCreation()
    setErrors({})
    setFormTouched({})
    setBillURL('')
  }

  const sharePrice =
    formData.totalAmount && formData.shares
      ? (parseFloat(formData.totalAmount) / parseInt(formData.shares)).toFixed(
          2
        )
      : '0.00'

  // Calculate USDT equivalents
  const totalUSDT = formData.totalAmount
    ? convertToUSDT(
        parseFloat(formData.totalAmount),
        formData.currency
      ).toFixed(2)
    : '0.00'

  const sharePriceUSDT =
    formData.totalAmount && formData.shares
      ? (
          convertToUSDT(parseFloat(formData.totalAmount), formData.currency) /
          parseInt(formData.shares)
        ).toFixed(2)
      : '0.00'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Bill
            </h1>
            <p className="text-gray-600">
              Split your bill among friends and collect payments in
              cryptocurrency
            </p>

            {/* Connection and Exchange Rate Status */}
            <div className="mt-4 space-y-2">
              {/* Network Status */}
              {!isOnline && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-4 w-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-red-600">
                      No internet connection - Bill creation unavailable
                    </span>
                  </div>
                </div>
              )}

              {/* Exchange Rate Status */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {exchangeLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">
                          Loading exchange rates...
                        </span>
                      </div>
                    ) : exchangeError ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-orange-600">
                          Using fallback rates
                        </span>
                        <button
                          onClick={refresh}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-green-600">
                        Exchange rates updated
                      </span>
                    )}
                  </div>
                  {lastUpdated && (
                    <span className="text-xs text-gray-500">
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 mb-3">
                Connect your wallet to create bills
              </p>
              <ConnectButton />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Total Amount */}
            <div>
              <label
                htmlFor="totalAmount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Total Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="totalAmount"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    handleInputChange('totalAmount', e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="100.00"
                  disabled={isCreatingBill}
                />
              </div>
              {errors.totalAmount && (
                <p
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.totalAmount}
                </p>
              )}
              {formData.totalAmount && parseFloat(formData.totalAmount) > 0 && (
                <p className="mt-1 text-sm text-blue-600">
                  ≈ {totalUSDT} USDT {exchangeLoading ? '(calculating...)' : ''}
                </p>
              )}
            </div>

            {/* Currency Selection */}
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isCreatingBill}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Shares */}
            <div>
              <label
                htmlFor="shares"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Number of Shares
              </label>
              <input
                type="number"
                id="shares"
                min="1"
                max="100"
                value={formData.shares}
                onChange={(e) => handleInputChange('shares', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.shares ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="4"
                disabled={isCreatingBill}
              />
              {errors.shares && (
                <p
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.shares}
                </p>
              )}
              {formData.shares && parseInt(formData.shares) > 0 && (
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">
                    Share price: {sharePrice} {formData.currency} per person
                  </p>
                  {formData.totalAmount && (
                    <p className="text-sm text-blue-600">
                      ≈ {sharePriceUSDT} USDT per person
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dinner at restaurant, groceries, etc."
                disabled={isCreatingBill}
              />
              {errors.description && (
                <p
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.description}
                </p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                {formData.description.length}/200 characters
              </div>
            </div>

            {/* Summary */}
            {formData.totalAmount && formData.shares && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Bill Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Currency */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 text-sm">
                      Original Amount
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Total: {formData.totalAmount} {formData.currency}
                      </p>
                      <p>Shares: {formData.shares} people</p>
                      <p>
                        Per person: {sharePrice} {formData.currency}
                      </p>
                    </div>
                  </div>

                  {/* USDT Conversion */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 text-sm flex items-center">
                      USDT Equivalent
                      {exchangeLoading && (
                        <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      )}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Total: {totalUSDT} USDT</p>
                      <p>Blockchain: Base Network</p>
                      <p>Per person: {sharePriceUSDT} USDT</p>
                    </div>
                  </div>
                </div>

                {exchangeError && (
                  <div className="mt-3 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    ⚠️ Using fallback exchange rates. Amounts may not be exact.
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreatingBill || !isConnected || !isOnline}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isCreatingBill || !isConnected || !isOnline
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : billCreated
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              aria-describedby={
                !isConnected
                  ? 'connect-wallet-error'
                  : !isOnline
                    ? 'network-error'
                    : undefined
              }
            >
              {isCreatingBill ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Bill on Blockchain...
                </span>
              ) : billCreated ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  Bill Created Successfully!
                </span>
              ) : !isConnected ? (
                'Connect Wallet to Create Bill'
              ) : !isOnline ? (
                'No Internet Connection'
              ) : (
                'Create Bill'
              )}
            </button>
          </form>

          {/* Success State */}
          {billCreated && billId && txHash && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-6">
                <svg
                  className="h-8 w-8 text-green-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <h3 className="text-2xl font-bold text-green-900">
                  Bill Created Successfully!
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Bill Details */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">
                      Bill Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Description:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {formData.description}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Total Amount:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {formData.totalAmount} {formData.currency}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Shares:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {formData.shares} people
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Per Person:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {sharePrice} {formData.currency} ({sharePriceUSDT}{' '}
                          USDT)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">
                      Blockchain Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Bill ID:
                        </span>
                        <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-700 text-xs">
                          {billId.slice(0, 10)}...{billId.slice(-8)}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Transaction:
                        </span>
                        <a
                          href={`https://basescan.org/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-green-600 hover:text-green-800 underline text-xs"
                        >
                          View on Basescan ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - QR Code and Sharing */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                    <h4 className="font-semibold text-green-800 mb-3">
                      Share This Bill
                    </h4>

                    {/* QR Code */}
                    <div className="mb-4">
                      {isGeneratingQR ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          <span className="ml-2 text-gray-600">
                            Generating QR Code...
                          </span>
                        </div>
                      ) : qrError ? (
                        <div className="h-64 flex items-center justify-center text-red-600">
                          <div className="text-center">
                            <svg
                              className="h-12 w-12 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            <p className="text-sm">
                              Failed to generate QR code
                            </p>
                          </div>
                        </div>
                      ) : qrCodeDataURL ? (
                        <div>
                          <img
                            src={qrCodeDataURL}
                            alt="Bill QR Code"
                            className="mx-auto rounded-lg shadow-sm border border-gray-200"
                            style={{ maxWidth: '200px', height: 'auto' }}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Scan with your phone to share this bill
                          </p>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <svg
                              className="h-12 w-12 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              ></path>
                            </svg>
                            <p className="text-sm">QR Code will appear here</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Share URL */}
                    <div className="mb-4">
                      <div className="bg-gray-50 p-3 rounded border text-left">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Bill URL:
                        </label>
                        <input
                          type="text"
                          value={billURL}
                          readOnly
                          className="w-full text-xs bg-transparent border-none outline-none text-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    const success = await copyToClipboard(billURL)
                    alert(
                      success
                        ? 'Bill URL copied to clipboard!'
                        : 'Failed to copy URL'
                    )
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                  </svg>
                  Copy URL
                </button>

                <button
                  onClick={async () => {
                    const shareText = generateShareText(
                      formData.totalAmount,
                      formData.currency,
                      formData.description,
                      billURL
                    )
                    const success = await shareURL(
                      billURL,
                      `UniSplit Bill: ${formData.description}`
                    )
                    if (!success) {
                      // Fallback: copy share text to clipboard
                      const fallbackSuccess = await copyToClipboard(shareText)
                      alert(
                        fallbackSuccess
                          ? 'Share text copied to clipboard!'
                          : 'Failed to share'
                      )
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    ></path>
                  </svg>
                  Share Bill
                </button>

                <button
                  onClick={handleCreateAnother}
                  className="px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                  Create Another Bill
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {billCreationError && billError && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center mb-4">
                <svg
                  className="h-8 w-8 text-red-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <h3 className="text-lg font-bold text-red-900">
                  Failed to Create Bill
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-red-700">{billError}</p>
                <button
                  onClick={resetBillCreation}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
