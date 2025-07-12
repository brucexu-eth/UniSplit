import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { CURRENT_NETWORK } from '../config/constants'

export default function NetworkStatus() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  if (!isConnected) return null

  const isCorrectNetwork = chainId === CURRENT_NETWORK.id
  const currentChain = chainId === base.id ? base : chainId === baseSepolia.id ? baseSepolia : null
  const expectedChain = CURRENT_NETWORK.id === base.id ? base : baseSepolia

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
        <span>Connected to {currentChain?.name}</span>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Wrong Network
            </p>
            <p className="text-xs text-yellow-600">
              Please switch to {expectedChain.name} to continue
            </p>
          </div>
        </div>
        <button
          onClick={() => switchChain({ chainId: expectedChain.id })}
          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
        >
          Switch to {expectedChain.name}
        </button>
      </div>
    </div>
  )
}