import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { CONTRACTS, CHAIN_ID } from '../config/constants'
import { USDT_ABI } from '../contracts/usdt'

export default function USDTFaucet() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const isTestnet = CHAIN_ID === 84532

  // Only show on testnet
  if (!isTestnet || !isConnected) return null

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Check current USDT balance
  const { data: balance = BigInt(0), refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.USDT as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const balanceUSDT = Number(balance) / 1e6
  const hasEnoughUSDT = balanceUSDT >= 1000

  const handleFaucet = async () => {
    if (!address) return

    try {
      setIsLoading(true)
      setSuccess(false)

      await writeContract({
        address: CONTRACTS.USDT as `0x${string}`,
        abi: USDT_ABI,
        functionName: 'faucet',
      })
    } catch (error) {
      console.error('Error getting USDT from faucet:', error)
      setIsLoading(false)
    }
  }

  // Handle transaction confirmation
  if (isConfirmed && !success) {
    setSuccess(true)
    setIsLoading(false)
    refetchBalance()
  }

  if (hasEnoughUSDT) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-green-800">
            You have {balanceUSDT.toFixed(2)} USDT for testing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900">
            Need USDT for Testing?
          </h3>
          <p className="text-xs text-blue-700 mt-1">
            Get 1,000 USDT from the testnet faucet. Current balance: {balanceUSDT.toFixed(2)} USDT
          </p>
        </div>
        <button
          onClick={handleFaucet}
          disabled={isLoading || isPending || isConfirming}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading || isPending || isConfirming ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Getting USDT...</span>
            </div>
          ) : (
            'Get 1,000 USDT'
          )}
        </button>
      </div>
      
      {success && (
        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
          <p className="text-xs text-green-800">
            ✅ Success! You received 1,000 USDT for testing
          </p>
        </div>
      )}
      
      {writeError && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
          <p className="text-xs text-red-800">
            ❌ Error: {writeError.message}
          </p>
        </div>
      )}
    </div>
  )
}