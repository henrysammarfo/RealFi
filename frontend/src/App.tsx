import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import UserProfile from './components/UserProfile';
import YieldBattles from './components/YieldBattles';
import { useWeb3 } from './hooks/useWeb3';

function App() {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const [activeTab, setActiveTab] = useState<'profile' | 'battles' | 'leaderboard' | 'bridge' | 'ai'>('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'battles', name: 'Yield Battles', icon: '⚔️' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    { id: 'bridge', name: 'Cross-Chain Bridge', icon: '🌉' },
    { id: 'ai', name: 'AI Strategies', icon: '🤖' },
  ] as const;

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">RealFi</h1>
              <p className="text-gray-600">Cross-Chain DeFi Portfolio Manager</p>
            </div>
            <WalletConnect />
          </div>
        </div>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">RealFi</h1>
              <p className="text-gray-600">Cross-Chain DeFi Portfolio Manager</p>
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
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>

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
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'profile' && <UserProfile />}
          {activeTab === 'battles' && <YieldBattles />}
          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Leaderboard</h2>
              <p className="text-gray-500">Leaderboard component coming soon...</p>
            </div>
          )}
          {activeTab === 'bridge' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cross-Chain Bridge</h2>
              <p className="text-gray-500">Cross-chain bridge component coming soon...</p>
            </div>
          )}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Strategies</h2>
              <p className="text-gray-500">AI strategies component coming soon...</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500">
              <p className="mb-2">RealFi - Cross-Chain DeFi Portfolio Manager</p>
              <p className="text-sm">
                Built for Somnia Network Hackathon • 
                <a href="https://testnet-explorer.somnia.network" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 ml-1">
                  Somnia Explorer
                </a>
                {' • '}
                <a href="https://faucet.somnia.network" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                  Get Testnet Tokens
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  return renderContent();
}

export default App;