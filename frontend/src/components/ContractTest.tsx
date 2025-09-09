import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';

const ContractTest: React.FC = () => {
  const { account, isConnected } = useWeb3();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runContractTests = async () => {
    if (!isConnected || !account) return;

    setLoading(true);
    const results: any = {};

    // First, check which contract addresses are being used
    const { CONTRACT_ADDRESSES } = await import('../config/contracts');
    results.contractAddresses = CONTRACT_ADDRESSES;

    try {
      // Test 1: Get total stats
      console.log('Testing getTotalStats...');
      const totalStats = await contractService.getTotalStats();
      results.totalStats = totalStats;
      console.log('Total stats result:', totalStats);

      // Test 2: Get leaderboard stats directly
      console.log('Testing leaderboard contract directly...');
      const leaderboardContract = contractService.getContract('Leaderboard');
      if (leaderboardContract) {
        const [totalUsers, lastUpdateTime, topUser, topScore] = await leaderboardContract.getLeaderboardStats();
        results.leaderboardStats = {
          totalUsers: Number(totalUsers),
          lastUpdateTime: new Date(Number(lastUpdateTime) * 1000).toLocaleString(),
          topUser: topUser,
          topScore: Number(topScore)
        };
        console.log('Leaderboard stats result:', results.leaderboardStats);
      }

      // Test 3: Get top users
      console.log('Testing getTopUsers...');
      const topUsers = await contractService.getTopUsers(5);
      results.topUsers = topUsers;
      console.log('Top users result:', topUsers);

      // Test 4: Get user profile data
      console.log('Testing getUserData...');
      const userData = await contractService.getUserData(account);
      results.userData = userData;
      console.log('User data result:', userData);

      // Test 5: Get token balance
      console.log('Testing getTokenBalance...');
      const tokenBalance = await contractService.getTokenBalance(account);
      results.tokenBalance = tokenBalance;
      console.log('Token balance result:', tokenBalance);

    } catch (error: any) {
      console.error('Contract test error:', error);
      results.error = error.message;
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (isConnected && account) {
      runContractTests();
    }
  }, [isConnected, account]);

  if (!isConnected) {
    return <div className="p-4 bg-yellow-100 rounded-lg">Please connect your wallet to run contract tests</div>;
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Contract Connection Test</h3>
      <p className="text-sm text-gray-600 mb-4">Account: {account}</p>
      
      <button
        onClick={runContractTests}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Run Contract Tests'}
      </button>

      {testResults && (
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Test Results:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ContractTest;
