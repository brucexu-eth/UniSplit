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
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const quotient = amount / divisor
  const remainder = amount % divisor
  
  if (remainder === BigInt(0)) {
    return quotient.toString()
  }
  
  // Convert remainder to decimal
  const decimalPart = remainder.toString().padStart(decimals, '0')
  // Remove trailing zeros
  const trimmedDecimal = decimalPart.replace(/0+$/, '')
  
  if (trimmedDecimal === '') {
    return quotient.toString()
  }
  
  return `${quotient}.${trimmedDecimal}`
}

/**
 * Get the display name for a token (symbol or name based on preference)
 */
export function getTokenDisplayName(address: string, useFullName = false): string {
  const token = getTokenByAddress(address)
  if (!token) return 'Unknown Token'
  
  return useFullName ? token.name : token.symbol
}