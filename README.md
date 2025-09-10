# RealFi - Cross-Chain DeFi Portfolio Manager

A live, production-ready Web3 DeFi application for the Somnia Network featuring "Yield Battles" - a competitive cross-chain yield farming platform where users can join battles, compete for yield, and move assets across chains (ETH, MATIC, BSC) via bridges.

## 🚀 Features

- **Live Cross-Chain DeFi Portfolio Management**: Real-time portfolio tracking across multiple chains
- **Yield Battles**: Competitive yield farming with live leaderboards
- **Cross-Chain Asset Movement**: Bridge assets between ETH, MATIC, and BSC networks
- **AI-Generated Strategies**: On-chain strategy scoring and recommendations
- **Real-Time Leaderboards**: Live updates based on on-chain events
- **100% On-Chain**: No mock data, all interactions with live Somnia Testnet contracts

## 🏗️ Architecture

```
RealFi/
├── contracts/          # Solidity smart contracts
│   ├── UserProfile.sol
│   ├── YieldVault.sol
│   ├── Leaderboard.sol
│   ├── CrossChainBridge.sol
│   └── AIStrategy.sol
├── frontend/           # React application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── docs/              # Documentation
│   ├── architecture.md
│   └── deployment.md
├── tests/             # Contract tests
├── scripts/           # Deployment scripts
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- MetaMask or compatible Web3 wallet
- Somnia Testnet RPC access

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RealFi
   ```

2. **Install dependencies**
   ```bash
   # Install contract dependencies
   cd contracts
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy environment files
   cp contracts/.env.example contracts/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Add your private key and RPC URLs to .env files**

## 🚀 Deployment

### Somnia Testnet Configuration

- **Network Name**: Somnia Testnet
- **RPC URL**: `https://dream-rpc.somnia.network`
- **Chain ID**: `50312`
- **Block Explorer**: `https://shannon-explorer.somnia.network`

### Deploy Contracts

1. **Get testnet funds**
   - Visit Somnia Testnet Faucet: `https://faucet.somnia.network`
   - Request testnet tokens for deployment
   - Add Somnia Testnet to MetaMask with the configuration above

2. **Deploy to Somnia Testnet**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network somnia-testnet
   ```

3. **Update contract addresses**
   - Copy deployed contract addresses to frontend configuration
   - Update `frontend/src/config/contracts.js`

### Contract Addresses (Live on Somnia Testnet)

```
RealFiToken: 0x7941e8df64Ce12751e8823A058ebE9872371eFAc
UserProfile: 0x6C76a75860F150DC1A1fD3b369Dde113De02aD55
YieldVault: 0x16E4307A045b06B125446FE612860A98DF51f245
Leaderboard: 0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f
CrossChainBridge: 0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d
AIStrategy: 0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01
```

**Status**: All contracts successfully deployed and verified on Somnia Testnet

### Deployment Status

- ✅ **RealFiToken**: Deployed and verified
- ✅ **UserProfile**: Deployed and verified  
- ✅ **YieldVault**: Deployed and verified
- ✅ **Leaderboard**: Deployed and verified
- ✅ **CrossChainBridge**: Deployed and verified
- ✅ **AIStrategy**: Deployed and verified

**Total**: 6/6 contracts deployed successfully

**Explorer Links**:
- [RealFiToken](https://shannon-explorer.somnia.network/address/0x7941e8df64Ce12751e8823A058ebE9872371eFAc)
- [UserProfile](https://shannon-explorer.somnia.network/address/0x6C76a75860F150DC1A1fD3b369Dde113De02aD55)
- [YieldVault](https://shannon-explorer.somnia.network/address/0x16E4307A045b06B125446FE612860A98DF51f245)
- [Leaderboard](https://shannon-explorer.somnia.network/address/0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f)
- [CrossChainBridge](https://shannon-explorer.somnia.network/address/0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d)
- [AIStrategy](https://shannon-explorer.somnia.network/address/0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01)

## 🎮 Usage

### Frontend Application

1. **Start the development server**
   ```bash
   cd frontend
   npm start
   ```

2. **Connect your wallet**
   - Open MetaMask
   - Add Somnia Testnet (Chain ID: 50312, RPC: https://dream-rpc.somnia.network)
   - Switch to Somnia Testnet
   - Connect to the application

3. **Join Yield Battles**
   - Create or join existing battles
   - Deposit assets to start earning yield
   - Monitor your position on the leaderboard

4. **Cross-Chain Operations**
   - Bridge assets between supported networks
   - Monitor transaction status
   - View on Shannon Explorer: https://shannon-explorer.somnia.network

### Smart Contract Interaction

All interactions are live on Somnia Testnet:

- **User Registration**: `registerUser(string memory username)`
- **Deposit Assets**: `deposit(uint256 amount)`
- **Join Battle**: `joinBattle(uint256 battleId)`
- **Bridge Assets**: `bridgeAsset(address token, uint256 amount, uint256 targetChain)`
- **Claim Rewards**: `claimRewards(uint256 battleId)`

## 🧪 Testing

### Live Contract Tests

Run tests against deployed Somnia Testnet contracts:

```bash
cd contracts
npx hardhat test --network somnia-testnet
```

### Test Coverage

- User registration and profile management
- Yield vault deposits and withdrawals
- Leaderboard updates and rankings
- Cross-chain bridge functionality
- AI strategy scoring mechanics

## 📊 Monitoring

### Real-Time Data

- **Portfolio Value**: Live updates from on-chain data
- **Leaderboard**: Real-time rankings based on yield performance
- **Transaction Status**: Live transaction monitoring
- **Cross-Chain Events**: Bridge operation tracking

### Event Logging

All major events are logged on-chain:
- `UserRegistered(address user, string username)`
- `DepositMade(address user, uint256 amount)`
- `BattleJoined(address user, uint256 battleId)`
- `AssetBridged(address user, address token, uint256 amount, uint256 targetChain)`
- `RewardsClaimed(address user, uint256 amount)`

## 🔧 Troubleshooting

### Common Issues

1. **Transaction Failures**
   - Ensure sufficient gas fees
   - Check Somnia Testnet connectivity
   - Verify contract addresses

2. **Wallet Connection Issues**
   - Clear browser cache
   - Reset MetaMask account
   - Check network configuration

3. **Cross-Chain Bridge Issues**
   - Verify target chain connectivity
   - Check bridge contract status
   - Monitor transaction confirmations

### Support

- **Documentation**: Check `docs/` folder for detailed guides
- **Issues**: Report bugs via GitHub issues
- **Community**: Join Somnia Discord for support

## 🔐 Security

### Best Practices

- Never share private keys
- Use hardware wallets for large amounts
- Verify contract addresses before interaction
- Monitor transaction confirmations

### Audit Status

- Contracts are deployed on testnet for testing
- Production deployment requires full audit
- All interactions are transparent and verifiable on-chain

## 📈 Roadmap

- [ ] Mainnet deployment
- [ ] Additional chain support
- [ ] Advanced AI strategies
- [ ] Mobile application
- [ ] Governance token integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Somnia Testnet
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

This project is built for the Somnia Network hackathon with:
- ✅ Live, fully-on-chain functionality
- ✅ No mock data or placeholders
- ✅ Real-time cross-chain operations
- ✅ Production-ready smart contracts
- ✅ Complete documentation and testing

---

**Built with ❤️ for the Somnia Network Hackathon**