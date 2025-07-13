import { useState, useEffect, useCallback } from 'react'

interface ExchangeRateData {
  base: string
  rates: { [key: string]: number }
  date: string
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
  NZD: 0.60, // Updated fallback rates to USDT (1 NZD = 0.60 USD)
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
      rateCache.data.rates
    ) {
      setRate(1) // USDT ≈ USD
      setLastUpdated(new Date(rateCache.timestamp))
      setError(null)
      return rateCache.data
    }

    setLoading(true)
    setError(null)

    try {
      // Using exchangerate-api.com (free, no API key required)
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ExchangeRateData = await response.json()

      if (!data.rates || !data.base) {
        throw new Error('Exchange rate API returned invalid response')
      }

      // Cache the successful response
      rateCache = {
        data,
        timestamp: now,
      }

      // For USDT conversion, we assume 1 USD ≈ 1 USDT (close approximation)
      setRate(1)
      setLastUpdated(new Date())
      return data
    } catch (err) {
      console.warn('Failed to fetch exchange rates:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to fetch exchange rates'
      )

      // Use fallback rates if API fails
      const fallbackData: ExchangeRateData = {
        base: 'USD',
        rates: { ...FALLBACK_RATES, USD: 1 },
        date: new Date().toISOString().split('T')[0]!,
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
      if (!rateCache.data || !rateCache.data.rates) {
        // Use fallback rates which are directly in USD terms
        const fallbackRate = FALLBACK_RATES[fromCurrency] || 1
        return amount * fallbackRate
      }

      const rates = rateCache.data.rates

      if (fromCurrency === 'USDT' || fromCurrency === 'USD') {
        return amount // Already in USDT/USD
      }

      // API returns rates as "1 USD = X foreign currency"
      // So to convert from foreign currency to USD: amount / rate
      const foreignCurrencyRate = rates[fromCurrency] || 1
      const amountInUSD = amount / foreignCurrencyRate

      return amountInUSD
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
