import { useState, useEffect, useCallback } from 'react'
import { useReadContract } from 'wagmi'
import {
  BILL_SPLITTER_V2_ABI,
  BillV2,
  BillStatus,
} from '../contracts/BillSplitterV2'
import { CONTRACTS } from '../config/constants'

interface BillReadingState {
  bill: BillV2 | null
  isLoading: boolean
  error: string | null
  exists: boolean
}

interface UseBillReadingResult extends BillReadingState {
  refetch: () => void
}

export function useBillReading(
  billId: string | undefined
): UseBillReadingResult {
  const [state, setState] = useState<BillReadingState>({
    bill: null,
    isLoading: true,
    error: null,
    exists: false,
  })

  // Check if bill exists first
  const {
    data: billExists,
    isLoading: isCheckingExists,
    error: existsError,
    refetch: refetchExists,
  } = useReadContract({
    address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
    abi: BILL_SPLITTER_V2_ABI,
    functionName: 'isBillExists',
    args: billId ? [billId as `0x${string}`] : undefined,
    query: {
      enabled: !!billId,
    },
  })

  // Get bill data if it exists
  const {
    data: billData,
    isLoading: isLoadingBill,
    error: billError,
    refetch: refetchBill,
  } = useReadContract({
    address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
    abi: BILL_SPLITTER_V2_ABI,
    functionName: 'getBill',
    args: billId ? [billId as `0x${string}`] : undefined,
    query: {
      enabled: !!billId && !!billExists,
    },
  })

  // Update state based on contract read results
  useEffect(() => {
    if (!billId) {
      setState({
        bill: null,
        isLoading: false,
        error: 'No bill ID provided',
        exists: false,
      })
      return
    }

    // Handle existence check
    if (existsError) {
      setState({
        bill: null,
        isLoading: false,
        error: 'Failed to check if bill exists',
        exists: false,
      })
      return
    }

    if (!isCheckingExists && billExists === false) {
      setState({
        bill: null,
        isLoading: false,
        error: 'Bill not found',
        exists: false,
      })
      return
    }

    // Handle bill data loading
    if (billExists && billError) {
      setState({
        bill: null,
        isLoading: false,
        error: 'Failed to load bill data',
        exists: true,
      })
      return
    }

    if (billExists && billData) {
      // Transform the contract data to our BillV2 interface
      // billData is a tuple from the contract: [creator, sharePrice, totalShares, paidShares, status, createdAt, description]
      const bill = billData as unknown as readonly [
        string,
        bigint,
        number,
        number,
        number,
        bigint,
        string,
      ]
      const transformedBill: BillV2 = {
        creator: bill[0],
        token: bill[1],
        sharePrice: bill[2],
        totalShares: bill[3],
        paidShares: bill[4],
        status: bill[5] as BillStatus,
        createdAt: bill[6],
      }

      setState({
        bill: transformedBill,
        isLoading: false,
        error: null,
        exists: true,
      })
      return
    }

    // Set loading state
    setState((prev) => ({
      ...prev,
      isLoading: isCheckingExists || isLoadingBill,
    }))
  }, [
    billId,
    billExists,
    billData,
    isCheckingExists,
    isLoadingBill,
    existsError,
    billError,
  ])

  const refetch = useCallback(() => {
    refetchExists()
    if (billExists) {
      refetchBill()
    }
  }, [refetchExists, refetchBill, billExists])

  return {
    ...state,
    refetch,
  }
}
