import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, NETWORK_CONFIG } from '../config/contracts';

export interface Web3State {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

export class Web3Service {
  private static instance: Web3Service;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private account: string | null = null;
  private chainId: number | null = null;
  private listeners: ((state: Web3State) => void)[] = [];

  private constructor() {}

  public static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  public async connectWallet(): Promise<Web3State> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();
      this.chainId = Number((await this.provider.getNetwork()).chainId);

      // Check if we're on the correct network
      const isCorrectNetwork = this.chainId === parseInt(NETWORK_CONFIG.chainId, 16);

      const state: Web3State = {
        provider: this.provider,
        signer: this.signer,
        account: this.account,
        chainId: this.chainId,
        isConnected: true,
        isCorrectNetwork,
      };

      this.notifyListeners(state);
      return state;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  public async switchToSomniaNetwork(): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          if (!window.ethereum) {
            throw new Error('MetaMask not installed');
          }
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to add Somnia network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to Somnia network:', switchError);
        throw switchError;
      }
    }
  }

  public async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;

    const state: Web3State = {
      provider: null,
      signer: null,
      account: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false,
    };

    this.notifyListeners(state);
  }

  public getCurrentState(): Web3State {
    return {
      provider: this.provider,
      signer: this.signer,
      account: this.account,
      chainId: this.chainId,
      isConnected: !!this.account,
      isCorrectNetwork: this.chainId === parseInt(NETWORK_CONFIG.chainId, 16),
    };
  }

  public subscribe(listener: (state: Web3State) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(state: Web3State): void {
    this.listeners.forEach(listener => listener(state));
  }

  public async getContract(contractName: keyof typeof CONTRACT_ADDRESSES) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const address = CONTRACT_ADDRESSES[contractName];
    if (!address) {
      throw new Error(`Contract address not found for ${contractName}`);
    }

    const abi = CONTRACT_ABIS[contractName];
    return new ethers.Contract(address, abi, this.signer);
  }

  public async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      CONTRACT_ABIS.RealFiToken,
      this.provider
    );

    const balance = await tokenContract.balanceOf(userAddress);
    return ethers.formatEther(balance);
  }

  public async getETHBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  public async waitForTransaction(txHash: string): Promise<ethers.TransactionReceipt> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    const receipt = await this.provider.waitForTransaction(txHash);
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }
    return receipt;
  }

  public formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  public formatAmount(amount: string, decimals: number = 18): string {
    try {
      return parseFloat(ethers.formatUnits(amount, decimals)).toFixed(4);
    } catch {
      return '0.0000';
    }
  }

  public parseAmount(amount: string, decimals: number = 18): string {
    try {
      return ethers.parseUnits(amount, decimals).toString();
    } catch {
      return '0';
    }
  }
}

// Initialize event listeners for wallet changes
if (typeof window !== 'undefined' && window.ethereum) {
  const web3Service = Web3Service.getInstance();

  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      web3Service.disconnectWallet();
    } else {
      web3Service.connectWallet();
    }
  });

  window.ethereum.on('chainChanged', (chainId: string) => {
    web3Service.connectWallet();
  });
}

export default Web3Service;
