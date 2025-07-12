import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useCurrencyExchange } from '../hooks/useCurrencyExchange'
import { useBillCreation } from '../hooks/useBillCreation'

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

  const [formData, setFormData] = useState<BillFormData>({
    totalAmount: '',
    currency: 'NZD',
    shares: '',
    description: '',
  })

  const [errors, setErrors] = useState<Partial<BillFormData>>({})

  const handleInputChange = (field: keyof BillFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<BillFormData> = {}

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0'
    }

    if (!formData.shares || parseInt(formData.shares) <= 0) {
      newErrors.shares = 'Number of shares must be greater than 0'
    }

    if (parseInt(formData.shares) > 100) {
      newErrors.shares = 'Number of shares cannot exceed 100'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!isConnected) {
      alert('Please connect your wallet first')
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

            {/* Exchange Rate Status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
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
                <p className="mt-1 text-sm text-red-600">
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
                <p className="mt-1 text-sm text-red-600">{errors.shares}</p>
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
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
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
              disabled={isCreatingBill || !isConnected}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isCreatingBill || !isConnected
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : billCreated
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
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
              ) : (
                'Create Bill'
              )}
            </button>
          </form>

          {/* Success State */}
          {billCreated && billId && txHash && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-4">
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
                <h3 className="text-lg font-bold text-green-900">
                  Bill Created Successfully!
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-green-800">Bill ID:</span>
                  <code className="ml-2 px-2 py-1 bg-green-100 rounded text-green-700">
                    {billId.slice(0, 10)}...{billId.slice(-8)}
                  </code>
                </div>
                <div>
                  <span className="font-medium text-green-800">
                    Transaction:
                  </span>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-green-600 hover:text-green-800 underline"
                  >
                    View on Basescan
                  </a>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleCreateAnother}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Another Bill
                  </button>
                  <button
                    onClick={() => {
                      const billUrl = `${window.location.origin}/bill/${billId}`
                      navigator.clipboard.writeText(billUrl)
                      alert('Bill URL copied to clipboard!')
                    }}
                    className="px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Copy Bill URL
                  </button>
                </div>
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
