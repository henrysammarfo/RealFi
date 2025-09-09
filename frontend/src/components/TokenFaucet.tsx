import React, { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';

interface TokenFaucetProps {
  className?: string;
}

const TokenFaucet: React.FC<TokenFaucetProps> = ({ className = '' }) => {
  const { account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState('1000');

  const handleMintTokens = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(mintAmount);
    if (amount <= 0 || amount > 10000) {
      setError('Amount must be between 1 and 10,000 RFT');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Mint RFT tokens using public mint function
      const tx = await contractService.publicMint(mintAmount);
      const receipt = await contractService.waitForTransaction(tx.hash);
      
      setSuccess(`Successfully minted ${mintAmount} RFT tokens! Transaction: ${receipt.hash}`);
    } catch (error: any) {
      console.error('Failed to mint tokens:', error);
      setError(error.message || 'Failed to mint tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Get RFT Tokens</h3>
      <p className="text-gray-600 mb-4">
        New users can mint RFT tokens to start participating in yield battles and DeFi activities.
      </p>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
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

      <div className="flex space-x-4">
        <input
          type="number"
          value={mintAmount}
          onChange={(e) => setMintAmount(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Amount to mint (1-10,000 RFT)"
          min="1"
          max="10000"
        />
        <button
          onClick={handleMintTokens}
          disabled={loading || !isConnected}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Minting...' : 'Mint RFT Tokens'}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Maximum 10,000 RFT tokens per mint. Use responsibly for testing purposes.
      </p>
    </div>
  );
};

export default TokenFaucet;
