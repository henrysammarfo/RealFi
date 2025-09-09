import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';

interface Battle {
  battleId: number;
  name: string;
  startTime: number;
  endTime: number;
  totalPrizePool: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
}

interface UserPosition {
  depositedAmount: string;
  depositTime: number;
  lastUpdateTime: number;
  yieldEarned: string;
  isActive: boolean;
}

interface BattleWinner {
  address: string;
  yieldEarned: string;
  rank: number;
}

interface YieldBattlesProps {
  className?: string;
}

const YieldBattles: React.FC<YieldBattlesProps> = ({ className = '' }) => {
  const { account, isConnected } = useWeb3();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedBattle, setSelectedBattle] = useState<number | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [battleName, setBattleName] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [duration, setDuration] = useState(24);
  const [battleWinners, setBattleWinners] = useState<Map<number, BattleWinner[]>>(new Map());

  useEffect(() => {
    if (isConnected && account) {
      loadBattles();
      loadUserPosition();
    }
  }, [isConnected, account]);

  const loadBattles = async () => {
    try {
      setLoading(true);
      const vaultStats = await contractService.getVaultStats();
      const battlesList: Battle[] = [];
      
      // Load battles (assuming battles start from ID 1)
      for (let i = 1; i < vaultStats.nextBattleId; i++) {
        try {
          const battleData = await contractService.getBattleDetails(i);
          battlesList.push({
            battleId: i,
            name: battleData.name,
            startTime: battleData.startTime,
            endTime: battleData.endTime,
            totalPrizePool: battleData.totalPrizePool,
            entryFee: battleData.entryFee,
            maxParticipants: battleData.maxParticipants,
            currentParticipants: battleData.currentParticipants,
            isActive: battleData.isActive
          });
        } catch (error) {
          console.log(`Battle ${i} not found or error loading`);
        }
      }
      
      setBattles(battlesList);
    } catch (error: any) {
      console.error('Failed to load battles:', error);
      setError('Failed to load battles');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosition = async () => {
    if (!account) return;

    try {
      const position = await contractService.getUserPosition(account);
      setUserPosition(position);
    } catch (error: any) {
      console.error('Failed to load user position:', error);
    }
  };

  const loadBattleWinners = async (battleId: number) => {
    try {
      const winners = await contractService.getBattleWinners(battleId);
      if (winners.length > 0) {
        setBattleWinners(prev => new Map(prev.set(battleId, winners)));
      }
    } catch (error) {
      console.log(`No winners available for battle ${battleId} yet`);
    }
  };

  const handleCreateBattle = async () => {
    if (!battleName || !entryFee) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      setSuccess(null);

      const tx = await contractService.createBattle(battleName, entryFee, maxParticipants, duration);
      const receipt = await contractService.waitForTransaction(tx.hash);
      
      setSuccess(`Battle created successfully! Transaction: ${receipt.hash}`);
      setBattleName('');
      setEntryFee('');
      setMaxParticipants(10);
      setDuration(24);
      
      // Reload battles
      await loadBattles();
    } catch (error: any) {
      console.error('Failed to create battle:', error);
      setError(error.message || 'Failed to create battle');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinBattle = async () => {
    if (!selectedBattle || !depositAmount) {
      setError('Please select a battle and enter deposit amount');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (amount < 0.01 || amount > 100) {
      setError('Deposit amount must be between 0.01 and 100 RFT');
      return;
    }

    try {
      setJoinLoading(true);
      setError(null);
      setSuccess(null);

      // First approve tokens
      const approveTx = await contractService.approveToken(
        '0xC2852Dac15Ec1FdA7697c06FcE436DaEA98ac799',
        depositAmount
      );
      await contractService.waitForTransaction(approveTx.hash);

      // Then join battle
      const joinTx = await contractService.joinBattle(selectedBattle, depositAmount);
      const receipt = await contractService.waitForTransaction(joinTx.hash);
      
      setSuccess(`Successfully joined battle! Transaction: ${receipt.hash}`);
      setShowJoinModal(false);
      setDepositAmount('');
      setSelectedBattle(null);
      
      // Reload data
      await loadUserPosition();
      await loadBattles();
    } catch (error: any) {
      console.error('Failed to join battle:', error);
      setError(error.message || 'Failed to join battle');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount) {
      setError('Please enter deposit amount');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (amount < 0.01 || amount > 100) {
      setError('Deposit amount must be between 0.01 and 100 RFT');
      return;
    }

    try {
      setDepositLoading(true);
      setError(null);
      setSuccess(null);

      // First approve tokens
      const approveTx = await contractService.approveToken(
        '0xC2852Dac15Ec1FdA7697c06FcE436DaEA98ac799',
        depositAmount
      );
      await contractService.waitForTransaction(approveTx.hash);

      // Then deposit
      const depositTx = await contractService.deposit(depositAmount);
      const receipt = await contractService.waitForTransaction(depositTx.hash);
      
      setSuccess(`Successfully deposited! Transaction: ${receipt.hash}`);
      setDepositAmount('');
      
      // Reload data
      await loadUserPosition();
    } catch (error: any) {
      console.error('Failed to deposit:', error);
      setError(error.message || 'Failed to deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userPosition || !userPosition.depositedAmount || userPosition.depositedAmount === '0.0') {
      setError('No funds to withdraw');
      return;
    }

    try {
      setWithdrawLoading(true);
      setError(null);
      setSuccess(null);

      const withdrawTx = await contractService.withdrawAll();
      const receipt = await contractService.waitForTransaction(withdrawTx.hash);
      
      setSuccess(`Successfully withdrawn! Transaction: ${receipt.hash}`);
      
      // Reload data
      await loadUserPosition();
    } catch (error: any) {
      console.error('Failed to withdraw:', error);
      setError(error.message || 'Failed to withdraw');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleClaimYield = async () => {
    try {
      setClaimLoading(true);
      setError(null);
      setSuccess(null);

      const claimTx = await contractService.claimYield();
      const receipt = await contractService.waitForTransaction(claimTx.hash);
      
      setSuccess(`Successfully claimed yield! Transaction: ${receipt.hash}`);
      
      // Reload data
      await loadUserPosition();
    } catch (error: any) {
      console.error('Failed to claim yield:', error);
      setError(error.message || 'Failed to claim yield');
    } finally {
      setClaimLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isBattleActive = (battle: Battle) => {
    const now = Math.floor(Date.now() / 1000);
    return battle.isActive && now >= battle.startTime && now <= battle.endTime;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Yield Battles</h2>
        <p className="text-gray-600">Join battles, earn yield, and compete with other users!</p>
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

      {/* User Position */}
      {userPosition && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Position</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{userPosition.depositedAmount} RFT</div>
              <div className="text-sm text-blue-800">Deposited Amount</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{userPosition.yieldEarned} RFT</div>
              <div className="text-sm text-green-800">Yield Earned</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{formatTime(userPosition.depositTime)}</div>
              <div className="text-sm text-purple-800">Deposit Time</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{userPosition.isActive ? 'Active' : 'Inactive'}</div>
              <div className="text-sm text-orange-800">Status</div>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading || !userPosition.depositedAmount || userPosition.depositedAmount === '0.0'}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawLoading ? 'Withdrawing...' : 'Withdraw'}
            </button>
            <button
              onClick={handleClaimYield}
              disabled={claimLoading || !userPosition.yieldEarned || userPosition.yieldEarned === '0.0'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claimLoading ? 'Claiming...' : 'Claim Yield'}
            </button>
          </div>
        </div>
      )}

      {/* Create Battle */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Battle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Battle Name</label>
            <input
              type="text"
              value={battleName}
              onChange={(e) => setBattleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter battle name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entry Fee (RFT)</label>
            <input
              type="number"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="2"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="168"
            />
          </div>
        </div>
        <button
          onClick={handleCreateBattle}
          disabled={createLoading || !battleName || !entryFee}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createLoading ? 'Creating...' : 'Create Battle'}
        </button>
      </div>

      {/* Regular Deposit */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regular Deposit</h3>
        <p className="text-sm text-gray-600 mb-4">
          Deposit RFT tokens to earn 5% APY. Minimum: 0.01 RFT | Maximum: 100 RFT
        </p>
        <div className="flex space-x-4">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.01 - 100 RFT"
            min="0.01"
            max="100"
            step="0.01"
          />
          <button
            onClick={handleDeposit}
            disabled={depositLoading || !depositAmount}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {depositLoading ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
      </div>

      {/* Active Battles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Battles</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading battles...</p>
          </div>
        ) : battles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No active battles found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {battles.map((battle) => (
              <div key={battle.battleId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{battle.name}</h4>
                    <p className="text-sm text-gray-600">Battle ID: {battle.battleId}</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(battle.startTime)} - {formatTime(battle.endTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Entry Fee: {battle.entryFee} RFT | Max Participants: {battle.maxParticipants}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Participants: {battle.currentParticipants} | Prize Pool: {battle.totalPrizePool} RFT
                    </p>
                    {battleWinners.has(battle.battleId) && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Winners:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {battleWinners.get(battle.battleId)?.slice(0, 3).map((winner, index) => (
                            <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              #{winner.rank}: {contractService.formatAddress(winner.address)} ({winner.yieldEarned} RFT)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      isBattleActive(battle) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isBattleActive(battle) ? 'Active' : 'Inactive'}
                    </span>
                    {isBattleActive(battle) && (
                      <button
                        onClick={() => {
                          setSelectedBattle(battle.battleId);
                          setShowJoinModal(true);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Join
                      </button>
                    )}
                    {!isBattleActive(battle) && (
                      <button
                        onClick={() => loadBattleWinners(battle.battleId)}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                      >
                        View Winners
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Battle Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Battle</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (RFT)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.01 - 100 RFT"
                min="0.01"
                max="100"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: 0.01 RFT | Maximum: 100 RFT
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinBattle}
                disabled={joinLoading || !depositAmount}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinLoading ? 'Joining...' : 'Join Battle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YieldBattles;