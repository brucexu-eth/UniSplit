import { useState, useCallback } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseUnits } from 'viem'
import { BILL_SPLITTER_V2_ABI } from '../contracts/BillSplitterV2'
import { CONTRACTS } from '../config/constants'

interface UpdateState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  txHash: string | null
}

interface UseBillUpdatesResult extends UpdateState {
  updateBill: (
    billId: string,
    newSharePrice: string,
    newTotalShares: number,
    newDescription: string
  ) => Promise<boolean>
  creatorSelfPayment: (billId: string, shareCount: number) => Promise<boolean>
  closeBill: (billId: string) => Promise<boolean>
  reset: () => void
}

export function useBillUpdates(): UseBillUpdatesResult {
  const { address } = useAccount()

  const [state, setState] = useState<UpdateState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
  })

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    })

  const updateBill = useCallback(
    async (
      billId: string,
      newSharePrice: string,
      newTotalShares: number,
      newDescription: string
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

        // Convert share price to proper format (6 decimals for USDT)
        const sharePriceBigInt = parseUnits(parseFloat(newSharePrice).toFixed(6), 6)

        writeContract({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          abi: BILL_SPLITTER_V2_ABI,
          functionName: 'updateBill',
          args: [
            billId as `0x${string}`,
            sharePriceBigInt,
            newTotalShares,
            newDescription,
          ],
        })

        return true
      } catch (error) {
        console.error('Error updating bill:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Failed to update bill',
        }))
        return false
      }
    },
    [address, writeContract]
  )

  const creatorSelfPayment = useCallback(
    async (billId: string, shareCount: number): Promise<boolean> => {
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

        writeContract({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          abi: BILL_SPLITTER_V2_ABI,
          functionName: 'creatorSelfPayment',
          args: [billId as `0x${string}`, shareCount],
        })

        return true
      } catch (error) {
        console.error('Error with creator self payment:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to process self payment',
        }))
        return false
      }
    },
    [address, writeContract]
  )

  const closeBill = useCallback(
    async (billId: string): Promise<boolean> => {
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

        writeContract({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          abi: BILL_SPLITTER_V2_ABI,
          functionName: 'closeBill',
          args: [billId as `0x${string}`],
        })

        return true
      } catch (error) {
        console.error('Error closing bill:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Failed to close bill',
        }))
        return false
      }
    },
    [address, writeContract]
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
  const isLoading = isPending || isConfirming || state.isLoading
  const isSuccess = isConfirmed
  const isError = !!writeError || state.isError
  const error = writeError?.message || state.error

  return {
    isLoading,
    isSuccess,
    isError,
    error,
    txHash: txHash || state.txHash,
    updateBill,
    creatorSelfPayment,
    closeBill,
    reset,
  }
}