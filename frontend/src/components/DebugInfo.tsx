import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';

const DebugInfo: React.FC = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testContracts = async () => {
    if (!provider || !signer || !account) return;

    setLoading(true);
    const info: any = {};

    try {
      // Test UserProfile
      const userProfileContract = new (await import('ethers')).Contract(
        CONTRACT_ADDRESSES.UserProfile,
        CONTRACT_ABIS.UserProfile,
        signer
      );

      const userData = await userProfileContract.getUserData(account);
      info.userProfile = {
        username: userData[0],
        registrationTime: Number(userData[1]),
        totalDeposits: userData[2].toString(),
        totalWithdrawals: userData[3].toString(),
        battlesJoined: Number(userData[4]),
        battlesWon: Number(userData[5]),
        reputationScore: Number(userData[6]),
        isActive: userData[7]
      };

      // Test RealFiToken
      const tokenContract = new (await import('ethers')).Contract(
        CONTRACT_ADDRESSES.RealFiToken,
        CONTRACT_ABIS.RealFiToken,
        signer
      );

      const balance = await tokenContract.balanceOf(account);
      info.tokenBalance = (await import('ethers')).formatEther(balance);

      // Test YieldVault
      const vaultContract = new (await import('ethers')).Contract(
        CONTRACT_ADDRESSES.YieldVault,
        CONTRACT_ABIS.YieldVault,
        signer
      );

      const position = await vaultContract.getUserPosition(account);
      info.vaultPosition = {
        depositedAmount: (await import('ethers')).formatEther(position[0]),
        depositTime: Number(position[1]),
        lastUpdateTime: Number(position[2]),
        yieldEarned: (await import('ethers')).formatEther(position[3]),
        isActive: position[4]
      };

      setDebugInfo(info);

    } catch (error: any) {
      console.error('Debug test failed:', error);
      info.error = error.message;
      setDebugInfo(info);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && account) {
      testContracts();
    }
  }, [isConnected, account]);

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Info</h3>
        <p className="text-yellow-700">Please connect your wallet to see debug information.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Debug Info</h3>
        <button
          onClick={testContracts}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <strong>Account:</strong> {account}
        </div>
        <div>
          <strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}
        </div>
        
        {debugInfo.userProfile && (
          <div className="bg-white p-3 rounded border">
            <strong>UserProfile Data:</strong>
            <pre className="mt-1 text-xs overflow-auto">
              {JSON.stringify(debugInfo.userProfile, null, 2)}
            </pre>
          </div>
        )}

        {debugInfo.tokenBalance && (
          <div className="bg-white p-3 rounded border">
            <strong>Token Balance:</strong> {debugInfo.tokenBalance} RFT
          </div>
        )}

        {debugInfo.vaultPosition && (
          <div className="bg-white p-3 rounded border">
            <strong>Vault Position:</strong>
            <pre className="mt-1 text-xs overflow-auto">
              {JSON.stringify(debugInfo.vaultPosition, null, 2)}
            </pre>
          </div>
        )}

        {debugInfo.error && (
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <strong className="text-red-800">Error:</strong>
            <p className="text-red-700 text-xs mt-1">{debugInfo.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugInfo;
