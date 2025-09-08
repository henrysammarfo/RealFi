import { useState, useEffect, useCallback } from 'react';
import Web3Service, { Web3State } from '../services/web3Service';

export const useWeb3 = () => {
  const [state, setState] = useState<Web3State>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const web3Service = Web3Service.getInstance();

  useEffect(() => {
    const unsubscribe = web3Service.subscribe((newState) => {
      setState(newState);
    });

    // Set initial state
    setState(web3Service.getCurrentState());

    return unsubscribe;
  }, [web3Service]);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await web3Service.connectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, [web3Service]);

  const switchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await web3Service.switchToSomniaNetwork();
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  }, [web3Service]);

  const disconnectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await web3Service.disconnectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet');
    } finally {
      setLoading(false);
    }
  }, [web3Service]);

  const getContract = useCallback(async (contractName: keyof typeof import('../config/contracts').CONTRACT_ADDRESSES) => {
    try {
      return await web3Service.getContract(contractName);
    } catch (err: any) {
      setError(err.message || 'Failed to get contract');
      throw err;
    }
  }, [web3Service]);

  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress: string) => {
    try {
      return await web3Service.getTokenBalance(tokenAddress, userAddress);
    } catch (err: any) {
      setError(err.message || 'Failed to get token balance');
      throw err;
    }
  }, [web3Service]);

  const getETHBalance = useCallback(async (address: string) => {
    try {
      return await web3Service.getETHBalance(address);
    } catch (err: any) {
      setError(err.message || 'Failed to get ETH balance');
      throw err;
    }
  }, [web3Service]);

  const waitForTransaction = useCallback(async (txHash: string) => {
    try {
      return await web3Service.waitForTransaction(txHash);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      throw err;
    }
  }, [web3Service]);

  const formatAddress = useCallback((address: string) => {
    return web3Service.formatAddress(address);
  }, [web3Service]);

  const formatAmount = useCallback((amount: string, decimals: number = 18) => {
    return web3Service.formatAmount(amount, decimals);
  }, [web3Service]);

  const parseAmount = useCallback((amount: string, decimals: number = 18) => {
    return web3Service.parseAmount(amount, decimals);
  }, [web3Service]);

  return {
    ...state,
    loading,
    error,
    connectWallet,
    switchNetwork,
    disconnectWallet,
    getContract,
    getTokenBalance,
    getETHBalance,
    waitForTransaction,
    formatAddress,
    formatAmount,
    parseAmount,
  };
};
