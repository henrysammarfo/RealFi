// RealFi DeFi Platform Contract Configuration
// Update these addresses after deploying to Somnia Testnet

export const SOMNIA_NETWORK = {
  chainId: 50312, // Somnia Testnet chain ID
  chainName: 'Somnia Testnet',
  rpcUrls: ['https://dream-rpc.somnia.network'],
  blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOM',
    decimals: 18,
  },
};

// Contract addresses - will be populated after deployment
export const CONTRACT_ADDRESSES = {
  RealFiToken: process.env.REACT_APP_REALFI_TOKEN_ADDRESS || '0x8c73284b55cb55EB46Dd42617bA6213037e602e9',
  UserProfile: process.env.REACT_APP_USER_PROFILE_ADDRESS || '0x41d87298B54d329872c29ec385367cD4C404e8e6',
  YieldVault: process.env.REACT_APP_YIELD_VAULT_ADDRESS || '0x2ABa80F8931d52DEE8e6732d213eabe795535660',
  Leaderboard: process.env.REACT_APP_LEADERBOARD_ADDRESS || '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f',
  CrossChainBridge: process.env.REACT_APP_CROSS_CHAIN_BRIDGE_ADDRESS || '0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d',
  AIStrategy: process.env.REACT_APP_AI_STRATEGY_ADDRESS || '0x809303cC124eABCDa2c6aFF9eefEd30EB662362a',
};

// Contract ABIs - these will be generated from the compiled contracts
export const CONTRACT_ABIS = {
  RealFiToken: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function mint(address to, uint256 amount)",
    "function burn(uint256 amount)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ],
  
  UserProfile: [
    "function registerUser(string memory username)",
    "function updateProfile(string memory username)",
    "function getUserData(address user) view returns (string, uint256, uint256, uint256, uint256, uint256, uint256, bool)",
    "function isUsernameAvailable(string memory username) view returns (bool)",
    "function getTotalStats() view returns (uint256, uint256)",
    "event UserRegistered(address indexed user, string username, uint256 timestamp)",
    "event UserUpdated(address indexed user, string username, uint256 timestamp)",
    "event ReputationUpdated(address indexed user, uint256 oldScore, uint256 newScore)"
  ],
  
  YieldVault: [
    "function deposit(uint256 amount)",
    "function withdraw(uint256 amount)",
    "function joinBattle(uint256 battleId, uint256 amount)",
    "function createBattle(string memory name, uint256 entryFee, uint256 maxParticipants, uint256 duration)",
    "function claimYield()",
    "function calculateYield(address user) view returns (uint256)",
    "function getUserPosition(address user) view returns (uint256, uint256, uint256, uint256, bool)",
    "function getBattleDetails(uint256 battleId) view returns (string, uint256, uint256, uint256, uint256, uint256, uint256, bool)",
    "function isUserInBattle(address user, uint256 battleId) view returns (bool)",
    "function getVaultStats() view returns (uint256, uint256, uint256)",
    "event DepositMade(address indexed user, uint256 amount, uint256 battleId, uint256 timestamp)",
    "event WithdrawalMade(address indexed user, uint256 amount, uint256 timestamp)",
    "event BattleJoined(address indexed user, uint256 indexed battleId, uint256 amount, uint256 timestamp)",
    "event BattleCreated(uint256 indexed battleId, string name, uint256 startTime, uint256 endTime, uint256 entryFee)"
  ],
  
  Leaderboard: [
    "function registerUser(address user, string memory username)",
    "function updateYieldScore(address user, uint256 yieldAmount, uint256 depositAmount)",
    "function updateBattleScore(address user, uint256 battleId, uint256 battleScore)",
    "function getUserRank(address user) view returns (uint256)",
    "function getTopUsers(uint256 count) view returns (address[], uint256[], string[])",
    "function getUserScoreDetails(address user) view returns (uint256, uint256, uint256, uint256, uint256)",
    "function getBattleLeaderboard(uint256 battleId) view returns (address[], uint256[])",
    "function getLeaderboardStats() view returns (uint256, uint256, address, uint256)",
    "event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore, uint256 timestamp)",
    "event LeaderboardUpdated(uint256 timestamp)"
  ],
  
  CrossChainBridge: [
    "function createBridgeRequest(address token, uint256 amount, uint8 targetChain)",
    "function processBridgeRequest(uint256 requestId, bytes32 transactionHash)",
    "function getBridgeRequest(uint256 requestId) view returns (address, address, uint256, uint8, uint8, uint256, bool, bytes32)",
    "function getUserBridgeRequests(address user) view returns (uint256[])",
    "function calculateBridgeFee(uint256 amount, uint8 targetChain) view returns (uint256)",
    "function getBridgeStats() view returns (uint256, uint256, uint256)",
    "event BridgeRequestCreated(uint256 indexed requestId, address indexed user, address token, uint256 amount, uint8 sourceChain, uint8 targetChain, uint256 timestamp)",
    "event AssetBridged(address indexed user, address token, uint256 amount, uint8 sourceChain, uint8 targetChain, bytes32 transactionHash, uint256 timestamp)"
  ],
  
  AIStrategy: [
    "function adoptStrategy(uint256 strategyId, uint256 depositAmount)",
    "function completeStrategy(uint256 strategyIndex)",
    "function generateAIRecommendations(address user) view returns (uint256[], uint256)",
    "function getUserActiveStrategies(address user) view returns (uint256[], uint256[], uint256[])",
    "function getStrategyDetails(uint256 strategyId) view returns (string, string, uint256, uint256, uint256, uint256, uint256, bool, uint256, uint256, uint256)",
    "function getCurrentMarketCondition() view returns (uint256, uint256, uint256, uint256, uint256)",
    "function getAIStrategyStats() view returns (uint256, uint256, uint256)",
    "event StrategyAdopted(address indexed user, uint256 indexed strategyId, uint256 depositAmount, uint256 expectedReturn, uint256 timestamp)",
    "event StrategyCompleted(address indexed user, uint256 indexed strategyId, uint256 actualReturn, uint256 performanceScore, uint256 timestamp)",
    "event AIRecommendationGenerated(address indexed user, uint256[] recommendedStrategies, uint256 confidence, uint256 timestamp)"
  ]
};

// Chain IDs for cross-chain bridge
export const CHAIN_IDS = {
  ETHEREUM: 0,
  POLYGON: 1,
  BSC: 2,
  SOMNIA: 3,
} as const;

export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS];

// Network configuration for MetaMask
export const NETWORK_CONFIG = {
  chainId: `0x${SOMNIA_NETWORK.chainId.toString(16)}`,
  chainName: SOMNIA_NETWORK.chainName,
  rpcUrls: SOMNIA_NETWORK.rpcUrls,
  blockExplorerUrls: SOMNIA_NETWORK.blockExplorerUrls,
  nativeCurrency: SOMNIA_NETWORK.nativeCurrency,
};
