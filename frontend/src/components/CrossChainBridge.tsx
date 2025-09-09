import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';
import { CHAIN_IDS, CHAIN_CONFIGS } from '../config/contracts';

interface BridgeRequest {
  id: number;
  user: string;
  token: string;
  amount: string;
  sourceChain: number;
  targetChain: number;
  status: number;
  timestamp: number;
  transactionHash: string;
}

interface CrossChainBridgeProps {
  className?: string;
}

const CrossChainBridge: React.FC<CrossChainBridgeProps> = ({ className = '' }) => {
  const { account, isConnected } = useWeb3();
  const [bridgeRequests, setBridgeRequests] = useState<BridgeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [targetChain, setTargetChain] = useState<number>(CHAIN_IDS.ETHEREUM);
  const [tokenAddress, setTokenAddress] = useState('0x1d82f5Da580b43b708617A8947Eeab0D38152077');

  useEffect(() => {
    if (isConnected && account) {
      loadBridgeRequests();
    }
  }, [isConnected, account]);

  const loadBridgeRequests = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const requestIds = await contractService.getUserBridgeRequests(account);
      const requests: BridgeRequest[] = [];

      for (const id of requestIds) {
        try {
          const bridgeContract = contractService.getContract('CrossChainBridge');
          if (bridgeContract) {
            const request = await bridgeContract.getBridgeRequest(id);
            requests.push({
              id: Number(id),
              user: request[0],
              token: request[1],
              amount: request[2].toString(),
              sourceChain: Number(request[3]),
              targetChain: Number(request[4]),
              status: Number(request[5]),
              timestamp: Number(request[6]),
              transactionHash: request[7] || ''
            });
          }
        } catch (error) {
          console.log(`Failed to load bridge request ${id}`);
        }
      }

      setBridgeRequests(requests.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error: any) {
      console.error('Failed to load bridge requests:', error);
      setError('Failed to load bridge requests');
    } finally {
      setLoading(false);
    }
  };

  const handleBridgeRequest = async () => {
    if (!bridgeAmount || !targetChain) {
      setError('Please enter amount and select target chain');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // First approve tokens for bridge contract
      const bridgeContractAddress = '0x99b73Eee17e17553C824FCBC694fd01F31908193';
      const approveTx = await contractService.approveToken(bridgeContractAddress, bridgeAmount);
      await contractService.waitForTransaction(approveTx.hash);

      // Then create bridge request
      const tx = await contractService.createBridgeRequest(tokenAddress, bridgeAmount, targetChain);
      const receipt = await contractService.waitForTransaction(tx.hash);
      
      setSuccess(`Bridge request created successfully! Transaction: ${receipt.hash}`);
      setBridgeAmount('');
      
      // Reload bridge requests
      await loadBridgeRequests();
    } catch (error: any) {
      console.error('Failed to create bridge request:', error);
      setError(error.message || 'Failed to create bridge request');
    } finally {
      setLoading(false);
    }
  };

  const getChainName = (chainId: number) => {
    return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]?.name || 'Unknown';
  };

  const getChainSymbol = (chainId: number) => {
    return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]?.symbol || 'UNK';
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Completed';
      case 3: return 'Failed';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.0000' : (num / 1e18).toFixed(4);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cross-Chain Bridge</h2>
        <p className="text-gray-600">Bridge your assets between different blockchain networks</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bridge Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Bridge Request</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (RFT)</label>
            <input
              type="number"
              value={bridgeAmount}
              onChange={(e) => setBridgeAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Chain</label>
            <select
              value={targetChain}
              onChange={(e) => setTargetChain(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={CHAIN_IDS.ETHEREUM}>Ethereum</option>
              <option value={CHAIN_IDS.POLYGON}>Polygon</option>
              <option value={CHAIN_IDS.BSC}>BSC</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Token contract address"
          />
        </div>
        <button
          onClick={handleBridgeRequest}
          disabled={loading || !bridgeAmount || !targetChain}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Request...' : 'Create Bridge Request'}
        </button>
      </div>

      {/* Bridge History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Bridge History</h3>
          <button
            onClick={loadBridgeRequests}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bridge requests...</p>
          </div>
        ) : bridgeRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No bridge requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bridgeRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-lg font-semibold text-gray-900">Request #{request.id}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-medium">{formatAmount(request.amount)} RFT</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Target Chain:</span>
                        <span className="ml-2 font-medium">{getChainName(request.targetChain)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2 font-medium">{formatTime(request.timestamp)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Token:</span>
                        <span className="ml-2 font-medium">{request.token.slice(0, 10)}...</span>
                      </div>
                    </div>
                  </div>
                  {request.transactionHash && (
                    <a
                      href={contractService.getExplorerUrl(request.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 ml-4"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supported Chains */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Networks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(CHAIN_CONFIGS).map(([chainId, config]) => (
            <div key={chainId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{config.symbol}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{config.name}</div>
                  <div className="text-sm text-gray-600">{config.symbol}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrossChainBridge;