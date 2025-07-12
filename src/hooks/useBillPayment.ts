import { useState, useCallback } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import { parseUnits } from 'viem'
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
    shareCount: number,
    sharePrice: bigint
  ) => Promise<boolean>
  reset: () => void
  needsApproval: (sharePrice: bigint, shareCount: number) => boolean
  approve: () => Promise<boolean>
  allowance: bigint
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

  // Check current USDT allowance
  const { data: allowance = BigInt(0) } = useReadContract({
    address: CONTRACTS.USDT as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args:
      address && CONTRACTS.BILL_SPLITTER
        ? [address as `0x${string}`, CONTRACTS.BILL_SPLITTER as `0x${string}`]
        : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Wait for transaction confirmations
  const { isLoading: isPaymentConfirming, isSuccess: isPaymentConfirmed } =
    useWaitForTransactionReceipt({
      hash: paymentTxHash,
    })

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approvalTxHash,
    })

  // Approve USDT spending
  const approve = useCallback(async (): Promise<boolean> => {
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

      // Approve maximum amount for convenience
      const maxAmount = parseUnits('1000000', 6) // 1M USDT max approval

      writeApproval({
        address: CONTRACTS.USDT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BILL_SPLITTER as `0x${string}`, maxAmount],
      })

      return true
    } catch (error) {
      console.error('Error approving USDT:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isError: true,
        error:
          error instanceof Error ? error.message : 'Failed to approve USDT',
      }))
      return false
    }
  }, [address, writeApproval])

  // Pay bill
  const payBill = useCallback(
    async (
      billId: string,
      shareCount: number,
      sharePrice: bigint
    ): Promise<boolean> => {
      if (!address) {
        setState((prev) => ({
          ...prev,
          isError: true,
          error: 'Wallet not connected',
        }))
        return false
      }

      const totalAmount = sharePrice * BigInt(shareCount)

      // Check if approval is needed
      if (allowance < totalAmount) {
        setState((prev) => ({
          ...prev,
          isError: true,
          error:
            'Insufficient USDT allowance. Please approve USDT spending first.',
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
          args: [billId as `0x${string}`, shareCount],
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
    [address, allowance, writePayment]
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

  const isSuccess = isPaymentConfirmed || isApprovalConfirmed
  const isError = !!paymentError || !!approvalError || state.isError
  const error = paymentError?.message || approvalError?.message || state.error
  const needsApproval = (sharePrice: bigint, shareCount: number) => {
    const totalAmount = sharePrice * BigInt(shareCount)
    return allowance < totalAmount
  }

  return {
    isLoading,
    isSuccess,
    isError,
    error,
    txHash: paymentTxHash || approvalTxHash || state.txHash,
    payBill,
    reset,
    needsApproval: needsApproval,
    approve,
    allowance,
  }
}
