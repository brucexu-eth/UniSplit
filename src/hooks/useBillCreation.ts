import { useState, useCallback } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseUnits, encodePacked, keccak256 } from 'viem'
import { BILL_SPLITTER_V2_ABI } from '../contracts/BillSplitterV2'
import { CONTRACTS } from '../config/constants'

interface BillData {
  totalAmount: string
  currency: string
  shares: string
  creatorShares: string
  description: string
  tokenAddress: string
}

interface BillCreationState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  txHash: string | null
  billId: string | null
}

interface UseBillCreationResult extends BillCreationState {
  createBill: (
    billData: BillData,
    usdtAmount: string
  ) => Promise<{ billId: string; txHash: string } | null>
  reset: () => void
}

export function useBillCreation(): UseBillCreationResult {
  const { address } = useAccount()
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract()

  const [state, setState] = useState<BillCreationState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
    billId: null,
  })

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    })

  // Generate a unique bill ID
  const generateBillId = useCallback((): string => {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2)
    const creator = address || '0x0000000000000000000000000000000000000000'

    // Create a unique identifier using creator address, timestamp, and random string
    const data = encodePacked(
      ['address', 'uint256', 'string'],
      [creator as `0x${string}`, BigInt(timestamp), random]
    )

    return keccak256(data)
  }, [address])

  const createBill = useCallback(
    async (
      billData: BillData,
      usdtAmount: string
    ): Promise<{ billId: string; txHash: string } | null> => {
      if (!address) {
        setState((prev) => ({
          ...prev,
          isError: true,
          error: 'Wallet not connected',
        }))
        return null
      }

      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          isError: false,
          error: null,
          isSuccess: false,
        }))

        // Generate unique bill ID
        const billId = generateBillId()

        // Convert token amount to proper format (6 decimals for USDT/USDC)
        const sharePrice = parseUnits(
          (parseFloat(usdtAmount) / parseInt(billData.shares)).toFixed(6),
          6
        )

        // Call the smart contract with new parameters
        writeContract({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          abi: BILL_SPLITTER_V2_ABI,
          functionName: 'createBill',
          args: [
            billId as `0x${string}`,
            billData.tokenAddress as `0x${string}`,
            sharePrice,
            parseInt(billData.shares),
            parseInt(billData.creatorShares),
            billData.description.trim() || '', // Use empty string if no description
          ],
        })

        setState((prev) => ({
          ...prev,
          billId,
        }))

        // Return the bill ID - txHash will be available through the hook's state
        return { billId, txHash: '' } // txHash will be updated by wagmi
      } catch (error) {
        console.error('Error creating bill:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          error:
            error instanceof Error ? error.message : 'Failed to create bill',
        }))
        return null
      }
    },
    [address, generateBillId, writeContract]
  )

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
      billId: null,
    })
  }, [])

  // Update state based on transaction status
  const isLoading = isWritePending || isConfirming || state.isLoading
  const isSuccess = isConfirmed
  const isError = !!writeError || state.isError
  const error = writeError?.message || state.error

  return {
    isLoading,
    isSuccess,
    isError,
    error,
    txHash: txHash || state.txHash,
    billId: state.billId,
    createBill,
    reset,
  }
}
