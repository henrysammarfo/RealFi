# RealFi Frontend - Complete Testing Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- Somnia Testnet tokens (STT)

### Installation
```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

## 🔗 Network Setup

### Add Somnia Testnet to MetaMask
1. Open MetaMask
2. Click "Add Network" or "Add Network Manually"
3. Enter these details:
   - **Network Name**: `Somnia Testnet`
   - **RPC URL**: `https://dream-rpc.somnia.network`
   - **Chain ID**: `50312`
   - **Currency Symbol**: `STT`
   - **Block Explorer**: `https://shannon-explorer.somnia.network`

### Get Testnet Tokens
- Visit the Somnia faucet to get STT tokens for gas fees
- You'll need STT for transaction fees

## 🧪 Complete Testing Flow

### 1. Wallet Connection
- ✅ **Connect MetaMask**: Click "Connect Wallet" button
- ✅ **Network Detection**: App should detect Somnia Testnet (Chain ID: 50312)
- ✅ **Wrong Network Warning**: If on wrong network, shows warning with switch button

### 2. User Profile Testing
- ✅ **User Registration**: 
  - Enter a username (e.g., "testuser123")
  - Click "Register User"
  - Confirm transaction in MetaMask
  - Check transaction on Shannon Explorer
- ✅ **Profile Display**: 
  - View username, reputation score, registration date
  - Check total deposits/withdrawals
  - View battle statistics

### 3. Token Operations Testing
- ✅ **Token Balance**: View your RFT token balance
- ✅ **Token Transfer**: 
  - Transfer RFT tokens to another address
  - Check balance updates
- ✅ **Token Approval**: 
  - Approve contracts to spend your tokens
  - Check allowance updates

### 4. Yield Battles Testing
- ✅ **Create Battle**:
  - Enter battle name (e.g., "Test Battle")
  - Set entry fee (e.g., 100 RFT)
  - Set max participants (e.g., 10)
  - Set duration (e.g., 24 hours)
  - Confirm transaction
- ✅ **Join Battle**:
  - Select a battle from the list
  - Enter deposit amount
  - Confirm transaction
- ✅ **Battle Status**: 
  - View your position in battles
  - Check yield earned
  - Monitor battle progress

### 5. Leaderboard Testing
- ✅ **View Rankings**: 
  - See top 10 users
  - Check your rank and score
  - View leaderboard statistics
- ✅ **Score Updates**: 
  - Participate in battles to increase score
  - Watch your rank improve
- ✅ **Real-time Updates**: 
  - Refresh leaderboard
  - See live score changes

### 6. Cross-Chain Bridge Testing
- ✅ **Create Bridge Request**:
  - Select amount (e.g., 50 RFT)
  - Choose target chain (Ethereum, Polygon, BSC)
  - Confirm transaction
- ✅ **Bridge History**: 
  - View your bridge requests
  - Check transaction status
  - Monitor processing time
- ✅ **Transaction Tracking**: 
  - Click transaction links to Shannon Explorer
  - Verify on-chain data

### 7. AI Strategies Testing
- ✅ **View Strategies**: 
  - See available AI strategies
  - Check risk levels and expected returns
  - View success rates
- ✅ **Get Recommendations**: 
  - Click "Get AI Recommendations"
  - See personalized strategy suggestions
- ✅ **Adopt Strategy**:
  - Select a strategy
  - Enter deposit amount
  - Confirm transaction
- ✅ **Track Performance**: 
  - View your active strategies
  - Monitor performance metrics

### 8. Transaction Tracking
- ✅ **Transaction History**: 
  - View recent transactions in floating panel
  - Check transaction status (pending, confirmed, failed)
  - Click explorer links
- ✅ **Real-time Updates**: 
  - Watch transactions change from pending to confirmed
  - See gas usage and block numbers
- ✅ **Error Handling**: 
  - Test with insufficient funds
  - Check error messages
  - Verify transaction failures

## 🔍 Verification Checklist

### Contract Integration
- ✅ All 6 contracts connected and working
- ✅ Real-time data from on-chain calls
- ✅ No mock data or placeholders
- ✅ Transaction hashes link to Shannon Explorer

### User Experience
- ✅ Responsive design on mobile/desktop
- ✅ Loading states for all actions
- ✅ Error handling with clear messages
- ✅ Success confirmations with transaction links

### Functionality
- ✅ Wallet connection and network switching
- ✅ User registration and profile management
- ✅ Token operations (transfer, approve, balance)
- ✅ Yield battle creation and participation
- ✅ Leaderboard rankings and updates
- ✅ Cross-chain bridge requests
- ✅ AI strategy adoption and tracking

## 🐛 Troubleshooting

### Common Issues
1. **"MetaMask not installed"**: Install MetaMask browser extension
2. **"Wrong network"**: Switch to Somnia Testnet (Chain ID: 50312)
3. **"Insufficient funds"**: Get STT tokens from faucet
4. **"Transaction failed"**: Check gas limit and try again
5. **"Contract not found"**: Verify contract addresses in config

### Debug Information
- Check browser console for errors
- Verify network connection to Somnia Testnet
- Confirm contract addresses are correct
- Check transaction status on Shannon Explorer

## 📊 Live Contract Addresses

All contracts are deployed and verified on Somnia Testnet:

- **RealFiToken**: `0x8c73284b55cb55EB46Dd42617bA6213037e602e9`
- **UserProfile**: `0x41d87298B54d329872c29ec385367cD4C404e8e6`
- **YieldVault**: `0x2ABa80F8931d52DEE8e6732d213eabe795535660`
- **Leaderboard**: `0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f`
- **CrossChainBridge**: `0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d`
- **AIStrategy**: `0x809303cC124eABCDa2c6aFF9eefEd30EB662362a`

## 🎯 Testing for Hackathon Judges

### Demo Flow
1. **Connect Wallet** → Show network detection
2. **Register User** → Show on-chain registration
3. **Create Battle** → Show battle creation
4. **Join Battle** → Show participation
5. **Check Leaderboard** → Show ranking updates
6. **Bridge Assets** → Show cross-chain request
7. **Adopt AI Strategy** → Show strategy adoption
8. **View Transactions** → Show explorer links

### Key Points to Highlight
- ✅ **100% Live**: No mock data, all real blockchain interactions
- ✅ **Real Transactions**: Every action creates real transactions
- ✅ **Gas Consumption**: Real gas fees deducted from wallet
- ✅ **Explorer Links**: All transactions visible on Shannon Explorer
- ✅ **Cross-Chain Ready**: Bridge functionality for multiple chains
- ✅ **AI Integration**: Live AI strategy recommendations
- ✅ **Real-time Updates**: Live leaderboard and battle data

## 🏆 Success Criteria

The RealFi platform demonstrates:
- ✅ Complete Web3 integration with live contracts
- ✅ Professional UI/UX with modern design
- ✅ Real-time blockchain data and updates
- ✅ Cross-chain functionality
- ✅ AI-powered features
- ✅ Comprehensive transaction tracking
- ✅ Production-ready code quality

**Ready for live testing and demonstration!** 🚀