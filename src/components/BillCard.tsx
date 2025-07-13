import { Link } from 'react-router-dom'
import { BillV2, BillStatus } from '../contracts/BillSplitterV2'
import { getTokenDisplayName, formatTokenAmount } from '../utils/tokens'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Calendar, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'

interface BillCardProps {
  bill: BillV2
  billId: string
}

export function BillCard({ bill, billId }: BillCardProps) {
  const tokenSymbol = getTokenDisplayName(bill.token)
  // const sharePriceFormatted = formatTokenAmount(bill.sharePrice, 6)
  const totalAmountFormatted = formatTokenAmount(bill.sharePrice * BigInt(bill.totalShares), bill.token, 2)
  
  const progress = bill.totalShares > 0 ? (bill.paidShares / bill.totalShares) * 100 : 0
  const remainingShares = bill.totalShares - bill.paidShares
  
  // Format creation date
  const createdDate = new Date(Number(bill.createdAt) * 1000).toLocaleDateString()
  
  // Get status info
  const getStatusInfo = () => {
    switch (bill.status) {
      case BillStatus.Active:
        return {
          label: 'Active',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Clock className="w-3 h-3" />
        }
      case BillStatus.Closed:
        if (bill.paidShares >= bill.totalShares) {
          return {
            label: 'Completed',
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            icon: <CheckCircle className="w-3 h-3" />
          }
        } else {
          return {
            label: 'Cancelled',
            color: 'bg-red-100 text-red-800 border-red-200',
            icon: <XCircle className="w-3 h-3" />
          }
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="w-3 h-3" />
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge className={`${statusInfo.color} flex items-center space-x-1`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Bill ID</p>
            <p className="text-xs font-mono text-muted-foreground">
              {billId.slice(0, 8)}...{billId.slice(-6)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">{totalAmountFormatted} {tokenSymbol}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Shares</p>
              <p className="font-medium">{bill.paidShares}/{bill.totalShares} paid</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{createdDate}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {remainingShares > 0 ? (
              <span>{remainingShares} shares remaining</span>
            ) : (
              <span>All shares paid</span>
            )}
          </div>
          
          <Button asChild size="sm">
            <Link to={`/bill/${billId}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}