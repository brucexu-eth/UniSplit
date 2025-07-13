import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import {
  ArrowLeft,
  Copy,
  Share2,
  ExternalLink,
  Loader2,
  Coins,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCurrencyExchange } from '../hooks/useCurrencyExchange'
import { useBillCreation } from '../hooks/useBillCreation'
import { useQRCode, generateBillURL } from '../hooks/useQRCode'
import { PageHeader, PageContainer } from '../components/ui/layout'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Separator } from '../components/ui/separator'

interface BillFormData {
  totalAmount: string
  currency: string
  shares: string
  creatorShares: string
  description: string
  tokenAddress: string
}

const CURRENCIES = [
  { value: 'NZD', label: 'NZD (New Zealand Dollar)' },
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'GBP', label: 'GBP (British Pound)' },
  { value: 'AUD', label: 'AUD (Australian Dollar)' },
  { value: 'CAD', label: 'CAD (Canadian Dollar)' },
]

const SUPPORTED_TOKENS = [
  {
    value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    label: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    value: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    label: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
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
    currency: 'USD',
    shares: '',
    creatorShares: '0',
    description: '',
    tokenAddress: SUPPORTED_TOKENS[0]?.value || '',
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
    if (formData.totalAmount && formData.shares) {
      const total = parseFloat(formData.totalAmount)
      const shares = parseInt(formData.shares)
      if (!isNaN(total) && !isNaN(shares) && shares > 0) {
        const pricePerShare = total / shares
        setSharePrice(pricePerShare)
      }
    }
  }, [formData.totalAmount, formData.shares])

  const validateForm = (): boolean => {
    const newErrors: Partial<BillFormData> = {}

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Valid total amount is required'
    }

    if (!formData.shares || parseInt(formData.shares) <= 0) {
      newErrors.shares = 'Valid number of shares is required'
    }

    const creatorShares = parseInt(formData.creatorShares)
    const totalShares = parseInt(formData.shares)
    if (creatorShares < 0 || creatorShares > totalShares) {
      newErrors.creatorShares = `Creator shares must be between 0 and ${totalShares}`
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

      await createBill(formData, totalAmountUSDT.toString())
    } catch (error) {
      console.error('Error creating bill:', error)
    }
  }

  const handleReset = () => {
    resetBillCreation()
    setFormData({
      totalAmount: '',
      currency: 'USD',
      shares: '',
      creatorShares: '0',
      description: '',
      tokenAddress: SUPPORTED_TOKENS[0]?.value || '',
    })
    setErrors({})
    setBillURL('')
    setSharePrice(0)
  }

  const selectedToken = SUPPORTED_TOKENS.find(
    (token) => token.value === formData.tokenAddress
  )
  const remainingShares =
    parseInt(formData.shares || '0') - parseInt(formData.creatorShares || '0')

  if (billCreated && billId) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Bill Created Successfully! 🎉"
          description="Share this link with your friends to collect payments"
        />

        <PageContainer className="space-y-6">
          {/* Bill Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <Coins className="mr-2 h-5 w-5" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Amount:</span>
                  <p className="font-medium">
                    {formData.totalAmount} {formData.currency}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Token:</span>
                  <p className="font-medium">
                    {selectedToken?.label || 'Unknown Token'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Shares:</span>
                  <p className="font-medium">{formData.shares}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Price per Share:
                  </span>
                  <p className="font-medium">
                    {sharePrice.toFixed(2)} {formData.currency}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Creator Shares:</span>
                  <p className="font-medium">{formData.creatorShares}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining:</span>
                  <p className="font-medium">{remainingShares} shares</p>
                </div>
              </div>
              {formData.description && (
                <div>
                  <span className="text-muted-foreground text-sm">
                    Description:
                  </span>
                  <p className="font-medium">{formData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Options */}
          <Card>
            <CardHeader>
              <CardTitle>Share Your Bill</CardTitle>
              <CardDescription>
                Send this link to your friends so they can pay their share
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={billURL} readOnly className="flex-1" />
                <Button
                  variant="outline"
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
            </CardContent>
          </Card>

          {/* QR Code */}
          {qrCodeDataURL && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">QR Code</CardTitle>
                <CardDescription className="text-center">
                  Scan to open payment page
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img
                    src={qrCodeDataURL}
                    alt="QR Code for bill payment"
                    className="w-48 h-48"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isGeneratingQR && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Generating QR code...</p>
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
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Create New Bill"
        description="Set up a bill to split expenses with your friends using cryptocurrency"
      >
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </PageHeader>

      <PageContainer>
        {!isConnected ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to create a bill
            </p>
            <ConnectButton />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalAmount: e.target.value,
                    }))
                  }
                  className={errors.totalAmount ? 'border-destructive' : ''}
                />
                {errors.totalAmount && (
                  <p className="text-sm text-destructive">
                    {errors.totalAmount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
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
            </div>

            {/* Shares Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="shares">Total Shares *</Label>
                <Input
                  id="shares"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="4"
                  value={formData.shares}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, shares: e.target.value }))
                  }
                  className={errors.shares ? 'border-destructive' : ''}
                />
                {errors.shares && (
                  <p className="text-sm text-destructive">{errors.shares}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="creatorShares">Your Shares</Label>
                <Input
                  id="creatorShares"
                  type="number"
                  min="0"
                  max={formData.shares || '100'}
                  placeholder="1"
                  value={formData.creatorShares}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      creatorShares: e.target.value,
                    }))
                  }
                  className={errors.creatorShares ? 'border-destructive' : ''}
                />
                {errors.creatorShares && (
                  <p className="text-sm text-destructive">
                    {errors.creatorShares}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of shares you're paying for yourself
                </p>
              </div>
            </div>

            {/* Token Selection */}
            <div className="space-y-2">
              <Label htmlFor="token">Payment Token *</Label>
              <Select
                value={formData.tokenAddress}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tokenAddress: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TOKENS.map((token) => (
                    <SelectItem key={token.value} value={token.value}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{token.label}</span>
                        <span className="text-muted-foreground text-sm">
                          ({token.name})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Token that friends will use to pay their shares
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="e.g., Dinner at restaurant"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Price Preview */}
            {sharePrice > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Price per share:
                      </span>
                      <p className="font-medium text-lg">
                        {sharePrice.toFixed(2)} {formData.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Remaining to collect:
                      </span>
                      <p className="font-medium text-lg">
                        {remainingShares} shares
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-lg py-6"
              disabled={isCreatingBill || exchangeLoading}
            >
              {isCreatingBill ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Bill...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-5 w-5" />
                  Create Bill
                </>
              )}
            </Button>
          </form>
        )}
      </PageContainer>
    </div>
  )
}
