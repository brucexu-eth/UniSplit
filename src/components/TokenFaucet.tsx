import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { CHAIN_ID, SUPPORTED_TOKENS, type SupportedToken } from '../config/constants'
import { ERC20_ABI } from '../contracts/erc20'

interface TokenBalanceProps {
  token: SupportedToken
  address: `0x${string}`
}

function TokenBalance({ token, address }: TokenBalanceProps) {
  const { data: balance = BigInt(0), refetch: refetchBalance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  })

  const balanceFormatted = Number(balance) / Math.pow(10, token.decimals)
  const hasEnoughTokens = balanceFormatted >= 1000

  return { balance: balanceFormatted, hasEnoughTokens, refetchBalance }
}

function TokenFaucetButton({ token, address }: TokenBalanceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const { balance, hasEnoughTokens, refetchBalance } = TokenBalance({ token, address })

  const handleFaucet = async () => {
    if (!address) return

    try {
      setIsLoading(true)
      setSuccess(false)

      await writeContract({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'faucet',
      })
    } catch (error) {
      console.error(`Error getting ${token.symbol} from faucet:`, error)
      setIsLoading(false)
    }
  }

  // Handle transaction confirmation
  if (isConfirmed && !success) {
    setSuccess(true)
    setIsLoading(false)
    refetchBalance()
  }

  if (hasEnoughTokens) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-green-800">
            {balance.toFixed(2)} {token.symbol}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-blue-900">
            {token.symbol} Testnet Faucet
          </h4>
          <p className="text-xs text-blue-700">
            Balance: {balance.toFixed(2)} {token.symbol}
          </p>
        </div>
        <button
          onClick={handleFaucet}
          disabled={isLoading || isPending || isConfirming}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading || isPending || isConfirming ? (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>Getting...</span>
            </div>
          ) : (
            `Get 1,000 ${token.symbol}`
          )}
        </button>
      </div>
      
      {success && (
        <div className="p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
          ✅ Success! You received 1,000 {token.symbol}
        </div>
      )}
      
      {writeError && (
        <div className="p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
          ❌ Error: {writeError.message}
        </div>
      )}
    </div>
  )
}

export default function TokenFaucet() {
  const { address, isConnected } = useAccount()
  const isTestnet = CHAIN_ID === 84532

  // Only show on testnet
  if (!isTestnet || !isConnected || !address) return null

  return (
    <div className="space-y-3 mb-4">
      <div className="text-sm font-medium text-gray-900 mb-2">
        Testnet Token Faucets
      </div>
      {SUPPORTED_TOKENS.map((token) => (
        <TokenFaucetButton 
          key={token.symbol} 
          token={token} 
          address={address}
        />
      ))}
    </div>
  )
}

// For backward compatibility, also export as USDTFaucet
export { TokenFaucet as USDTFaucet }