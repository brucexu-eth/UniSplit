import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'
import { WALLET_CONNECT_PROJECT_ID, APP_NAME } from './constants'

export const config = getDefaultConfig({
  appName: APP_NAME,
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [base],
  ssr: false,
})
