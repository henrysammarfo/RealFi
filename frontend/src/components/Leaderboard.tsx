import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';

interface LeaderboardEntry {
  address: string;
  username: string;
  score: number;
  rank: number;
}

interface LeaderboardStats {
  totalUsers: number;
  totalBattles: number;
  topUser: string;
  topScore: number;
}

interface LeaderboardProps {
  className?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ className = '' }) => {
  const { account, isConnected } = useWeb3();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && account) {
      loadLeaderboard();
      loadUserRank();
      loadUserScore();
    }
  }, [isConnected, account]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get top 10 users from live contract
      const topUsers = await contractService.getTopUsers(10);
      setLeaderboard(topUsers);

      // Get leaderboard stats from live contract
      const leaderboardContract = contractService.getContract('Leaderboard');
      if (leaderboardContract) {
        const [totalUsers, totalBattles, topUser, topScore] = await leaderboardContract.getLeaderboardStats();
        setStats({
          totalUsers: Number(totalUsers),
          totalBattles: Number(totalBattles),
          topUser: topUser,
          topScore: Number(topScore)
        });
      }
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      setError('Failed to load leaderboard data from live contract');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRank = async () => {
    if (!account) return;

    try {
      const rank = await contractService.getUserRank(account);
      setUserRank(rank);
    } catch (error: any) {
      console.error('Failed to load user rank:', error);
    }
  };

  const loadUserScore = async () => {
    if (!account) return;

    try {
      const leaderboardContract = contractService.getContract('Leaderboard');
      if (leaderboardContract) {
        const [yieldScore, battleScore, totalScore, rank, lastUpdate] = await leaderboardContract.getUserScoreDetails(account);
        setUserScore(Number(totalScore));
      }
    } catch (error: any) {
      console.error('Failed to load user score:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-gray-100 text-gray-800';
      case 3: return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Leaderboard</h2>
        <p className="text-gray-600">Real-time rankings based on live yield performance and battle participation</p>
        <div className="mt-2 text-sm text-green-600 font-medium">
          ✅ All data loaded from live Somnia Testnet contracts
        </div>
      </div>

      {/* Error Message */}
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

      {/* Live Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-blue-800">Total Users</div>
            <div className="text-xs text-blue-600 mt-1">Live from contract</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalBattles}</div>
            <div className="text-sm text-green-800">Total Battles</div>
            <div className="text-xs text-green-600 mt-1">Live from contract</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{formatAddress(stats.topUser)}</div>
            <div className="text-sm text-purple-800">Top User</div>
            <div className="text-xs text-purple-600 mt-1">Live from contract</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.topScore}</div>
            <div className="text-sm text-orange-800">Top Score</div>
            <div className="text-xs text-orange-600 mt-1">Live from contract</div>
          </div>
        </div>
      )}

      {/* User Rank */}
      {userRank && userScore !== null && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Live Ranking</h3>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-lg font-bold ${getRankColor(userRank)}`}>
              {getRankIcon(userRank)}
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">Rank #{userRank}</div>
              <div className="text-lg text-gray-600">Score: {userScore} points</div>
              <div className="text-sm text-gray-500">Live data from Somnia Testnet</div>
            </div>
          </div>
        </div>
      )}

      {/* Live Leaderboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Live Top Performers</h3>
          <button
            onClick={loadLeaderboard}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Live Data'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading live leaderboard data...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No leaderboard data available yet</p>
            <p className="text-sm text-gray-400 mt-2">Start participating in battles to see rankings!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.address}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  entry.address.toLowerCase() === account?.toLowerCase()
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {entry.username || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatAddress(entry.address)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{entry.score}</div>
                  <div className="text-sm text-gray-600">points</div>
                  <div className="text-xs text-green-600">Live data</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How Live Rankings Work */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Live Rankings Work</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
            <p><strong>Live Yield Tracking:</strong> Your yield earnings are tracked in real-time from the YieldVault contract</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
            <p><strong>Battle Performance:</strong> Battle participation and wins are recorded live on-chain</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
            <p><strong>Real-time Updates:</strong> Rankings update automatically as you participate in battles</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
            <p><strong>On-chain Verification:</strong> All scores are verifiable on Shannon Explorer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;