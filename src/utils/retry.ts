export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: Error) => boolean
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  shouldRetry: (error: Error) => {
    // Retry on network errors, rate limits, and backend issues
    const message = error.message.toLowerCase()
    return (
      message.includes('503') ||
      message.includes('502') ||
      message.includes('504') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('rate limit') ||
      message.includes('backend') ||
      message.includes('overloaded') ||
      message.includes('unavailable')
    )
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: Error

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry if it's the last attempt or if we shouldn't retry this error
      if (attempt === opts.maxRetries || !opts.shouldRetry(lastError)) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(opts.baseDelay * Math.pow(2, attempt), opts.maxDelay)
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}