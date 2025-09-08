# RealFi DeFi Platform Deployment Guide

## Prerequisites

Before deploying the RealFi DeFi Platform, ensure you have the following:

### Required Software
- Node.js 18+ 
- npm or yarn
- Git
- MetaMask or compatible Web3 wallet
- Somnia Testnet access

### Required Accounts
- Somnia Testnet wallet with testnet tokens
- Access to Somnia Testnet RPC
- Somnia Testnet faucet access

## Deployment Steps

### 1. Environment Setup

#### Clone the Repository
```bash
git clone <repository-url>
cd RealFi
```

#### Install Dependencies
```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### Configure Environment Variables
```bash
# Copy environment files
cp contracts/env.example contracts/.env
cp frontend/env.example frontend/.env
```

### 2. Somnia Testnet Configuration

#### Get Testnet Tokens
1. Visit the Somnia Testnet Faucet: `https://faucet.somnia.network`
2. Connect your wallet
3. Request testnet tokens for deployment

#### Configure MetaMask
1. Open MetaMask
2. Click on network dropdown
3. Select "Add Network"
4. Enter Somnia Testnet details:
   - Network Name: `Somnia Testnet`
   - RPC URL: `https://testnet.somnia.network`
   - Chain ID: `420` (update with actual Somnia chain ID)
   - Currency Symbol: `SOM`
   - Block Explorer: `https://testnet-explorer.somnia.network`

### 3. Smart Contract Deployment

#### Update Environment Variables
Edit `contracts/.env`:
```env
PRIVATE_KEY=your_private_key_here
SOMNIA_RPC_URL=https://testnet.somnia.network
SOMNIA_CHAIN_ID=420
```

#### Deploy Contracts
```bash
cd contracts
npx hardhat run scripts/deploy.js --network somnia-testnet
```

#### Expected Output
```
🚀 Starting RealFi DeFi Platform Deployment to Somnia Testnet...

Deploying contracts with account: 0x...
Account balance: 1.0 ETH

📝 Deploying RealFi Token...
✅ RealFi Token deployed to: 0x...

👤 Deploying UserProfile contract...
✅ UserProfile deployed to: 0x...

🏦 Deploying YieldVault contract...
✅ YieldVault deployed to: 0x...

🏆 Deploying Leaderboard contract...
✅ Leaderboard deployed to: 0x...

🌉 Deploying CrossChainBridge contract...
✅ CrossChainBridge deployed to: 0x...

🤖 Deploying AIStrategy contract...
✅ AIStrategy deployed to: 0x...

⚙️ Setting up initial configuration...
Creating initial yield battles...
✅ Initial battles created
Minting test tokens...
✅ Test tokens minted

🎉 RealFi DeFi Platform Successfully Deployed to Somnia Testnet!

📋 Contract Addresses:
┌─────────────────────┬──────────────────────────────────────────────┐
│ Contract            │ Address                                      │
├─────────────────────┼──────────────────────────────────────────────┤
│ RealFiToken         │ 0x...                                        │
│ UserProfile         │ 0x...                                        │
│ YieldVault          │ 0x...                                        │
│ Leaderboard         │ 0x...                                        │
│ CrossChainBridge    │ 0x...                                        │
│ AIStrategy          │ 0x...                                        │
└─────────────────────┴──────────────────────────────────────────────┘
```

### 4. Frontend Configuration

#### Update Contract Addresses
Edit `frontend/.env`:
```env
REACT_APP_REALFI_TOKEN_ADDRESS=0x...
REACT_APP_USER_PROFILE_ADDRESS=0x...
REACT_APP_YIELD_VAULT_ADDRESS=0x...
REACT_APP_LEADERBOARD_ADDRESS=0x...
REACT_APP_CROSS_CHAIN_BRIDGE_ADDRESS=0x...
REACT_APP_AI_STRATEGY_ADDRESS=0x...
```

#### Start Development Server
```bash
cd frontend
npm start
```

### 5. Verification

#### Verify Contract Deployment
```bash
cd contracts
npx hardhat run scripts/verify.js --network somnia-testnet
```

#### Test Frontend Functionality
1. Open browser to `http://localhost:3000`
2. Connect MetaMask wallet
3. Switch to Somnia Testnet
4. Test user registration
5. Test deposit functionality
6. Test battle participation

## Post-Deployment Configuration

### 1. Contract Verification
Verify all contracts on Somnia Explorer:
```bash
npx hardhat verify --network somnia-testnet <contract-address> <constructor-args>
```

### 2. Initial Setup
After deployment, perform initial setup:
- Create additional yield battles
- Configure cross-chain bridge parameters
- Set up AI strategy parameters
- Test all functionality

### 3. Monitoring Setup
Set up monitoring for:
- Contract events
- Transaction failures
- User activity
- Performance metrics

## Troubleshooting

### Common Issues

#### Deployment Failures
- **Insufficient Gas**: Increase gas limit in deployment script
- **Network Issues**: Check Somnia Testnet connectivity
- **Private Key Issues**: Ensure private key is correctly formatted

#### Frontend Connection Issues
- **Wrong Network**: Ensure MetaMask is on Somnia Testnet
- **Contract Addresses**: Verify all addresses are correct
- **RPC Issues**: Check Somnia Testnet RPC availability

#### Transaction Failures
- **Insufficient Balance**: Ensure wallet has enough testnet tokens
- **Gas Estimation**: Check gas estimation for transactions
- **Contract State**: Verify contract is in correct state

### Debug Commands

#### Check Contract State
```bash
npx hardhat console --network somnia-testnet
```

#### View Contract Events
```bash
npx hardhat run scripts/view-events.js --network somnia-testnet
```

#### Test Contract Functions
```bash
npx hardhat test --network somnia-testnet
```

## Security Considerations

### Private Key Security
- Never commit private keys to version control
- Use environment variables for sensitive data
- Consider using hardware wallets for production

### Contract Security
- Verify all contracts on explorer
- Test all functions thoroughly
- Monitor for unusual activity

### Network Security
- Use HTTPS for all connections
- Validate all user inputs
- Implement proper error handling

## Production Deployment

### Pre-Production Checklist
- [ ] All contracts deployed and verified
- [ ] Frontend configured with correct addresses
- [ ] All functionality tested
- [ ] Security audit completed
- [ ] Monitoring setup
- [ ] Documentation updated

### Production Steps
1. Deploy to mainnet (when available)
2. Update frontend configuration
3. Set up production monitoring
4. Configure domain and hosting
5. Launch announcement

## Maintenance

### Regular Tasks
- Monitor contract events
- Update frontend dependencies
- Check network connectivity
- Review user feedback
- Update documentation

### Emergency Procedures
- Contract upgrade procedures
- Emergency pause mechanisms
- User communication protocols
- Rollback procedures

## Support

### Getting Help
- Check documentation first
- Review error logs
- Test with minimal configuration
- Contact development team

### Reporting Issues
- Provide detailed error messages
- Include transaction hashes
- Describe steps to reproduce
- Include system information

This deployment guide ensures a smooth and secure deployment of the RealFi DeFi Platform to the Somnia Testnet.
