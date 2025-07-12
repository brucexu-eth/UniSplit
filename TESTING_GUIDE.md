# 🧪 UniSplit Testing & Deployment Guide

## Prerequisites

### 1. **Get Testnet Setup**
- [ ] Get Base Sepolia ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [ ] Create WalletConnect Project ID at [WalletConnect Cloud](https://cloud.walletconnect.com)
- [ ] Set up testnet wallet (MetaMask with Base Sepolia network)

### 2. **Environment Configuration**
```bash
# Copy testnet environment
cp .env.testnet .env

# Update with your values:
# - VITE_WALLETCONNECT_PROJECT_ID
# - PRIVATE_KEY (testnet wallet private key)
```

## Testing Phases

### Phase 1: Smart Contract Deployment & Verification

#### 1.1 **Deploy to Base Sepolia**
```bash
# Deploy smart contract
npm run deploy:testnet

# Verify contract on BaseScan
npm run verify:testnet
```

#### 1.2 **Update Environment**
After deployment, update `.env` with the deployed contract address:
```bash
VITE_BILL_SPLITTER_CONTRACT_ADDRESS=<deployed_contract_address>
```

#### 1.3 **Contract Testing Checklist**
- [ ] Contract deploys successfully
- [ ] Contract verification on BaseScan works
- [ ] All 24 contract tests pass
- [ ] Contract functions accessible via BaseScan

### Phase 2: Frontend Application Testing

#### 2.1 **Development Server**
```bash
# Start development server
npm run dev

# In another terminal, check for TypeScript errors
npm run build
```

#### 2.2 **Core Feature Testing**

**Bill Creation Flow:**
- [ ] Connect wallet works (MetaMask/WalletConnect)
- [ ] Form validation works correctly
- [ ] Currency exchange rates load
- [ ] Bill creation transaction succeeds
- [ ] QR code generation works
- [ ] Shareable URL is generated
- [ ] Success state displays correctly

**Bill Payment Flow:**
- [ ] Bill URL loads correctly (e.g., `/bill/0x123...`)
- [ ] Bill details display properly
- [ ] Share quantity selector works
- [ ] USDT approval flow works (if needed)
- [ ] Payment transaction succeeds
- [ ] Payment confirmation updates UI
- [ ] Bill status updates in real-time

#### 2.3 **Error Handling Testing**
- [ ] Invalid bill ID shows proper error
- [ ] Network disconnection handling
- [ ] Insufficient USDT balance error
- [ ] Transaction rejection handling
- [ ] Contract revert scenarios

#### 2.4 **Responsive Design Testing**
- [ ] Mobile layout (320px - 768px)
- [ ] Tablet layout (768px - 1024px)
- [ ] Desktop layout (1024px+)
- [ ] QR code visibility on mobile

### Phase 3: Integration Testing

#### 3.1 **End-to-End User Journey**
1. [ ] User A creates a bill for $100, 4 shares
2. [ ] User A shares QR code/URL with User B
3. [ ] User B opens shared link
4. [ ] User B pays for 1 share (approves USDT if needed)
5. [ ] User B's payment reflects immediately
6. [ ] User C pays for 2 shares
7. [ ] Bill automatically settles when fully paid
8. [ ] All users see updated status

#### 3.2 **Edge Cases**
- [ ] Multiple payments from same user
- [ ] Overpayment prevention
- [ ] Bill cancellation by creator
- [ ] Refund processing
- [ ] Fee collection

### Phase 4: Performance & Security Testing

#### 4.1 **Performance**
- [ ] Initial page load < 3 seconds
- [ ] Transaction confirmation < 30 seconds
- [ ] Large bill lists load smoothly
- [ ] Mobile performance acceptable

#### 4.2 **Security**
- [ ] Private keys never exposed in frontend
- [ ] Environment variables properly configured
- [ ] No console warnings/errors
- [ ] HTTPS in production
- [ ] Contract interaction security

## Deployment Steps

### Step 1: Testnet Deployment
```bash
# 1. Configure testnet environment
cp .env.testnet .env
# Update with your testnet values

# 2. Deploy contract
npm run deploy:testnet

# 3. Update contract address in .env
VITE_BILL_SPLITTER_CONTRACT_ADDRESS=<deployed_address>

# 4. Test application
npm run dev
```

### Step 2: Production Deployment
```bash
# 1. Configure mainnet environment
cp .env.example .env
# Update with production values

# 2. Deploy contract to mainnet
npm run deploy:mainnet

# 3. Update contract address
VITE_BILL_SPLITTER_CONTRACT_ADDRESS=<mainnet_address>

# 4. Build production bundle
npm run build

# 5. Deploy to hosting platform
# (Vercel, Netlify, etc.)
```

## Debugging Common Issues

### Smart Contract Issues
- **"Insufficient funds for gas"**: Get more ETH from faucet
- **"Nonce too high"**: Reset MetaMask account
- **"Contract not verified"**: Run verification command again

### Frontend Issues
- **"Cannot read properties of undefined"**: Check contract address in .env
- **"Transaction reverted"**: Check Base Sepolia network in wallet
- **"Network error"**: Verify RPC URL and network ID

### Integration Issues
- **Bill not loading**: Verify bill ID format and contract deployment
- **Payment failing**: Check USDT balance and allowance
- **UI not updating**: Check if events are being emitted correctly

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Users can create bills
- [ ] Users can pay bills via shared links
- [ ] Payments process correctly on Base testnet
- [ ] Basic error handling works
- [ ] Mobile responsive

### Production Ready
- [ ] All tests pass (unit, integration, e2e)
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Error monitoring setup
- [ ] Analytics implementation
- [ ] Documentation complete

## Next Steps After Testing

1. **Fix any discovered issues**
2. **Security audit** (optional but recommended)
3. **Mainnet deployment**
4. **User onboarding improvements** (Tasks 5-10)
5. **Advanced features** (real-time updates, dashboard, etc.)

## Support Resources

- [Base Sepolia Explorer](https://sepolia.basescan.org)
- [Base Documentation](https://docs.base.org)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)