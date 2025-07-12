#!/bin/bash

# UniSplit Testing Setup Script
echo "🚀 Setting up UniSplit for testing..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env from testnet template..."
    cp .env.testnet .env
    echo "✅ .env created"
    echo "⚠️  Please update .env with your values:"
    echo "   - VITE_WALLETCONNECT_PROJECT_ID"
    echo "   - PRIVATE_KEY (testnet private key)"
    echo ""
else
    echo "✅ .env already exists"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npm run compile
echo "✅ Contracts compiled"

# Run tests
echo "🧪 Running contract tests..."
npm run test:contracts
echo "✅ Contract tests completed"

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Update .env with your testnet values"
echo "2. Get Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
echo "3. Deploy contract: npm run deploy:testnet"
echo "4. Update VITE_BILL_SPLITTER_CONTRACT_ADDRESS in .env"
echo "5. Start development: npm run dev"
echo ""
echo "📖 See TESTING_GUIDE.md for complete testing instructions"