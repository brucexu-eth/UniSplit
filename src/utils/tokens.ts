import { SUPPORTED_TOKENS, type SupportedToken } from '../config/constants'

/**
 * Get token info by address
 */
export function getTokenByAddress(address: string): SupportedToken | null {
  return SUPPORTED_TOKENS.find(token => 
    token.address.toLowerCase() === address.toLowerCase()
  ) || null
}

/**
 * Get token symbol by address
 */
export function getTokenSymbol(address: string): string {
  const token = getTokenByAddress(address)
  return token?.symbol || 'Unknown Token'
}

/**
 * Get token name by address
 */
export function getTokenName(address: string): string {
  const token = getTokenByAddress(address)
  return token?.name || 'Unknown Token'
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: bigint, tokenAddress: string, displayDecimals: number = 6): string {
  const token = getTokenByAddress(tokenAddress)
  const tokenDecimals = token?.decimals || 6 // Default to 6 for USDC/USDT
  
  const divisor = BigInt(10 ** tokenDecimals)
  const quotient = amount / divisor
  const remainder = amount % divisor
  
  if (remainder === BigInt(0)) {
    return quotient.toString()
  }
  
  // Convert remainder to decimal with token's full precision
  const decimalPart = remainder.toString().padStart(tokenDecimals, '0')
  
  // Limit to display decimals and remove trailing zeros
  const limitedDecimal = decimalPart.slice(0, displayDecimals).replace(/0+$/, '')
  
  if (limitedDecimal === '') {
    return quotient.toString()
  }
  
  return `${quotient}.${limitedDecimal}`
}

/**
 * Get the display name for a token (symbol or name based on preference)
 */
export function getTokenDisplayName(address: string, useFullName = false): string {
  const token = getTokenByAddress(address)
  if (!token) return 'Unknown Token'
  
  return useFullName ? token.name : token.symbol
}