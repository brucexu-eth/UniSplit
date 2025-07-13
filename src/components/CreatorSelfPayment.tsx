import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BillV2, BillStatus } from '../contracts/BillSplitterV2'
import { useBillPayment } from '../hooks/useBillPayment'

interface CreatorSelfPaymentProps {
  bill: BillV2
  billId: string
  onSuccess: () => void
}

export default function CreatorSelfPayment({
  bill,
  billId,
  onSuccess,
}: CreatorSelfPaymentProps) {
  const { isConnected, address } = useAccount()
  const {
    payBill,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  } = useBillPayment()

  const [shareCount, setShareCount] = useState(1)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isSuccess) {
      onSuccess()
      reset()
    }
  }, [isSuccess, onSuccess, reset])

  const handleShareCountChange = (count: number) => {
    setShareCount(count)
    setLocalError(null)
  }

  const handleSelfPayment = async () => {
    if (!isConnected || address !== bill.creator) {
      setLocalError('Only the bill creator can mark shares as self-paid')
      return
    }

    if (bill.status !== BillStatus.Active) {
      setLocalError('Bill is not active')
      return
    }

    if (shareCount <= 0 || shareCount > (bill.totalShares - bill.paidShares)) {
      setLocalError(`Invalid share count. Available: ${bill.totalShares - bill.paidShares} shares`)
      return
    }

    const success = await payBill(billId as `0x${string}`, bill.token as `0x${string}`, shareCount)
    if (!success && error) {
      setLocalError(error)
    }
  }

  // Check if user is the creator
  const isCreator = address === bill.creator
  const remainingShares = bill.totalShares - bill.paidShares
  const canSelfPay = isCreator && bill.status === BillStatus.Active && remainingShares > 0

  if (!canSelfPay) {
    return null
  }

  const sharePrice = Number(bill.sharePrice) / 1e6
  const totalAmount = sharePrice * shareCount

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
        <svg
          className="h-5 w-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Creator Self-Payment
      </h3>
      
      <p className="text-blue-800 text-sm mb-4">
        As the bill creator, you can mark shares as paid by yourself without transferring tokens.
      </p>

      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Please connect your wallet to mark self-payment
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Share Count Input */}
        <div>
          <label
            htmlFor="selfPayShareCount"
            className="block text-sm font-medium text-blue-700 mb-1"
          >
            Number of Shares to Mark as Paid
          </label>
          <input
            type="number"
            id="selfPayShareCount"
            min="1"
            max={remainingShares}
            value={shareCount}
            onChange={(e) => handleShareCountChange(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || !isCreator}
          />
          <p className="mt-1 text-xs text-blue-600">
            Available shares: {remainingShares}
          </p>
        </div>

        {/* Amount Summary */}
        <div className="bg-white p-3 rounded border border-blue-200">
          <h4 className="font-medium text-blue-800 text-sm mb-2">Self-Payment Summary</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>Shares: {shareCount}</p>
            <p>Amount per share: {sharePrice.toFixed(6)} USDT</p>
            <p className="font-medium">Total amount: {totalAmount.toFixed(6)} USDT</p>
            <p className="text-xs text-blue-600">
              (No actual token transfer required)
            </p>
          </div>
        </div>

        {/* Error Display */}
        {(isError || localError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error || localError}</p>
          </div>
        )}

        {/* Self-Payment Button */}
        <button
          onClick={handleSelfPayment}
          disabled={isLoading || !isCreator || shareCount <= 0 || shareCount > remainingShares}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isLoading || !isCreator || shareCount <= 0 || shareCount > remainingShares
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
              Processing...
            </span>
          ) : (
            `Mark ${shareCount} Share${shareCount > 1 ? 's' : ''} as Self-Paid`
          )}
        </button>
      </div>
    </div>
  )
}