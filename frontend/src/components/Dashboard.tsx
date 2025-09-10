import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';
import UserProfile from './UserProfile';
import YieldBattles from './YieldBattles';
import Leaderboard from './Leaderboard';
import CrossChainBridge from './CrossChainBridge';
import AIStrategies from './AIStrategies';
import WalletConnect from './WalletConnect';
import TransactionTracker from './TransactionTracker';
import TokenFaucet from './TokenFaucet';

interface DashboardStats {
  totalUsers: number;
  totalDeposits: string;
  totalBattles: number;
  totalVolume: string;
  userRank: number;
  userScore: number;
}

const Dashboard: React.FC = () => {
  const { isConnected, isCorrectNetwork, account } = useWeb3();
  const [activeTab, setActiveTab] = useState<'profile' | 'battles' | 'leaderboard' | 'bridge' | 'ai'>('profile');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤', description: 'User registration and profile management' },
    { id: 'battles', name: 'Yield Battles', icon: '⚔️', description: 'Join battles and earn yield' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆', description: 'View rankings and scores' },
    { id: 'bridge', name: 'Cross-Chain Bridge', icon: '🌉', description: 'Bridge assets between chains' },
    { id: 'ai', name: 'AI Strategies', icon: '🤖', description: 'AI-powered investment strategies' },
  ] as const;

  const loadDashboardStats = useCallback(async () => {
    if (!isConnected || !account) return;

    try {
      setLoading(true);
      
      // Refresh contracts to ensure we're using the latest addresses
      contractService.refreshContracts();

      // Load user profile data
      const userData = await contractService.getUserData(account);
      
      // Load vault position
      const vaultPosition = await contractService.getUserPosition(account);
      
      // Load token balance
      await contractService.getTokenBalance(account);
      
      // Load leaderboard rank
      const userRank = await contractService.getUserRank(account);

      // Load platform stats (from UserProfile contract)
      const userProfileContract = contractService.getContract('UserProfile');
      const [totalUsers, totalBattles] = await userProfileContract?.getTotalStats() || [0, 0];

      setStats({
        totalUsers: Number(totalUsers),
        totalDeposits: vaultPosition.depositedAmount,
        totalBattles: Number(totalBattles),
        totalVolume: '0', // Would need to calculate from events
        userRank: userRank || 0,
        userScore: userData.reputationScore,
      });

    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, account]);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      loadDashboardStats();
    }
  }, [isConnected, isCorrectNetwork, loadDashboardStats]);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">RealFi</h1>
              <p className="text-gray-600">Cross-Chain DeFi Portfolio Manager</p>
              <p className="text-sm text-gray-500 mt-2">Built for Somnia Network Hackathon</p>
            </div>
            <WalletConnect />
          </div>
        </div>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">RealFi</h1>
              <p className="text-red-600 mb-4">Please switch to Somnia Testnet</p>
              <p className="text-sm text-gray-600">Chain ID: 50312</p>
            </div>
            <WalletConnect />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">RealFi</h1>
                <span className="ml-2 text-sm text-gray-500">DeFi Platform</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Live on Somnia
                </span>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* Dashboard Stats */}
        {stats && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                  <div className="text-sm text-blue-800">Total Users</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.totalDeposits} RFT</div>
                  <div className="text-sm text-green-800">Your Deposits</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalBattles}</div>
                  <div className="text-sm text-purple-800">Active Battles</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">#{stats.userRank || 'N/A'}</div>
                  <div className="text-sm text-orange-800">Your Rank</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-600">{stats.userScore}</div>
                  <div className="text-sm text-indigo-800">Reputation Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{tab.icon}</span>
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <TokenFaucet />
                <UserProfile />
              </div>
            )}
            {activeTab === 'battles' && <YieldBattles />}
            {activeTab === 'leaderboard' && <Leaderboard />}
            {activeTab === 'bridge' && <CrossChainBridge />}
            {activeTab === 'ai' && <AIStrategies />}
          </div>
        </main>

        {/* Transaction Tracker */}
        <TransactionTracker />

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500">
              <p className="mb-2">RealFi - Cross-Chain DeFi Portfolio Manager</p>
              <p className="text-sm">
                Built for Somnia Network Hackathon • 
                <a href="https://shannon-explorer.somnia.network" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 ml-1">
                  Shannon Explorer
                </a>
                {' • '}
                <a href="https://faucet.somnia.network" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                  Get Testnet Tokens
                </a>
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Live Contract Addresses:</p>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  <span>RealFiToken: {contractService.formatAddress('0x7941e8df64Ce12751e8823A058ebE9872371eFAc')}</span>
                  <span>UserProfile: {contractService.formatAddress('0x6C76a75860F150DC1A1fD3b369Dde113De02aD55')}</span>
                  <span>YieldVault: {contractService.formatAddress('0x34F50ebC45BAeEdA521652280FbfF294E39E896D')}</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  return renderContent();
};

export default Dashboard;
