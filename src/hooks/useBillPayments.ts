import { useState, useEffect, useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { parseAbiItem } from 'viem'
import { CONTRACTS } from '../config/constants'
import { BillV2 } from '../contracts/BillSplitterV2'
import { withRetry } from '../utils/retry'

export interface PaymentRecord {
  payer: string
  sharesPaid: number
  amount: bigint
  transactionHash: string
  blockNumber: bigint
  timestamp?: number
  isCreatorInitialPayment?: boolean
}

export function useBillPayments(billId: string | undefined, bill?: BillV2, enableRealtime = true) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const publicClient = usePublicClient()

  const fetchPayments = async () => {
    if (!billId || !publicClient) return

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Fetching payments for bill:', billId)
      
      // Get PaymentMade events for this bill with retry
      const logs = await withRetry(async () => {
        return await publicClient.getLogs({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          event: parseAbiItem('event PaymentMade(bytes32 indexed billId, address indexed payer, uint8 sharesPaid, uint256 amount)'),
          args: { 
            billId: billId as `0x${string}` 
          },
          fromBlock: 'earliest',
          toBlock: 'latest'
        })
      })

      console.log('Found payment logs:', logs.length)

      // Process the logs to extract payment data
      const paymentRecords: PaymentRecord[] = logs.map(log => {
        const { payer, sharesPaid, amount } = log.args
        return {
          payer: payer as string,
          sharesPaid: Number(sharesPaid),
          amount: amount as bigint,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          isCreatorInitialPayment: false
        }
      })

      // If bill data is available and creator has paid shares at creation time, add that as a separate record
      if (bill && bill.paidShares > 0) {
        // Get BillCreated event to find when bill was created and get creator info with retry
        const creationLogs = await withRetry(async () => {
          return await publicClient.getLogs({
            address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
            event: parseAbiItem('event BillCreated(bytes32 indexed billId, address indexed creator, address indexed token, uint256 sharePrice, uint8 totalShares, uint8 paidShares, string description)'),
            args: { 
              billId: billId as `0x${string}` 
            },
            fromBlock: 'earliest',
            toBlock: 'latest'
          })
        })

        if (creationLogs.length > 0) {
          const creationLog = creationLogs[0]
          if (!creationLog) return
          const { creator, paidShares: initialPaidShares } = creationLog.args
          
          // Calculate how many shares the creator paid vs. what was paid via PaymentMade events
          const creatorEventPayments = paymentRecords
            .filter(p => p.payer.toLowerCase() === (creator as string).toLowerCase())
            .reduce((sum, p) => sum + p.sharesPaid, 0)
          
          const creatorInitialShares = Number(initialPaidShares) - creatorEventPayments
          
          if (creatorInitialShares > 0) {
            // Add creator's initial payment
            const creatorInitialPayment: PaymentRecord = {
              payer: creator as string,
              sharesPaid: creatorInitialShares,
              amount: bill.sharePrice * BigInt(creatorInitialShares),
              transactionHash: creationLog.transactionHash,
              blockNumber: creationLog.blockNumber,
              isCreatorInitialPayment: true
            }
            paymentRecords.push(creatorInitialPayment)
          }
        }
      }

      // Group payments by payer and sum up their contributions
      const payerMap = new Map<string, PaymentRecord>()
      
      paymentRecords.forEach(payment => {
        const existing = payerMap.get(payment.payer)
        if (existing) {
          // Aggregate payments from the same payer
          existing.sharesPaid += payment.sharesPaid
          existing.amount += payment.amount
          // Keep the latest transaction details (prefer non-creation transactions)
          if (!existing.isCreatorInitialPayment && payment.isCreatorInitialPayment) {
            // Keep existing (non-creation) transaction details
          } else if (existing.isCreatorInitialPayment && !payment.isCreatorInitialPayment) {
            // Update to non-creation transaction details
            existing.transactionHash = payment.transactionHash
            existing.blockNumber = payment.blockNumber
            existing.isCreatorInitialPayment = false
          } else if (payment.blockNumber > existing.blockNumber) {
            // Update to latest transaction
            existing.transactionHash = payment.transactionHash
            existing.blockNumber = payment.blockNumber
            existing.isCreatorInitialPayment = payment.isCreatorInitialPayment ?? false
          }
        } else {
          payerMap.set(payment.payer, { ...payment })
        }
      })

      const aggregatedPayments = Array.from(payerMap.values())
      console.log('Aggregated payments with creator initial:', aggregatedPayments)
      
      setPayments(aggregatedPayments)
    } catch (err) {
      console.error('Error fetching bill payments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle new payment events in real-time
  const handleNewPayment = useCallback((log: any) => {
    console.log('New payment event detected:', log)
    
    const { payer, sharesPaid, amount } = log.args
    const newPayment: PaymentRecord = {
      payer: payer as string,
      sharesPaid: Number(sharesPaid),
      amount: amount as bigint,
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      isCreatorInitialPayment: false
    }

    setPayments(prevPayments => {
      // Check if this payment already exists (by transaction hash)
      const existingIndex = prevPayments.findIndex(p => p.transactionHash === newPayment.transactionHash)
      if (existingIndex !== -1) {
        return prevPayments // Payment already exists, don't add duplicate
      }

      // Check if this payer already has other payments
      const existingPayerIndex = prevPayments.findIndex(p => p.payer.toLowerCase() === newPayment.payer.toLowerCase())
      
      if (existingPayerIndex !== -1) {
        // Update existing payer's aggregated payment
        const updatedPayments = [...prevPayments]
        const existingPayment = updatedPayments[existingPayerIndex]
        
        if (existingPayment) {
          updatedPayments[existingPayerIndex] = {
            ...existingPayment,
            sharesPaid: existingPayment.sharesPaid + newPayment.sharesPaid,
            amount: existingPayment.amount + newPayment.amount,
            transactionHash: newPayment.transactionHash, // Use latest transaction
            blockNumber: newPayment.blockNumber,
            isCreatorInitialPayment: false // Latest transaction takes precedence
          }
        }
        
        return updatedPayments
      } else {
        // Add new payer
        return [...prevPayments, newPayment]
      }
    })
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [billId, bill, publicClient])

  // Set up real-time event listening
  useEffect(() => {
    if (!billId || !publicClient || !enableRealtime) return

    let unwatch: (() => void) | undefined

    const setupWatcher = async () => {
      try {
        console.log('Setting up real-time payment watcher for bill:', billId)
        
        unwatch = publicClient.watchEvent({
          address: CONTRACTS.BILL_SPLITTER as `0x${string}`,
          event: parseAbiItem('event PaymentMade(bytes32 indexed billId, address indexed payer, uint8 sharesPaid, uint256 amount)'),
          args: { 
            billId: billId as `0x${string}` 
          },
          onLogs: (logs) => {
            logs.forEach(log => {
              handleNewPayment(log)
            })
          }
        })
      } catch (error) {
        console.error('Failed to set up payment watcher:', error)
      }
    }

    setupWatcher()

    return () => {
      if (unwatch) {
        console.log('Cleaning up payment watcher')
        unwatch()
      }
    }
  }, [billId, publicClient, enableRealtime, handleNewPayment])

  return {
    payments,
    isLoading,
    error,
    refetch: fetchPayments
  }
}