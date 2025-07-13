import { ReactNode } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './button'
import { Card } from './card'
import { Separator } from './separator'
import NetworkStatus from '../NetworkStatus'
import { Wallet, Home, Plus, Receipt } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UniSplit
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button
                variant={isActive('/create') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bill
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <NetworkStatus />
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex items-center justify-around py-2">
          <Button
            variant={isActive('/') ? 'default' : 'ghost'}
            size="sm"
            asChild
            className="flex-col h-auto py-2"
          >
            <Link to="/">
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>
          </Button>
          <Button
            variant={isActive('/create') ? 'default' : 'ghost'}
            size="sm"
            asChild
            className="flex-col h-auto py-2"
          >
            <Link to="/create">
              <Plus className="w-5 h-5" />
              <span className="text-xs mt-1">Create</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {children}
      </div>
      <Separator />
    </div>
  )
}

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({
  children,
  className = '',
}: PageContainerProps) {
  return <Card className={`p-6 ${className}`}>{children}</Card>
}
