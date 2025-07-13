import { useState, useCallback, useEffect } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { BILL_SPLITTER_V2_ABI } from '../contracts/BillSplitterV2'
import { CONTRACTS } from '../config/constants'
import { ERC20_ABI } from '../contracts/erc20'

interface PaymentState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  txHash: string | null
}

interface UseBillPaymentResult extends PaymentState {
  payBill: (
    billId: string,
    token: string,
    shareCount: number
  ) => Promise<boolean>
  reset: () => void
  needsApproval: (token: string, sharePrice: bigint, shareCount: number) => boolean
  approve: (token: string, amount: bigint) => Promise<boolean>
  getAllowance: (token: string) => bigint
  isApprovalConfirmed: boolean
  isPaymentConfirmed: boolean
}

export function useBillPayment(): UseBillPaymentResult {
  const { address } = useAccount()

  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
  })

  // Contract write hooks
  const {
    writeContract: writePayment,
    data: paymentTxHash,
    isPending: isPaymentPending,
    error: paymentError,
  } = useWriteContract()

  const {
    writeContract: writeApproval,
    data: approvalTxHash,
    isPending: isApprovalPending,
    error: approvalError,
  } = useWriteContract()

  // We'll handle allowance checks dynamically for each token
  const getAllowance = useCallback(
    (): bigint => {
      // This would ideally be a hook call, but we'll handle it in the component
      // For now, return 0 as we'll check in the component
      return BigInt(0)
    },
    []
  )

  // Wait for transaction confirmations
  const { isLoading: isPaymentConfirming, isSuccess: isPaymentConfirmed } =
    useWaitForTransactionReceipt({
      hash: paymentTxHash,
    })

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approvalTxHash,
    })

  // Reset loading state when approval is confirmed
  useEffect(() => {
    if (isApprovalConfirmed) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    }
  }, [isApprovalConfirmed])

  // Reset loading state when payment is confirmed
  useEffect(() => {
    if (isPaymentConfirmed) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    }
  }, [isPaymentConfirmed])

  // Approve token spending
  const approve = useCallback(
    async (token: string, amount: bigint): Promise<boolean> => {
      if (!address) {
        setState((prev) => ({
          ...prev,
          isError: true,
          error: 'Wallet not connected',
        }))
        return false
      }

      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          isError: false,
          error: null,
        }))

        // Approve exact amount needed for security
        writeApproval({
          address: token as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.BILL_SPLITTER as `0x${string}`, amount],
        })

        return true
      } catch (error) {
        console.error('Error approving token:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          error:
            error instanceof Error ? error.message : 'Failed to approve token',
        }))
        return false
      }
    },
    [address, writeApproval]
  )

  // Pay bill
  const payBill = useCallback(
    async (
      billId: string,
      token: string,
      shareCount: number
    ): Promise<boolean> => {
      if (!address) {
        setState((prev) => ({
          ...prev,
          isError: true,
          error: 'Wallet not connected',
        }))
        return false
      }

      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          isError: false,
          error: null,
        }))

        writePayment({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          abi: BILL_SPLITTER_V2_ABI,
          functionName: 'payBill',
          args: [billId as `0x${string}`, token as `0x${string}`, shareCount],
        })

        return true
      } catch (error) {
        console.error('Error paying bill:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Failed to pay bill',
        }))
        return false
      }
    },
    [address, writePayment]
  )

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
    })
  }, [])

  // Calculate derived state
  const isLoading =
    isPaymentPending ||
    isPaymentConfirming ||
    isApprovalPending ||
    isApprovalConfirming ||
    state.isLoading

  const isSuccess = isPaymentConfirmed // Only payment success, not approval
  const isError = !!paymentError || !!approvalError || state.isError
  const error = paymentError?.message || approvalError?.message || state.error
  const needsApproval = () => {
    // This will be handled in the component with proper allowance checking
    return true // Default to requiring approval check
  }

  return {
    isLoading,
    isSuccess,
    isError,
    error,
    txHash: paymentTxHash || approvalTxHash || state.txHash,
    payBill,
    reset,
    needsApproval,
    approve,
    getAllowance,
    isApprovalConfirmed,
    isPaymentConfirmed,
  }
}
