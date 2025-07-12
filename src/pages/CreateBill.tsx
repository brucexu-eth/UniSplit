import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { ArrowLeft, Copy, Share2, ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCurrencyExchange } from '../hooks/useCurrencyExchange'
import { useBillCreation } from '../hooks/useBillCreation'
import { useQRCode, generateBillURL } from '../hooks/useQRCode'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Separator } from '../components/ui/separator'
import { Badge } from '../components/ui/badge'

interface BillFormData {
  totalAmount: string
  currency: string
  shares: string
  description: string
}

const CURRENCIES = [
  { value: 'NZD', label: 'NZD (New Zealand Dollar)' },
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'GBP', label: 'GBP (British Pound)' },
  { value: 'AUD', label: 'AUD (Australian Dollar)' },
  { value: 'CAD', label: 'CAD (Canadian Dollar)' },
]

export default function CreateBill() {
  const { isConnected } = useAccount()
  const { convertToUSDT, loading: exchangeLoading } = useCurrencyExchange()
  
  const {
    createBill,
    isLoading: isCreatingBill,
    isSuccess: billCreated,
    billId,
    reset: resetBillCreation,
  } = useBillCreation()

  const {
    qrCodeDataURL,
    isGenerating: isGeneratingQR,
    generateQRCode,
    copyToClipboard,
  } = useQRCode()

  const [formData, setFormData] = useState<BillFormData>({
    totalAmount: '',
    currency: 'NZD',
    shares: '',
    description: '',
  })

  const [errors, setErrors] = useState<Partial<BillFormData>>({})
  const [billURL, setBillURL] = useState<string>('')
  const [sharePrice, setSharePrice] = useState<number>(0)

  // Generate QR code when bill is created successfully
  useEffect(() => {
    if (billCreated && billId) {
      const url = generateBillURL(billId)
      setBillURL(url)
      generateQRCode(url)
    }
  }, [billCreated, billId, generateQRCode])

  // Calculate share price in real time
  useEffect(() => {
    if (formData.totalAmount && formData.shares && formData.currency) {
      const total = parseFloat(formData.totalAmount)
      const shares = parseInt(formData.shares)
      if (!isNaN(total) && !isNaN(shares) && shares > 0) {
        const pricePerShare = total / shares
        setSharePrice(pricePerShare)
      }
    }
  }, [formData.totalAmount, formData.shares, formData.currency])

  const validateForm = (): boolean => {
    const newErrors: Partial<BillFormData> = {}

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Valid total amount is required'
    }

    if (!formData.shares || parseInt(formData.shares) <= 0) {
      newErrors.shares = 'Valid number of shares is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const totalAmountUSDT = await convertToUSDT(
        parseFloat(formData.totalAmount),
        formData.currency
      )

      await createBill(
        {
          totalAmount: formData.totalAmount,
          currency: formData.currency,
          shares: formData.shares,
          description: formData.description,
        },
        totalAmountUSDT.toString()
      )
    } catch (error) {
      console.error('Error creating bill:', error)
    }
  }

  const handleReset = () => {
    resetBillCreation()
    setFormData({
      totalAmount: '',
      currency: 'NZD',
      shares: '',
      description: '',
    })
    setErrors({})
    setBillURL('')
    setSharePrice(0)
  }

  if (billCreated && billId) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">
              Bill Created Successfully! 🎉
            </CardTitle>
            <CardDescription>
              Share this link with your friends to collect payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bill Summary */}
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">Bill Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{formData.totalAmount} {formData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Shares:</span>
                  <span>{formData.shares}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per Share:</span>
                  <span>{sharePrice.toFixed(2)} {formData.currency}</span>
                </div>
                {formData.description && (
                  <div className="flex justify-between">
                    <span>Description:</span>
                    <span>{formData.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 mr-2">
                  <Input
                    value={billURL}
                    readOnly
                    className="text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(billURL)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(billURL)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'UniSplit Bill',
                        text: `Pay your share for: ${formData.description || 'Shared expense'}`,
                        url: billURL,
                      })
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeDataURL && (
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-lg border">
                  <img
                    src={qrCodeDataURL}
                    alt="QR Code for bill payment"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan QR code to open payment page
                </p>
              </div>
            )}

            {isGeneratingQR && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  Generating QR code...
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Create Another Bill
              </Button>
              <Button asChild className="flex-1">
                <Link to={`/bill/${billId}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Bill
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Bill</CardTitle>
          <CardDescription>
            Set up a bill to split expenses with your friends using cryptocurrency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to create a bill
              </p>
              <ConnectButton />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Total Amount */}
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <div className="flex gap-2">
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                    className={errors.totalAmount ? "border-destructive" : ""}
                  />
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.totalAmount && (
                  <p className="text-sm text-destructive">{errors.totalAmount}</p>
                )}
              </div>

              {/* Number of Shares */}
              <div className="space-y-2">
                <Label htmlFor="shares">Number of Shares *</Label>
                <Input
                  id="shares"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="2"
                  value={formData.shares}
                  onChange={(e) => setFormData(prev => ({ ...prev, shares: e.target.value }))}
                  className={errors.shares ? "border-destructive" : ""}
                />
                {errors.shares && (
                  <p className="text-sm text-destructive">{errors.shares}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="description"
                  placeholder="e.g., Dinner at restaurant"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Price Preview */}
              {sharePrice > 0 && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price per share:</span>
                    <Badge variant="secondary">
                      {sharePrice.toFixed(2)} {formData.currency}
                    </Badge>
                  </div>
                </div>
              )}

              <Separator />

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCreatingBill || exchangeLoading}
              >
                {isCreatingBill ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Bill...
                  </>
                ) : (
                  'Create Bill'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}