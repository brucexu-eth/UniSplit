import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { BillStatus } from '../contracts/BillSplitterV2'
import { useBillReading } from '../hooks/useBillReading'
import { useBillPayment } from '../hooks/useBillPayment'
import { useBillUpdates } from '../hooks/useBillUpdates'
import { useTokenAllowance } from '../hooks/useTokenAllowance'
import { useBillPayments } from '../hooks/useBillPayments'
import { useMultipleENS } from '../hooks/useENS'
import BillUpdateForm from '../components/BillUpdateForm'
import CreatorSelfPayment from '../components/CreatorSelfPayment'
import { getTokenDisplayName, formatTokenAmount } from '../utils/tokens'
import { CURRENT_NETWORK } from '../config/constants'

interface BillPaymentState {
  shareQuantity: number
  showUpdateForm: boolean
  paymentStep: 'approve' | 'pay' | 'complete'
}

interface BillPaymentErrors {
  billNotFound?: string
  networkError?: string
  contractError?: string
  paymentError?: string
}

export default function BillPayment() {
  const { billId } = useParams<{ billId: string }>()
  const { isConnected, address } = useAccount()

  // Use the bill reading hook
  const { bill, isLoading, error, refetch } = useBillReading(billId)

  // Use the bill payment hook
  const {
    payBill,
    approve,
    isLoading: isPaymentLoading,
    isSuccess: _isPaymentSuccess,
    isApprovalConfirmed,
    isPaymentConfirmed,
    error: paymentError,
    reset: resetPayment,
  } = useBillPayment()

  // Get token allowance
  const { allowance } = useTokenAllowance({
    token: bill?.token || '',
    owner: address,
    enabled: !!bill?.token && !!address,
  })

  // Use the bill updates hook
  const {
    closeBill,
    isLoading: isClosing,
    error: closeError,
  } = useBillUpdates()

  // Get bill payments
  const { 
    payments, 
    isLoading: isPaymentsLoading, 
    error: paymentsError 
  } = useBillPayments(billId, bill || undefined)

  // Get ENS names for all payers
  const payerAddresses = payments.map(p => p.payer)
  const { ensNames } = useMultipleENS(payerAddresses)

  const [state, setState] = useState<BillPaymentState>({
    shareQuantity: 1,
    showUpdateForm: false,
    paymentStep: 'approve',
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

  const handleShowUpdateForm = () => {
    setState((prev) => ({ ...prev, showUpdateForm: true }))
  }

  const handleHideUpdateForm = () => {
    setState((prev) => ({ ...prev, showUpdateForm: false }))
  }

  const handleUpdateSuccess = () => {
    handleHideUpdateForm()
    setTimeout(() => {
      refetch()
    }, 2000) // Wait for blockchain confirmation
  }

  const handleCloseBill = async () => {
    if (!bill || !billId) return
    
    const success = await closeBill(billId)
    if (success) {
      setTimeout(() => {
        refetch()
      }, 2000) // Wait for blockchain confirmation
    } else if (closeError) {
      setErrors((prev) => ({ ...prev, contractError: closeError }))
    }
  }

  const handleCreatorSelfPaymentSuccess = () => {
    setTimeout(() => {
      refetch()
    }, 2000) // Wait for blockchain confirmation
  }

  // Handle unified payment process
  const handlePaymentProcess = async () => {
    if (!bill || !billId) return

    const totalAmount = bill.sharePrice * BigInt(state.shareQuantity)
    const needsApproval = allowance < totalAmount

    if (needsApproval && state.paymentStep === 'approve') {
      // Step 1: Approve exact amount needed for security
      const success = await approve(bill.token, totalAmount)
      if (!success && paymentError) {
        setErrors((prev) => ({ ...prev, paymentError }))
      }
    } else {
      // Step 2: Pay
      const success = await payBill(billId, bill.token, state.shareQuantity)
      if (!success && paymentError) {
        setErrors((prev) => ({ ...prev, paymentError }))
      }
    }
  }

  // Calculate payment amounts
  const sharePrice = bill ? bill.sharePrice : BigInt(0)
  const totalPayment = sharePrice * BigInt(state.shareQuantity)
  const tokenSymbol = bill ? getTokenDisplayName(bill.token) : 'Token'
  const sharePriceFormatted = sharePrice && bill ? formatTokenAmount(sharePrice, bill.token, 2) : '0'
  const totalPaymentFormatted = totalPayment && bill ? formatTokenAmount(totalPayment, bill.token, 2) : '0'

  // Check if bill is available for payment
  const canPay =
    bill &&
    bill.status === BillStatus.Active &&
    bill.paidShares < bill.totalShares &&
    state.shareQuantity > 0 &&
    state.shareQuantity <= bill.totalShares - bill.paidShares

  // Check if approval is needed
  const totalAmount = bill ? bill.sharePrice * BigInt(state.shareQuantity) : BigInt(0)
  const requiresApproval = bill && allowance < totalAmount && !isApprovalConfirmed

  // Update payment step based on approval status
  if (isApprovalConfirmed && state.paymentStep === 'approve') {
    setState(prev => ({ ...prev, paymentStep: 'pay' }))
  }
  
  if (isPaymentConfirmed && state.paymentStep === 'pay') {
    setState(prev => ({ ...prev, paymentStep: 'complete' }))
    setTimeout(() => {
      refetch()
    }, 2000)
  }

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
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full mr-2 ${
                      bill.status === BillStatus.Active
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                  ></div>
                  <span
                    className={`font-medium ${
                      bill.status === BillStatus.Active
                        ? 'text-green-800'
                        : 'text-blue-800'
                    }`}
                  >
                    {bill.status === BillStatus.Active
                      ? 'Active - Accepting Payments'
                      : 'Closed - No Longer Accepting Payments'}
                  </span>
                </div>
              </div>

              {/* Bill Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Note: Description not available in V2 contract storage */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Share Price
                    </label>
                    <p className="text-xl font-semibold text-gray-900">
                      {sharePriceFormatted} {tokenSymbol}
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

            {/* Payment History - Always show container */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Payment History
              </h2>
              
              {isPaymentsLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Loading payment history...</span>
                </div>
              )}

              {paymentsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-red-800 text-sm">{paymentsError}</p>
                </div>
              )}

              {!isPaymentsLoading && (
                <>
                  {payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment, index) => {
                        const totalPaid = bill ? formatTokenAmount(payment.amount, bill.token, 2) : '0'
                        const ensName = ensNames[payment.payer]
                        const payerDisplay = ensName || (payment.payer.slice(0, 6) + '...' + payment.payer.slice(-4))
                        const txUrl = `${CURRENT_NETWORK.blockExplorer}/tx/${payment.transactionHash}`
                        
                        return (
                          <div key={`${payment.payer}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900">
                                    {payerDisplay}
                                  </p>
                                  {payment.isCreatorInitialPayment && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Creator
                                    </span>
                                  )}
                                </div>
                                {ensName && (
                                  <p className="text-xs text-gray-500 font-mono">
                                    {payment.payer.slice(0, 6) + '...' + payment.payer.slice(-4)}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm text-gray-600">
                                    {payment.sharesPaid} share{payment.sharesPaid !== 1 ? 's' : ''} paid
                                  </p>
                                  {!payment.isCreatorInitialPayment && (
                                    <a
                                      href={txUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                      title="View transaction"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Tx
                                    </a>
                                  )}
                                  {payment.isCreatorInitialPayment && (
                                    <span className="inline-flex items-center text-xs text-gray-500">
                                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                      </svg>
                                      Initial payment
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {totalPaid} {tokenSymbol}
                              </p>
                              <p className="text-sm text-gray-600">
                                {sharePriceFormatted} × {payment.sharesPaid}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>No payments yet</p>
                      <p className="text-sm mt-1">Payments will appear here once someone pays</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Creator Controls */}
            {address === bill.creator && bill.status === BillStatus.Active && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Creator Controls
                </h2>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={handleShowUpdateForm}
                    disabled={state.showUpdateForm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Update Bill
                  </button>
                  
                  <button
                    onClick={handleCloseBill}
                    disabled={isClosing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isClosing ? 'Closing...' : 'Close Bill'}
                  </button>
                </div>

                {closeError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <p className="text-red-800 text-sm">{closeError}</p>
                  </div>
                )}
                
                {state.showUpdateForm && billId && (
                  <BillUpdateForm
                    bill={bill}
                    billId={billId}
                    onSuccess={handleUpdateSuccess}
                    onCancel={handleHideUpdateForm}
                  />
                )}
              </div>
            )}

            {/* Creator Self-Payment */}
            {address === bill.creator && billId && (
              <CreatorSelfPayment
                bill={bill}
                billId={billId}
                onSuccess={handleCreatorSelfPaymentSuccess}
              />
            )}

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
                      <span>{sharePriceFormatted} {tokenSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span>{state.shareQuantity}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Total payment:</span>
                      <span className="text-lg">
                        {totalPaymentFormatted} {tokenSymbol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Single Payment Button */}
                <button
                  onClick={handlePaymentProcess}
                  disabled={!canPay || !isConnected || isPaymentLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    canPay && isConnected && !isPaymentLoading
                      ? requiresApproval && state.paymentStep === 'approve'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!isConnected
                    ? 'Connect Wallet to Pay'
                    : !canPay
                      ? 'Payment Not Available'
                      : isPaymentLoading
                        ? requiresApproval && state.paymentStep === 'approve'
                          ? `Approving ${tokenSymbol}...`
                          : 'Processing Payment...'
                        : requiresApproval && state.paymentStep === 'approve'
                          ? `Approve ${tokenSymbol} Spending`
                          : `Pay ${totalPaymentFormatted} ${tokenSymbol}`}
                </button>

                {/* Status Messages */}
                {isApprovalConfirmed && state.paymentStep === 'pay' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      {tokenSymbol} approval successful! Now you can proceed with payment.
                    </p>
                  </div>
                )}
                
                {isPaymentConfirmed && (
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
            {bill.status === BillStatus.Closed && bill.paidShares >= bill.totalShares && (
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
            {bill.status === BillStatus.Closed && bill.paidShares < bill.totalShares && (
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
