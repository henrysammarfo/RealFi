import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractService } from '../services/contractService';
import { SOMNIA_NETWORK, NETWORK_CONFIG } from '../config/network';
import { CONTRACT_ADDRESSES } from '../config/contracts';

export interface Web3State {
  isConnected: boolean;
  isCorrectNetwork: boolean;
  account: string | null;
  chainId: number | null;
  balance: string;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  error: string | null;
  loading: boolean;
}

export const useWeb3 = () => {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
    isCorrectNetwork: false,
    account: null,
    chainId: null,
    balance: '0',
    provider: null,
    signer: null,
    error: null,
    loading: false,
  });

  const updateState = useCallback((updates: Partial<Web3State>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });

      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if connected to Somnia Testnet
      const isCorrectNetwork = chainId === SOMNIA_NETWORK.chainId;

      if (!isCorrectNetwork) {
        updateState({
          isConnected: true,
          isCorrectNetwork: false,
          account,
          chainId,
          provider,
          signer,
          loading: false,
          error: `Please switch to Somnia Testnet (Chain ID: ${SOMNIA_NETWORK.chainId})`,
        });
        return;
      }

      // Get balance
      const balance = await provider.getBalance(account);
      const balanceFormatted = ethers.formatEther(balance);

      // Initialize contract service
      await contractService.initialize(provider, signer, account);

      updateState({
        isConnected: true,
        isCorrectNetwork: true,
        account,
        chainId,
        balance: balanceFormatted,
        provider,
        signer,
        loading: false,
        error: null,
      });

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      updateState({
        loading: false,
        error: error.message || 'Failed to connect wallet',
      });
    }
  }, [updateState]);

  const switchToSomniaNetwork = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });

      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Try to switch to Somnia Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });

      // Refresh connection after network switch
      await connectWallet();

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
          // Refresh connection after adding network
          await connectWallet();
        } catch (addError) {
          console.error('Failed to add Somnia network:', addError);
          updateState({
            loading: false,
            error: 'Failed to add Somnia Testnet to MetaMask',
          });
        }
      } else {
        console.error('Failed to switch to Somnia network:', switchError);
        updateState({
          loading: false,
          error: 'Failed to switch to Somnia Testnet',
        });
      }
    }
  }, [connectWallet, updateState]);

  const disconnectWallet = useCallback(() => {
    contractService.disconnect();
    updateState({
      isConnected: false,
      isCorrectNetwork: false,
      account: null,
      chainId: null,
      balance: '0',
      provider: null,
      signer: null,
      error: null,
      loading: false,
    });
  }, [updateState]);

  const refreshBalance = useCallback(async () => {
    if (!state.provider || !state.account) return;

    try {
      const balance = await state.provider.getBalance(state.account);
      const balanceFormatted = ethers.formatEther(balance);
      updateState({ balance: balanceFormatted });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.provider, state.account, updateState]);

  // Initialize wallet connection on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Failed to initialize wallet:', error);
        }
      }
    };

    initializeWallet();
  }, [connectWallet]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId: string) => {
        connectWallet();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectWallet, disconnectWallet]);

  // Utility methods for components
  const getContract = (contractName: keyof typeof CONTRACT_ADDRESSES) => {
    return contractService.getContract(contractName);
  };

  const formatAmount = (amount: string, decimals: number = 4) => {
    return contractService.formatAmount(amount, decimals);
  };

  const parseAmount = (amount: string) => {
    return ethers.parseEther(amount);
  };

  const waitForTransaction = async (txHash: string) => {
    return await contractService.waitForTransaction(txHash);
  };

  const formatAddress = (address: string) => {
    return contractService.formatAddress(address);
  };

  const switchNetwork = switchToSomniaNetwork; // Alias for compatibility

  return {
    ...state,
    connectWallet,
    switchToSomniaNetwork,
    switchNetwork, // Alias for compatibility
    disconnectWallet,
    refreshBalance,
    getContract,
    formatAmount,
    parseAmount,
    waitForTransaction,
    formatAddress,
  };
};