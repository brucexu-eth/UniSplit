// Environment configuration
export const WALLET_CONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id'
export const BASE_RPC_URL =
  import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 8453
export const USDT_CONTRACT_ADDRESS =
  import.meta.env.VITE_USDT_CONTRACT_ADDRESS ||
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// App configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'UniSplit'
export const APP_DESCRIPTION =
  import.meta.env.VITE_APP_DESCRIPTION ||
  'Split bills effortlessly with cryptocurrency payments'

// Contract addresses
export const CONTRACTS = {
  USDT: USDT_CONTRACT_ADDRESS,
} as const

// Network configuration
export const NETWORKS = {
  BASE: {
    id: CHAIN_ID,
    name: 'Base',
    rpcUrl: BASE_RPC_URL,
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const
