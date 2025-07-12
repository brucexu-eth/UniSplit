import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CreditCard, Users, Zap } from 'lucide-react'
import CreateBill from './pages/CreateBill'
import BillPayment from './pages/BillPayment'
import NetworkStatus from './components/NetworkStatus'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Separator } from './components/ui/separator'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link to="/" className="mr-6 flex items-center space-x-2">
                <CreditCard className="h-6 w-6" />
                <span className="font-bold sm:inline-block">UniSplit</span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  to="/"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Home
                </Link>
                <Link
                  to="/create"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Create Bill
                </Link>
              </nav>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <div className="flex items-center space-x-2">
                <NetworkStatus />
                <ConnectButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateBill />} />
            <Route path="/bill/:billId" element={<BillPayment />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

// Home Page Component
function HomePage() {
  return (
    <div className="container relative">
      {/* Hero Section */}
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          Split Bills{' '}
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Effortlessly
          </span>
        </h1>
        <p className="max-w-[750px] text-center text-lg font-light text-muted-foreground sm:text-xl">
          Create bills, invite friends, and collect payments using cryptocurrency
          on Base network. Simple, secure, and transparent.
        </p>
        <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-10">
          <Button asChild size="lg">
            <Link to="/create">
              <CreditCard className="mr-2 h-4 w-4" />
              Create New Bill
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#features">
              Learn more
            </a>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Features Section */}
      <section id="features" className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">
            How it works
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Simple bill splitting in 3 easy steps
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <CreditCard className="h-4 w-4 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Create your bill</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Enter the total amount, select currency, and specify how many people
                will split the bill. Set up your payment preferences instantly.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Users className="h-4 w-4 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Share with friends</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Share the generated link or QR code with your friends so they can
                pay their share. No registration required for payers.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Get paid instantly</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Receive payments in USDT/USDC on Base network directly to your
                wallet. Fast, secure, and transparent transactions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default App
