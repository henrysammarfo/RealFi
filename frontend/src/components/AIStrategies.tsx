import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';

interface AIStrategy {
  strategyId: number;
  name: string;
  description: string;
  riskLevel: number;
  expectedReturn: number;
  minDeposit: number;
  maxDeposit: number;
  duration: number;
  successRate: number;
  isActive: boolean;
  totalAdopted: number;
  totalReturn: number;
}

interface UserStrategy {
  strategyId: number;
  amount: string;
  startTime: number;
}

interface MarketCondition {
  volatility: number;
  trend: number;
  liquidity: number;
  risk: number;
  opportunity: number;
}

interface AIStrategiesProps {
  className?: string;
}

const AIStrategies: React.FC<AIStrategiesProps> = ({ className = '' }) => {
  const { account, isConnected } = useWeb3();
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);
  const [userStrategies, setUserStrategies] = useState<UserStrategy[]>([]);
  const [marketCondition, setMarketCondition] = useState<MarketCondition | null>(null);
  const [recommendations, setRecommendations] = useState<number[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [showAdoptModal, setShowAdoptModal] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      loadStrategies();
      loadUserStrategies();
      loadMarketCondition();
    }
  }, [isConnected, account]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available strategies from live contract only
      const strategiesList: AIStrategy[] = [];
      const aiStrategyContract = contractService.getContract('AIStrategy');
      
      if (aiStrategyContract) {
        // Try to load strategies 1-10 from live contract
        for (let i = 1; i <= 10; i++) {
          try {
            const strategyData = await aiStrategyContract.getStrategyDetails(i);
            strategiesList.push({
              strategyId: i,
              name: strategyData[0] || `Strategy ${i}`,
              description: strategyData[1] || `AI-powered strategy ${i}`,
              riskLevel: Number(strategyData[2]) || 1,
              expectedReturn: Number(strategyData[3]) || 0,
              minDeposit: Number(strategyData[4]) || 0,
              maxDeposit: Number(strategyData[5]) || 0,
              duration: Number(strategyData[6]) || 0,
              successRate: Number(strategyData[7]) || 0,
              isActive: strategyData[8] !== undefined ? strategyData[8] : false,
              totalAdopted: Number(strategyData[9]) || 0,
              totalReturn: Number(strategyData[10]) || 0
            });
          } catch (error) {
            // Strategy not found in contract, skip
            console.log(`Strategy ${i} not found in live contract`);
          }
        }
      }

      setStrategies(strategiesList);
    } catch (error: any) {
      console.error('Failed to load strategies:', error);
      setError('Failed to load AI strategies from live contract');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStrategies = async () => {
    if (!account) return;

    try {
      const userStrategiesData = await contractService.getUserActiveStrategies(account);
      setUserStrategies(userStrategiesData);
    } catch (error: any) {
      console.error('Failed to load user strategies:', error);
    }
  };

  const loadMarketCondition = async () => {
    try {
      const aiStrategyContract = contractService.getContract('AIStrategy');
      if (aiStrategyContract) {
        const marketData = await aiStrategyContract.getCurrentMarketCondition();
        setMarketCondition({
          volatility: Number(marketData[0]) || 0,
          trend: Number(marketData[1]) || 0,
          liquidity: Number(marketData[2]) || 0,
          risk: Number(marketData[3]) || 0,
          opportunity: Number(marketData[4]) || 0
        });
      }
    } catch (error: any) {
      console.error('Failed to load market condition:', error);
      setError('Failed to load live market data from contract');
    }
  };

  const getRecommendations = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const recData = await contractService.generateAIRecommendations(account);
      setRecommendations(recData.strategies);
      setConfidence(recData.confidence);
    } catch (error: any) {
      console.error('Failed to get recommendations:', error);
      setError('Failed to get live AI recommendations from contract');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptStrategy = async () => {
    if (!selectedStrategy || !depositAmount) {
      setError('Please select a strategy and enter deposit amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const tx = await contractService.adoptStrategy(selectedStrategy, depositAmount);
      const receipt = await contractService.waitForTransaction(tx.hash);
      
      setSuccess(`Strategy adopted successfully! Transaction: ${receipt.hash}`);
      setShowAdoptModal(false);
      setDepositAmount('');
      setSelectedStrategy(null);
      
      // Reload user strategies
      await loadUserStrategies();
    } catch (error: any) {
      console.error('Failed to adopt strategy:', error);
      setError(error.message || 'Failed to adopt strategy');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel <= 2) return 'bg-green-100 text-green-800';
    if (riskLevel <= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskText = (riskLevel: number) => {
    if (riskLevel <= 2) return 'Low Risk';
    if (riskLevel <= 4) return 'Medium Risk';
    return 'High Risk';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Live AI Strategies</h2>
        <p className="text-gray-600">AI-powered investment strategies with live market analysis</p>
        <div className="mt-2 text-sm text-green-600 font-medium">
          All data loaded from live Somnia Testnet contracts
        </div>
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

      {/* Live Market Condition */}
      {marketCondition && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Market Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{marketCondition.volatility}%</div>
              <div className="text-sm text-blue-800">Volatility</div>
              <div className="text-xs text-blue-600 mt-1">Live from contract</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{marketCondition.trend}%</div>
              <div className="text-sm text-green-800">Trend</div>
              <div className="text-xs text-green-600 mt-1">Live from contract</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{marketCondition.liquidity}%</div>
              <div className="text-sm text-purple-800">Liquidity</div>
              <div className="text-xs text-purple-600 mt-1">Live from contract</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{marketCondition.risk}%</div>
              <div className="text-sm text-orange-800">Risk Level</div>
              <div className="text-xs text-orange-600 mt-1">Live from contract</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-600">{marketCondition.opportunity}%</div>
              <div className="text-sm text-indigo-800">Opportunity</div>
              <div className="text-xs text-indigo-600 mt-1">Live from contract</div>
            </div>
          </div>
        </div>
      )}

      {/* Live AI Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live AI Recommendations</h3>
          <button
            onClick={getRecommendations}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Getting Live Recommendations...' : 'Get Live AI Recommendations'}
          </button>
        </div>
        
        {recommendations.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-lg font-semibold text-blue-900">Live Recommended Strategies</span>
              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                {confidence}% Confidence
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((strategyId) => (
                <span key={strategyId} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                  Strategy #{strategyId}
                </span>
              ))}
            </div>
            <div className="text-xs text-blue-600 mt-2">Based on live market analysis from contract</div>
          </div>
        )}
      </div>

      {/* Live Available Strategies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Available Strategies</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading live strategies from contract...</p>
          </div>
        ) : strategies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No strategies available in live contract</p>
            <p className="text-sm text-gray-400 mt-2">Strategies need to be added to the AIStrategy contract</p>
          </div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.strategyId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{strategy.name}</h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(strategy.riskLevel)}`}>
                        {getRiskText(strategy.riskLevel)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        strategy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {strategy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{strategy.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Expected Return:</span>
                        <span className="ml-2 font-medium">{strategy.expectedReturn}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="ml-2 font-medium">{strategy.successRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-medium">{strategy.duration} days</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Min Deposit:</span>
                        <span className="ml-2 font-medium">{contractService.formatAmount(ethers.formatEther(strategy.minDeposit.toString()))} RFT</span>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      Live strategy data from Somnia Testnet contract
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStrategy(strategy.strategyId);
                      setShowAdoptModal(true);
                    }}
                    disabled={!strategy.isActive}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                  >
                    Adopt Strategy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live User Active Strategies */}
      {userStrategies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Live Active Strategies</h3>
          <div className="space-y-4">
            {userStrategies.map((strategy, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Strategy #{strategy.strategyId}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-medium">{strategy.amount} RFT</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Started:</span>
                        <span className="ml-2 font-medium">{formatTime(strategy.startTime)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      Live data from Somnia Testnet contract
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adopt Strategy Modal */}
      {showAdoptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adopt Live Strategy</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (RFT)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
                step="0.1"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAdoptModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAdoptStrategy}
                disabled={loading || !depositAmount}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adopting...' : 'Adopt Strategy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStrategies;