import { useState, useEffect, useCallback } from 'react'

interface ExchangeRateData {
  success: boolean
  rates: { [key: string]: number }
  timestamp: number
}

interface CurrencyExchangeResult {
  rate: number | null
  loading: boolean
  error: string | null
  convertToUSDT: (amount: number, fromCurrency: string) => number
  refresh: () => void
  lastUpdated: Date | null
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const FALLBACK_RATES: { [key: string]: number } = {
  NZD: 0.58, // Approximate fallback rates to USDT
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.26,
  AUD: 0.64,
  CAD: 0.72,
}

// In-memory cache for exchange rates
let rateCache: {
  data: ExchangeRateData | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

export function useCurrencyExchange(): CurrencyExchangeResult {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchExchangeRates = useCallback(async () => {
    // Check if we have cached data that's still fresh
    const now = Date.now()
    if (
      rateCache.data &&
      now - rateCache.timestamp < CACHE_DURATION &&
      rateCache.data.success
    ) {
      setRate(rateCache.data.rates.USDT || 1)
      setLastUpdated(new Date(rateCache.timestamp))
      setError(null)
      return rateCache.data
    }

    setLoading(true)
    setError(null)

    try {
      // Using exchangerate.host API (free, no API key required)
      const response = await fetch(
        'https://api.exchangerate.host/latest?base=USD&symbols=NZD,AUD,EUR,GBP,CAD,USDT'
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ExchangeRateData = await response.json()

      if (!data.success) {
        throw new Error('Exchange rate API returned unsuccessful response')
      }

      // Cache the successful response
      rateCache = {
        data,
        timestamp: now,
      }

      // For USDT conversion, we assume 1 USD ≈ 1 USDT (close approximation)
      setRate(data.rates.USDT || 1)
      setLastUpdated(new Date())
      return data
    } catch (err) {
      console.warn('Failed to fetch exchange rates:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to fetch exchange rates'
      )

      // Use fallback rates if API fails
      const fallbackData: ExchangeRateData = {
        success: true,
        rates: FALLBACK_RATES,
        timestamp: now,
      }

      rateCache = {
        data: fallbackData,
        timestamp: now,
      }

      setRate(1) // Fallback USDT rate
      setLastUpdated(new Date())
      return fallbackData
    } finally {
      setLoading(false)
    }
  }, [])

  const convertToUSDT = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (!rateCache.data || !rateCache.data.success) {
        // Use fallback rates
        const fallbackRate = FALLBACK_RATES[fromCurrency] || 1
        return amount * fallbackRate
      }

      const rates = rateCache.data.rates

      if (fromCurrency === 'USDT' || fromCurrency === 'USD') {
        return amount // Already in USDT/USD
      }

      // Convert from foreign currency to USD first, then to USDT
      const currencyToUSD = 1 / (rates[fromCurrency] || 1)
      const usdToUSDT = rates.USDT || 1

      return amount * currencyToUSD * usdToUSDT
    },
    []
  )

  const refresh = useCallback(() => {
    // Clear cache to force fresh fetch
    rateCache = { data: null, timestamp: 0 }
    fetchExchangeRates()
  }, [fetchExchangeRates])

  // Initial fetch on mount
  useEffect(() => {
    fetchExchangeRates()
  }, [fetchExchangeRates])

  return {
    rate,
    loading,
    error,
    convertToUSDT,
    refresh,
    lastUpdated,
  }
}
