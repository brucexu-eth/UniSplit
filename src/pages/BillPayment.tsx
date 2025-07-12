import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { BillStatus } from '../contracts/BillSplitter'
import { useBillReading } from '../hooks/useBillReading'
import { useBillPayment } from '../hooks/useBillPayment'

interface BillPaymentState {
  shareQuantity: number
}

interface BillPaymentErrors {
  billNotFound?: string
  networkError?: string
  contractError?: string
  paymentError?: string
}

export default function BillPayment() {
  const { billId } = useParams<{ billId: string }>()
  const { isConnected } = useAccount()

  // Use the bill reading hook
  const { bill, isLoading, error, refetch } = useBillReading(billId)

  // Use the bill payment hook
  const {
    payBill,
    approve,
    needsApproval,
    allowance,
    isLoading: isPaymentLoading,
    isSuccess: isPaymentSuccess,
    isError: isPaymentError,
    error: paymentError,
    reset: resetPayment,
  } = useBillPayment()

  const [state, setState] = useState<BillPaymentState>({
    shareQuantity: 1,
  })

  const [errors, setErrors] = useState<BillPaymentErrors>({})

  // Clear errors when user actions change
  const clearError = (errorType: keyof BillPaymentErrors) => {
    setErrors((prev) => ({ ...prev, [errorType]: undefined }))
  }

  const handleShareQuantityChange = (quantity: number) => {
    setState((prev) => ({ ...prev, shareQuantity: quantity }))
    clearError('paymentError')
    resetPayment() // Reset payment state when quantity changes
  }

  // Handle payment approval
  const handleApprove = async () => {
    if (!bill) return

    const success = await approve()
    if (!success && paymentError) {
      setErrors((prev) => ({ ...prev, paymentError }))
    }
  }

  // Handle payment
  const handlePayment = async () => {
    if (!bill || !billId) return

    const success = await payBill(billId, state.shareQuantity, bill.sharePrice)
    if (!success && paymentError) {
      setErrors((prev) => ({ ...prev, paymentError }))
    } else if (success) {
      // Refresh bill data after successful payment
      setTimeout(() => {
        refetch()
      }, 2000) // Wait a bit for blockchain confirmation
    }
  }

  // Calculate payment amounts
  const sharePrice = bill ? bill.sharePrice : BigInt(0)
  const totalPayment = sharePrice * BigInt(state.shareQuantity)
  const sharePriceUSDT = sharePrice ? Number(sharePrice) / 1e6 : 0 // Convert from 6 decimal USDT
  const totalPaymentUSDT = totalPayment ? Number(totalPayment) / 1e6 : 0

  // Check if bill is available for payment
  const canPay =
    bill &&
    bill.status === BillStatus.Active &&
    bill.paidShares < bill.totalShares &&
    state.shareQuantity > 0 &&
    state.shareQuantity <= bill.totalShares - bill.paidShares

  // Check if approval is needed
  const requiresApproval =
    bill && needsApproval(bill.sharePrice, state.shareQuantity)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pay Your Share</h1>
          <p className="text-gray-600 mt-2">
            {billId
              ? `Bill ID: ${billId.slice(0, 8)}...${billId.slice(-6)}`
              : 'Loading bill details...'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600">
                Loading bill details...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <svg
                className="h-16 w-16 text-red-500 mx-auto mb-4"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to Load Bill
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Bill Content */}
        {bill && !isLoading && (
          <div className="space-y-6">
            {/* Bill Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Bill Information
              </h2>

              {/* Bill Status Banner */}
              <div
                className={`p-3 rounded-lg mb-4 ${
                  bill.status === BillStatus.Active
                    ? 'bg-green-50 border border-green-200'
                    : bill.status === BillStatus.Settled
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full mr-2 ${
                      bill.status === BillStatus.Active
                        ? 'bg-green-500'
                        : bill.status === BillStatus.Settled
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                    }`}
                  ></div>
                  <span
                    className={`font-medium ${
                      bill.status === BillStatus.Active
                        ? 'text-green-800'
                        : bill.status === BillStatus.Settled
                          ? 'text-blue-800'
                          : 'text-red-800'
                    }`}
                  >
                    {bill.status === BillStatus.Active
                      ? 'Active - Accepting Payments'
                      : bill.status === BillStatus.Settled
                        ? 'Settled - Fully Paid'
                        : 'Cancelled'}
                  </span>
                </div>
              </div>

              {/* Bill Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <p className="text-gray-900">{bill.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Share Price
                    </label>
                    <p className="text-xl font-semibold text-gray-900">
                      {sharePriceUSDT.toFixed(2)} USDT
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Shares Progress
                    </label>
                    <div className="mt-1">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{bill.paidShares} paid</span>
                        <span>{bill.totalShares} total</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(bill.paidShares / bill.totalShares) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Remaining Shares
                    </label>
                    <p className="text-lg font-medium text-gray-900">
                      {bill.totalShares - bill.paidShares} available
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            {bill.status === BillStatus.Active && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Make Payment
                </h2>

                {!isConnected && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 mb-3">
                      Connect your wallet to pay your share
                    </p>
                    <ConnectButton />
                  </div>
                )}

                {/* Share Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Shares to Pay
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() =>
                        handleShareQuantityChange(
                          Math.max(1, state.shareQuantity - 1)
                        )
                      }
                      disabled={state.shareQuantity <= 1}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={bill.totalShares - bill.paidShares}
                      value={state.shareQuantity}
                      onChange={(e) =>
                        handleShareQuantityChange(parseInt(e.target.value) || 1)
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() =>
                        handleShareQuantityChange(
                          Math.min(
                            bill.totalShares - bill.paidShares,
                            state.shareQuantity + 1
                          )
                        )
                      }
                      disabled={
                        state.shareQuantity >=
                        bill.totalShares - bill.paidShares
                      }
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  {state.shareQuantity > 1 && (
                    <p className="mt-2 text-sm text-gray-600">
                      You're paying for {state.shareQuantity} people (proxy
                      payment)
                    </p>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Payment Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Share price:</span>
                      <span>{sharePriceUSDT.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span>{state.shareQuantity}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Total payment:</span>
                      <span className="text-lg">
                        {totalPaymentUSDT.toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Buttons */}
                {requiresApproval && isConnected && canPay && (
                  <button
                    onClick={handleApprove}
                    disabled={isPaymentLoading}
                    className="w-full py-3 px-6 rounded-lg font-medium transition-colors bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {isPaymentLoading
                      ? 'Approving...'
                      : 'Approve USDT Spending'}
                  </button>
                )}

                <button
                  onClick={requiresApproval ? handleApprove : handlePayment}
                  disabled={!canPay || !isConnected || isPaymentLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    canPay && isConnected && !isPaymentLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!isConnected
                    ? 'Connect Wallet to Pay'
                    : !canPay
                      ? 'Payment Not Available'
                      : isPaymentLoading
                        ? requiresApproval
                          ? 'Approving...'
                          : 'Processing Payment...'
                        : requiresApproval
                          ? 'Approve USDT First'
                          : `Pay ${totalPaymentUSDT.toFixed(2)} USDT`}
                </button>

                {/* Success Message */}
                {isPaymentSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      Payment successful! The bill data will update shortly.
                    </p>
                  </div>
                )}

                {errors.paymentError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">
                      {errors.paymentError}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bill Settled Message */}
            {bill.status === BillStatus.Settled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <svg
                  className="h-12 w-12 text-blue-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Bill Fully Paid
                </h3>
                <p className="text-blue-700">
                  This bill has been fully paid and settled. No further payments
                  are needed.
                </p>
              </div>
            )}

            {/* Bill Cancelled Message */}
            {bill.status === BillStatus.Cancelled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <svg
                  className="h-12 w-12 text-red-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Bill Cancelled
                </h3>
                <p className="text-red-700">
                  This bill has been cancelled by the organizer. No payments can
                  be made.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
