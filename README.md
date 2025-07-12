# 🚀 UniSplit - Cryptocurrency Bill Splitting

> Split bills effortlessly with cryptocurrency payments on Base network

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/harryyu/UniSplit)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Base Network](https://img.shields.io/badge/network-Base-blue)](https://base.org)

## ✨ Features

- 💰 **Create Bills** - Set total amount, number of shares, and description  
- 🔗 **Share Links** - Generate QR codes and shareable URLs
- 💳 **USDT Payments** - Pay with USDT on Base network
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔐 **Web3 Wallet Integration** - Connect with MetaMask, WalletConnect, and more
- ⚡ **Real-time Updates** - Live payment status and bill tracking
- 🛡️ **Smart Contract Security** - Audited smart contract with comprehensive tests

## 🎯 Core Features Status

| Feature | Status | Description |
|---------|--------|-------------|
| ✅ Project Setup | Complete | Vite + React + TypeScript + Web3 stack |
| ✅ Smart Contract | Complete | BillSplitter contract with 24 passing tests |
| ✅ Bill Creation | Complete | Form validation, currency exchange, QR codes |
| ✅ Bill Payment | Complete | USDT payments, share selection, real-time updates |
| 🚧 Real-time Tracking | Pending | Live payment status and WebSocket events |
| 🚧 Organizer Dashboard | Pending | Bill management for creators |
| 🚧 On-ramp Integration | Pending | Buy USDT directly in the app |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or higher)
- [Git](https://git-scm.com)
- Web3 wallet (MetaMask recommended)
- Base Sepolia ETH for testing

### 1. **Clone & Setup**

```bash
git clone https://github.com/harryyu/UniSplit.git
cd UniSplit
npm install
```

### 2. **Configure Environment**

```bash
# Copy testnet configuration
cp .env.testnet .env

# Update .env with your values:
# - Get WalletConnect Project ID: https://cloud.walletconnect.com
# - Add your testnet private key
# - Get Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

### 3. **Deploy Smart Contract**

```bash
# Compile contracts
npm run compile

# Run tests (all 24 should pass)
npm run test:contracts

# Deploy to Base Sepolia
npm run deploy:testnet
```

### 4. **Update Contract Address**

After deployment, update `.env`:
```bash
VITE_BILL_SPLITTER_CONTRACT_ADDRESS=<your_deployed_contract_address>
```

### 5. **Start Development**

```bash
npm run dev
```

Visit `http://localhost:5173` to start testing!

## 🧪 Testing Guide

### **Automated Testing**
```bash
# Run smart contract tests
npm run test:contracts

# Check TypeScript compilation
npm run build

# Run linting
npm run lint
```

### **Manual Testing Flow**

1. **Create a Bill**
   - Navigate to `/create`
   - Fill form: $100 total, 4 shares, "Team lunch"
   - Connect wallet and create bill
   - Copy shareable URL

2. **Pay a Bill**
   - Open shareable URL in new browser/incognito
   - Connect different wallet
   - Select number of shares to pay
   - Approve USDT spending (if needed)
   - Complete payment

3. **Verify Results**
   - Check bill status updates
   - Verify payment reflected on blockchain
   - Test with multiple payers

### **Test Cases Checklist**

- [ ] Bill creation with validation
- [ ] QR code generation and scanning
- [ ] Share URL functionality
- [ ] USDT approval flow
- [ ] Payment transactions
- [ ] Error handling (insufficient funds, network issues)
- [ ] Mobile responsiveness
- [ ] Multi-user payment scenarios

## 🛠️ Technical Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Web3**: wagmi, viem, RainbowKit
- **Blockchain**: Base network (Ethereum L2)
- **Token**: USDT (Circle USD on Base)
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Testing**: Hardhat Test Suite (24 tests)

## 📱 User Experience

### **Creating a Bill**
1. Connect your wallet
2. Enter bill details (amount, shares, description)  
3. Real-time currency conversion
4. Generate shareable QR code and URL
5. Share with friends

### **Paying a Bill**
1. Open shared link
2. View bill details and remaining shares
3. Select quantity to pay (supports proxy payments)
4. Approve USDT spending (one-time)
5. Pay with one click
6. Real-time confirmation

## 🔧 Development

### **Available Scripts**

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview                # Preview production build

# Smart Contracts
npm run compile                # Compile contracts
npm run test:contracts         # Run contract tests
npm run deploy:testnet         # Deploy to Base Sepolia
npm run deploy:mainnet         # Deploy to Base Mainnet
npm run verify:testnet         # Verify on BaseScan (testnet)

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run format                 # Format with Prettier
npm run typecheck             # TypeScript type checking
```

### **Project Structure**

```
src/
├── components/              # Reusable UI components
├── pages/                  # Main application pages
│   ├── CreateBill.tsx      # Bill creation interface
│   └── BillPayment.tsx     # Payment interface
├── hooks/                  # Custom React hooks
│   ├── useBillCreation.ts  # Bill creation logic
│   ├── useBillReading.ts   # Bill data fetching
│   ├── useBillPayment.ts   # Payment processing
│   └── useCurrencyExchange.ts # Exchange rates
├── contracts/              # Contract ABIs and types
├── config/                # Configuration and constants
└── utils/                 # Utility functions

contracts/                 # Smart contract source
├── BillSplitter.sol       # Main contract
└── test/                  # Contract tests
```

## 🚀 Deployment

### **Testnet Deployment**
```bash
# Quick setup for testing
./scripts/setup-testing.sh

# Manual deployment
npm run deploy:testnet
npm run verify:testnet
```

### **Production Deployment**
```bash
# Deploy contract to Base Mainnet
npm run deploy:mainnet
npm run verify:mainnet

# Build frontend
npm run build

# Deploy to hosting (Vercel, Netlify, etc.)
```

## 🔐 Security

- ✅ Smart contract security best practices
- ✅ Comprehensive test coverage (24 tests)
- ✅ ReentrancyGuard protection
- ✅ Access control for critical functions
- ✅ Input validation and error handling
- ✅ No private key exposure in frontend

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run test:contracts`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Base Network](https://base.org)
- [BaseScan Explorer](https://basescan.org)
- [Documentation](TESTING_GUIDE.md)
- [Live Demo](https://unisplit.app) *(coming soon)*

## 📞 Support

- Create an [Issue](https://github.com/harryyu/UniSplit/issues)
- Join our [Discord](https://discord.gg/unisplit) *(coming soon)*
- Email: support@unisplit.app *(coming soon)*

---

**🚀 Ready to test?** Follow the [Testing Guide](TESTING_GUIDE.md) for complete testing instructions!