import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useMyBills, BillWithId } from '../hooks/useMyBills'
import { BillCard } from '../components/BillCard'
import { PageHeader, PageContainer } from '../components/ui/layout'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { 
  Receipt, 
  Plus, 
  ArrowLeft, 
  Search, 
  RefreshCcw, 
  Wallet,
  FileText
} from 'lucide-react'

interface BillsFilter {
  search: string
  status: 'all' | 'active' | 'completed' | 'cancelled'
}

export default function MyBills() {
  const { isConnected } = useAccount()
  const { bills, isLoading, error, refetch } = useMyBills()
  const [filters, setFilters] = useState<BillsFilter>({
    search: '',
    status: 'all'
  })

  // Filter bills based on search and status
  const filteredBills = bills.filter((bill: BillWithId) => {
    const matchesSearch = filters.search === '' || 
      bill.creator.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && bill.status === 0) ||
      (filters.status === 'completed' && bill.status === 1 && bill.paidShares >= bill.totalShares) ||
      (filters.status === 'cancelled' && bill.status === 1 && bill.paidShares < bill.totalShares)
    
    return matchesSearch && matchesStatus
  })

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="My Bills"
          description="View and manage bills you've created"
        >
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </PageHeader>

        <PageContainer>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your bills
            </p>
            <ConnectButton />
          </div>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="My Bills"
        description="View and manage bills you've created"
      >
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild>
            <Link to="/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Bill
            </Link>
          </Button>
        </div>
      </PageHeader>

      <PageContainer>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                status: e.target.value as BillsFilter['status']
              }))}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Bills</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your bills...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-destructive">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-destructive">Failed to Load Bills</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={refetch} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredBills.length === 0 && bills.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Bills Created Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't created any bills yet. Create your first bill to get started!
              </p>
              <Button asChild>
                <Link to="/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Bill
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Results State */}
        {!isLoading && !error && filteredBills.length === 0 && bills.length > 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Bills Found</h3>
              <p className="text-muted-foreground mb-6">
                No bills match your current filters. Try adjusting your search or filter criteria.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ search: '', status: 'all' })}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bills List */}
        {!isLoading && !error && filteredBills.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredBills.length} of {bills.length} bills
              </p>
            </div>
            
            <div className="grid gap-4">
              {filteredBills.map((bill: BillWithId, index: number) => (
                <BillCard 
                  key={bill.billId || index} 
                  bill={bill} 
                  billId={bill.billId || `bill-${index}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && !error && bills.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{bills.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bills Created</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {bills.filter(bill => bill.status === 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Bills</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {bills.filter(bill => bill.status === 1 && bill.paidShares >= bill.totalShares).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed Bills</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </div>
  )
}