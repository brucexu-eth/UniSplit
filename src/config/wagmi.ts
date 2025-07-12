import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { WALLET_CONNECT_PROJECT_ID, APP_NAME, CHAIN_ID } from './constants'

export const config = getDefaultConfig({
  appName: APP_NAME,
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: CHAIN_ID === 84532 ? [baseSepolia, base] : [base, baseSepolia],
  ssr: false,
})
