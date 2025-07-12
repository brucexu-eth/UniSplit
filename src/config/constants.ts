// Environment configuration
export const WALLET_CONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id'
export const BASE_RPC_URL =
  import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 8453

// Network-specific configurations
const isTestnet = CHAIN_ID === 84532
export const USDT_CONTRACT_ADDRESS =
  import.meta.env.VITE_USDT_CONTRACT_ADDRESS ||
  (isTestnet
    ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Mock USDT on Base Sepolia
    : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') // Real USDT on Base Mainnet

// App configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'UniSplit'
export const APP_DESCRIPTION =
  import.meta.env.VITE_APP_DESCRIPTION ||
  'Split bills effortlessly with cryptocurrency payments'

// Contract addresses
export const BILL_SPLITTER_CONTRACT_ADDRESS =
  import.meta.env.VITE_BILL_SPLITTER_CONTRACT_ADDRESS ||
  '0x1234567890123456789012345678901234567890' // Placeholder for development

export const CONTRACTS = {
  USDT: USDT_CONTRACT_ADDRESS,
  BILL_SPLITTER: BILL_SPLITTER_CONTRACT_ADDRESS,
} as const

// Network configuration
export const NETWORKS = {
  BASE_MAINNET: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const

// Current network based on CHAIN_ID
export const CURRENT_NETWORK = isTestnet
  ? NETWORKS.BASE_SEPOLIA
  : NETWORKS.BASE_MAINNET
