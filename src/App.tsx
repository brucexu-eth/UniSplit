import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { CreditCard, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react'
import CreateBill from './pages/CreateBill'
import BillPayment from './pages/BillPayment'
import { Layout } from './components/ui/layout'
import { Button } from './components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import { Badge } from './components/ui/badge'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateBill />} />
          <Route path="/bill/:billId" element={<BillPayment />} />
        </Routes>
      </Layout>
    </Router>
  )
}

// Home Page Component
function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <Badge variant="secondary" className="px-3 py-1">
            ✨ Now supporting multiple ERC20 tokens
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Split Bills{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Effortlessly
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Create bills, invite friends, and collect payments using any ERC20
            token on Base network. Simple, secure, and transparent.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link to="/create">
              <CreditCard className="mr-2 h-5 w-5" />
              Create New Bill
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="text-lg px-8 py-6"
          >
            <a href="#features">Learn More</a>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">How UniSplit Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Split expenses in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="relative group hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">1. Create Your Bill</CardTitle>
                <CardDescription className="text-base mt-2">
                  Enter the total amount, select your preferred ERC20 token
                  (USDT, USDC, etc.), and specify how many people will split the
                  bill.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Support for multiple tokens
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Set creator's initial share
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative group hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">2. Share with Friends</CardTitle>
                <CardDescription className="text-base mt-2">
                  Share the generated link or QR code with your friends. They
                  can pay their share without needing to register.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  QR code generation
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  No registration required
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative group hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">3. Get Paid Instantly</CardTitle>
                <CardDescription className="text-base mt-2">
                  Receive payments in your chosen token directly to your wallet.
                  Fast, secure, and transparent on Base network.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Instant settlement
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Low gas fees on Base
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">
            Ready to split your first bill?
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Join thousands of users who trust UniSplit for seamless expense
            sharing
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link to="/create">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export default App
