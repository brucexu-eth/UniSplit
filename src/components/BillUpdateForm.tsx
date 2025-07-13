import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BillV2 } from '../contracts/BillSplitterV2'
import { useBillUpdates } from '../hooks/useBillUpdates'

interface BillUpdateFormProps {
  bill: BillV2
  billId: string
  onSuccess: () => void
  onCancel: () => void
}

interface UpdateFormData {
  sharePrice: string
  totalShares: string
  description: string
}

export default function BillUpdateForm({
  bill,
  billId,
  onSuccess,
  onCancel,
}: BillUpdateFormProps) {
  const { isConnected, address } = useAccount()
  const {
    updateBill,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  } = useBillUpdates()

  const [formData, setFormData] = useState<UpdateFormData>({
    sharePrice: (Number(bill.sharePrice) / 1e6).toFixed(6),
    totalShares: bill.totalShares.toString(),
    description: '', // Description not stored in V2 contract
  })

  const [errors, setErrors] = useState<Partial<UpdateFormData>>({})

  useEffect(() => {
    if (isSuccess) {
      onSuccess()
      reset()
    }
  }, [isSuccess, onSuccess, reset])

  const handleInputChange = (field: keyof UpdateFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateFormData> = {}

    // Validate share price
    const sharePrice = parseFloat(formData.sharePrice)
    if (!formData.sharePrice || isNaN(sharePrice) || sharePrice <= 0) {
      newErrors.sharePrice = 'Please enter a valid share price'
    } else if (sharePrice > 1000000) {
      newErrors.sharePrice = 'Share price cannot exceed 1,000,000'
    }

    // Validate total shares
    const totalShares = parseInt(formData.totalShares)
    if (!formData.totalShares || isNaN(totalShares) || totalShares <= 0) {
      newErrors.totalShares = 'Please enter a valid number of shares'
    } else if (totalShares > 100) {
      newErrors.totalShares = 'Total shares cannot exceed 100'
    } else if (totalShares < bill.paidShares) {
      newErrors.totalShares = `Cannot reduce below ${bill.paidShares} paid shares`
    }

    // Validate description (optional but if provided, must be valid)
    if (formData.description.trim() !== '') {
      if (formData.description.trim().length < 3) {
        newErrors.description = 'Description must be at least 3 characters'
      } else if (formData.description.length > 200) {
        newErrors.description = 'Description cannot exceed 200 characters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!isConnected || address !== bill.creator) {
      setErrors({ sharePrice: 'Only the bill creator can update this bill' })
      return
    }

    const success = await updateBill(
      billId,
      formData.sharePrice,
      parseInt(formData.totalShares),
      formData.description.trim()
    )

    if (!success && error) {
      setErrors({ sharePrice: error })
    }
  }

  // Check if user is the creator
  const isCreator = address === bill.creator

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Bill</h3>

      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Please connect your wallet to update this bill
          </p>
        </div>
      )}

      {isConnected && !isCreator && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Only the bill creator can update this bill
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Share Price */}
        <div>
          <label
            htmlFor="sharePrice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Share Price (USDT)
          </label>
          <input
            type="number"
            id="sharePrice"
            step="0.000001"
            min="0"
            value={formData.sharePrice}
            onChange={(e) => handleInputChange('sharePrice', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.sharePrice ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading || !isCreator}
          />
          {errors.sharePrice && (
            <p className="mt-1 text-sm text-red-600">{errors.sharePrice}</p>
          )}
        </div>

        {/* Total Shares */}
        <div>
          <label
            htmlFor="totalShares"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Shares
          </label>
          <input
            type="number"
            id="totalShares"
            min={bill.paidShares}
            max="100"
            value={formData.totalShares}
            onChange={(e) => handleInputChange('totalShares', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.totalShares ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading || !isCreator}
          />
          {errors.totalShares && (
            <p className="mt-1 text-sm text-red-600">{errors.totalShares}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Minimum: {bill.paidShares} (already paid shares)
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description <span className="text-gray-400 text-sm">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Update bill description (optional)"
            disabled={isLoading || !isCreator}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <div className="mt-1 text-xs text-gray-500">
            {formData.description.length}/200 characters
          </div>
        </div>

        {/* Summary */}
        {formData.sharePrice && formData.totalShares && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800 text-sm mb-2">
              Updated Bill Summary
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Total Amount: {
                  (parseFloat(formData.sharePrice) * parseInt(formData.totalShares)).toFixed(6)
                } USDT
              </p>
              <p>Shares: {formData.totalShares} people</p>
              <p>Per Person: {formData.sharePrice} USDT</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {isError && error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || !isCreator}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isLoading || !isCreator
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Updating...
              </span>
            ) : (
              'Update Bill'
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}