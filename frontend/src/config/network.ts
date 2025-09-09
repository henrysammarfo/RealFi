// Somnia Testnet Network Configuration
export const SOMNIA_NETWORK = {
  chainId: 50312,
  chainName: 'Somnia Testnet',
  rpcUrls: ['https://dream-rpc.somnia.network'],
  blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'STT', // Updated to STT as requested
    decimals: 18,
  },
};

// Network configuration for MetaMask
export const NETWORK_CONFIG = {
  chainId: `0x${SOMNIA_NETWORK.chainId.toString(16)}`,
  chainName: SOMNIA_NETWORK.chainName,
  rpcUrls: SOMNIA_NETWORK.rpcUrls,
  blockExplorerUrls: SOMNIA_NETWORK.blockExplorerUrls,
  nativeCurrency: SOMNIA_NETWORK.nativeCurrency,
};

// Chain IDs for cross-chain bridge
export const CHAIN_IDS = {
  ETHEREUM: 0,
  POLYGON: 1,
  BSC: 2,
  SOMNIA: 3,
} as const;

export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS];

// Chain configurations for bridge
export const CHAIN_CONFIGS = {
  [CHAIN_IDS.ETHEREUM]: {
    name: 'Ethereum',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    rpc: 'https://eth-mainnet.alchemyapi.io/v2/demo',
  },
  [CHAIN_IDS.POLYGON]: {
    name: 'Polygon',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    rpc: 'https://polygon-rpc.com',
  },
  [CHAIN_IDS.BSC]: {
    name: 'BSC',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    rpc: 'https://bsc-dataseed.binance.org',
  },
  [CHAIN_IDS.SOMNIA]: {
    name: 'Somnia',
    symbol: 'STT',
    explorer: 'https://shannon-explorer.somnia.network',
    rpc: 'https://dream-rpc.somnia.network',
  },
};
