import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { withRetry } from '../utils/retry'

// Create a dedicated Ethereum mainnet client for ENS resolution
const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

export function useENS(address: string | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resolveENS = async () => {
      if (!address) return

      setIsLoading(true)
      setError(null)
      
      try {
        console.log('Resolving ENS for address:', address)
        // Get ENS name for address using Ethereum mainnet with retry
        const ensName = await withRetry(async () => {
          return await ethereumClient.getEnsName({ 
            address: address as `0x${string}` 
          })
        })
        
        console.log('ENS resolved:', ensName)
        setEnsName(ensName)
      } catch (err) {
        console.error('Error resolving ENS:', err)
        setError(err instanceof Error ? err.message : 'Failed to resolve ENS')
        setEnsName(null)
      } finally {
        setIsLoading(false)
      }
    }

    resolveENS()
  }, [address])

  return {
    ensName,
    isLoading,
    error
  }
}

export function useMultipleENS(addresses: string[]) {
  const [ensNames, setEnsNames] = useState<Record<string, string | null>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resolveMultipleENS = async () => {
      if (!addresses.length) return

      setIsLoading(true)
      setError(null)
      
      try {
        console.log('Resolving ENS for multiple addresses:', addresses)
        const ensPromises = addresses.map(async (address) => {
          try {
            const ensName = await withRetry(async () => {
              return await ethereumClient.getEnsName({ 
                address: address as `0x${string}` 
              })
            })
            return { address, ensName }
          } catch {
            return { address, ensName: null }
          }
        })
        
        const results = await Promise.all(ensPromises)
        const ensMap = results.reduce((acc, result) => {
          acc[result.address] = result.ensName
          return acc
        }, {} as Record<string, string | null>)
        
        console.log('ENS results:', ensMap)
        setEnsNames(ensMap)
      } catch (err) {
        console.error('Error resolving multiple ENS:', err)
        setError(err instanceof Error ? err.message : 'Failed to resolve ENS names')
      } finally {
        setIsLoading(false)
      }
    }

    resolveMultipleENS()
  }, [addresses.join(',')])

  return {
    ensNames,
    isLoading,
    error
  }
}