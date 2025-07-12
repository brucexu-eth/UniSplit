import { useState, useCallback } from 'react'
import QRCode from 'qrcode'

interface UseQRCodeResult {
  qrCodeDataURL: string | null
  isGenerating: boolean
  error: string | null
  generateQRCode: (text: string) => Promise<void>
  copyToClipboard: (text: string) => Promise<boolean>
  shareURL: (url: string, title?: string) => Promise<boolean>
}

export function useQRCode(): UseQRCodeResult {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQRCode = useCallback(async (text: string) => {
    if (!text) {
      setError('No text provided for QR code generation')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const qrCodeURL = await QRCode.toDataURL(text, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      })

      setQrCodeDataURL(qrCodeURL)
    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code')
      setQrCodeDataURL(null)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          // Use modern clipboard API if available
          await navigator.clipboard.writeText(text)
          return true
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea')
          textArea.value = text
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()

          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)

          return successful
        }
      } catch (err) {
        console.error('Failed to copy text to clipboard:', err)
        return false
      }
    },
    []
  )

  const shareURL = useCallback(
    async (url: string, title = 'UniSplit Bill'): Promise<boolean> => {
      try {
        if (navigator.share) {
          // Use native Web Share API if available
          await navigator.share({
            title,
            text: 'Split this bill with me using UniSplit',
            url,
          })
          return true
        } else {
          // Fallback to clipboard copy
          const success = await copyToClipboard(url)
          if (success) {
            // Could show a toast or notification here
            console.log('URL copied to clipboard as fallback')
          }
          return success
        }
      } catch (err) {
        console.error('Error sharing URL:', err)
        // Try clipboard as final fallback
        return await copyToClipboard(url)
      }
    },
    [copyToClipboard]
  )

  return {
    qrCodeDataURL,
    isGenerating,
    error,
    generateQRCode,
    copyToClipboard,
    shareURL,
  }
}

// Utility function to generate bill URLs
export function generateBillURL(billId: string): string {
  const baseURL = window.location.origin
  return `${baseURL}/bill/${billId}`
}

// Utility function to generate bill sharing text
export function generateShareText(
  totalAmount: string,
  currency: string,
  description: string,
  billURL: string
): string {
  return `Hey! I've created a bill on UniSplit for "${description}" - ${totalAmount} ${currency}. Pay your share here: ${billURL}`
}
