import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

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
  const [formData, setFormData] = useState<BillFormData>({
    totalAmount: '',
    currency: 'NZD',
    shares: '',
    description: '',
  })

  const [isLoading, setIsLoading] = useState(false)
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

    setIsLoading(true)
    try {
      // TODO: Implement smart contract integration
      console.log('Creating bill with data:', formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert('Bill created successfully!')

      // Reset form
      setFormData({
        totalAmount: '',
        currency: 'NZD',
        shares: '',
        description: '',
      })
    } catch (error) {
      console.error('Error creating bill:', error)
      alert('Failed to create bill. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sharePrice =
    formData.totalAmount && formData.shares
      ? (parseFloat(formData.totalAmount) / parseInt(formData.shares)).toFixed(
          2
        )
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
                  disabled={isLoading}
                />
              </div>
              {errors.totalAmount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.totalAmount}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              {errors.shares && (
                <p className="mt-1 text-sm text-red-600">{errors.shares}</p>
              )}
              {formData.shares && parseInt(formData.shares) > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  Share price: {sharePrice} {formData.currency} per person
                </p>
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
                disabled={isLoading}
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
                <h3 className="font-medium text-gray-900 mb-2">Bill Summary</h3>
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
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isConnected}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isLoading || !isConnected
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Bill...
                </span>
              ) : (
                'Create Bill'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
