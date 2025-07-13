import { useState, useEffect, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { BillV2, BillStatus, BILL_SPLITTER_V2_ABI } from '../contracts/BillSplitterV2'
import { CONTRACTS } from '../config/constants'
import { parseAbiItem } from 'viem'
import { withRetry } from '../utils/retry'

export interface BillWithId extends BillV2 {
  billId: string
}

interface MyBillsState {
  bills: BillWithId[]
  isLoading: boolean
  error: string | null
}

interface MyBillsResult extends MyBillsState {
  refetch: () => void
}

// interface BillCreatedEvent {
//   billId: string
//   creator: string
//   token: string
//   sharePrice: bigint
//   totalShares: number
//   paidShares: number
//   description: string
//   blockNumber?: bigint
//   transactionHash?: string
// }

export function useMyBills(): MyBillsResult {
  const { address, isConnected } = useAccount()
  
  const [state, setState] = useState<MyBillsState>({
    bills: [],
    isLoading: false,
    error: null,
  })

  // This is a simplified approach - in a real app, you'd want to use event logs
  // or have a backend indexer to efficiently get bills by creator
  const publicClient = usePublicClient()

  const fetchMyBills = useCallback(async () => {
    if (!address || !isConnected || !publicClient) {
      setState({
        bills: [],
        isLoading: false,
        error: null,
      })
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('Fetching bills for creator:', address)
      console.log('Contract address:', CONTRACTS.BILL_SPLITTER)
      
      // Query BillCreated events where the creator is the current user with retry
      const logs = await withRetry(async () => {
        return await publicClient.getLogs({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          event: parseAbiItem('event BillCreated(bytes32 indexed billId, address indexed creator, address indexed token, uint256 sharePrice, uint8 totalShares, uint8 paidShares, string description)'),
          args: {
            creator: address as `0x${string}`
          },
          fromBlock: 'earliest',
          toBlock: 'latest'
        })
      })

      console.log('Found BillCreated events:', logs.length)
      
      if (logs.length === 0) {
        setState({
          bills: [],
          isLoading: false,
          error: null,
        })
        return
      }

      // For each bill ID found in events, fetch the current bill data from the contract
      const billPromises = logs.map(async (log) => {
        try {
          const billId = log.args.billId
          console.log('Fetching bill data for ID:', billId)
          
          // Read bill data from contract with retry
          const response = await withRetry(async () => {
            return await publicClient.readContract({
              address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
              abi: BILL_SPLITTER_V2_ABI,
              functionName: 'bills',
              args: [billId!]
            })
          })

          // Transform contract response to BillV2 format
          const billData = response as readonly [
            string, // creator
            string, // token
            bigint, // sharePrice
            number, // totalShares
            number, // paidShares
            number, // status
            bigint, // createdAt
          ]

          const transformedBill: BillWithId = {
            creator: billData[0],
            token: billData[1],
            sharePrice: billData[2],
            totalShares: billData[3],
            paidShares: billData[4],
            status: billData[5] as BillStatus,
            createdAt: billData[6],
            billId: billId as string
          }

          console.log('Transformed bill data:', transformedBill)
          return transformedBill
        } catch (error) {
          console.error('Error fetching bill data for ID:', log.args.billId, error)
          return null
        }
      })

      const billResults = await Promise.all(billPromises)
      const validBills = billResults.filter((bill): bill is BillWithId => bill !== null)
      
      console.log('Successfully fetched bills:', validBills.length)

      setState({
        bills: validBills,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetching my bills:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bills',
      }))
    }
  }, [address, isConnected, publicClient])

  const refetch = useCallback(() => {
    fetchMyBills()
  }, [fetchMyBills])

  useEffect(() => {
    fetchMyBills()
  }, [fetchMyBills])

  return {
    ...state,
    refetch,
  }
}

// Alternative implementation using a specific bill ID if you know it
export function useMyBillsByIds(billIds: string[]): MyBillsResult {
  const { address } = useAccount()
  const [state, setState] = useState<MyBillsState>({
    bills: [],
    isLoading: false,
    error: null,
  })

  const fetchBillsById = useCallback(async () => {
    if (!address || billIds.length === 0) {
      setState({
        bills: [],
        isLoading: false,
        error: null,
      })
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const bills: BillWithId[] = []
      
      // You would implement fetching multiple bills by their IDs here
      // For each billId in billIds, call the contract to get bill data
      // and filter by creator === address

      setState({
        bills,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetching bills by IDs:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bills',
      }))
    }
  }, [address, billIds])

  const refetch = useCallback(() => {
    fetchBillsById()
  }, [fetchBillsById])

  useEffect(() => {
    fetchBillsById()
  }, [fetchBillsById])

  return {
    ...state,
    refetch,
  }
}