import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';

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
  amount: string;
  depositTime: number;
  lastClaimTime: number;
  battleId: number;
  isActive: boolean;
}

interface YieldBattlesProps {
  className?: string;
}

const YieldBattles: React.FC<YieldBattlesProps> = ({ className = '' }) => {
  const { account, isConnected, getContract, formatAmount, parseAmount, waitForTransaction } = useWeb3();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedBattle, setSelectedBattle] = useState<number | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      loadBattles();
      loadUserPosition();
    }
  }, [isConnected, account]);

  const loadBattles = async () => {
    try {
      setLoading(true);
      const yieldVaultContract = await getContract('YieldVault');
      
      // Get vault stats to know how many battles exist
      const [totalVaultValue, totalYieldDistributed, nextBattleId] = await yieldVaultContract.getVaultStats();
      
      const battlesList: Battle[] = [];
      
      // Load battles (assuming battles start from ID 1)
      for (let i = 1; i < Number(nextBattleId); i++) {
        try {
          const battleData = await yieldVaultContract.getBattleDetails(i);
          battlesList.push({
            battleId: i,
            name: battleData[0],
            startTime: Number(battleData[1]),
            endTime: Number(battleData[2]),
            totalPrizePool: battleData[3].toString(),
            entryFee: battleData[4].toString(),
            maxParticipants: Number(battleData[5]),
            currentParticipants: Number(battleData[6]),
            isActive: battleData[7],
          });
        } catch (err) {
          // Battle doesn't exist, continue
        }
      }
      
      setBattles(battlesList);
    } catch (err: any) {
      setError(err.message || 'Failed to load battles');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosition = async () => {
    if (!account) return;

    try {
      const yieldVaultContract = await getContract('YieldVault');
      const position = await yieldVaultContract.getUserPosition(account);
      
      setUserPosition({
        amount: position[0].toString(),
        depositTime: Number(position[1]),
        lastClaimTime: Number(position[2]),
        battleId: Number(position[3]),
        isActive: position[4],
      });
    } catch (err: any) {
      console.error('Failed to load user position:', err);
    }
  };

  const handleJoinBattle = async () => {
    if (!selectedBattle || !depositAmount) {
      setError('Please select a battle and enter deposit amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const yieldVaultContract = await getContract('YieldVault');
      const tokenContract = await getContract('RealFiToken');
      
      // Approve tokens first
      const approveTx = await tokenContract.approve(
        yieldVaultContract.target,
        parseAmount(depositAmount)
      );
      await approveTx.wait();

      // Join battle
      const joinTx = await yieldVaultContract.joinBattle(selectedBattle, parseAmount(depositAmount));
      const receipt = await joinTx.wait();
      
      setSuccess(`Successfully joined battle! Transaction: ${receipt.hash}`);
      setShowJoinModal(false);
      setDepositAmount('');
      setSelectedBattle(null);
      
      // Reload data
      await loadBattles();
      await loadUserPosition();
    } catch (err: any) {
      setError(err.message || 'Failed to join battle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount) {
      setError('Please enter deposit amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const yieldVaultContract = await getContract('YieldVault');
      const tokenContract = await getContract('RealFiToken');
      
      // Approve tokens first
      const approveTx = await tokenContract.approve(
        yieldVaultContract.target,
        parseAmount(depositAmount)
      );
      await approveTx.wait();

      // Make deposit
      const depositTx = await yieldVaultContract.deposit(parseAmount(depositAmount));
      const receipt = await depositTx.wait();
      
      setSuccess(`Successfully deposited! Transaction: ${receipt.hash}`);
      setDepositAmount('');
      
      // Reload data
      await loadUserPosition();
    } catch (err: any) {
      setError(err.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userPosition || !userPosition.amount) {
      setError('No funds to withdraw');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const yieldVaultContract = await getContract('YieldVault');
      const withdrawTx = await yieldVaultContract.withdraw(userPosition.amount);
      const receipt = await withdrawTx.wait();
      
      setSuccess(`Successfully withdrawn! Transaction: ${receipt.hash}`);
      
      // Reload data
      await loadUserPosition();
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimYield = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const yieldVaultContract = await getContract('YieldVault');
      const claimTx = await yieldVaultContract.claimYield();
      const receipt = await claimTx.wait();
      
      setSuccess(`Successfully claimed yield! Transaction: ${receipt.hash}`);
      
      // Reload data
      await loadUserPosition();
    } catch (err: any) {
      setError(err.message || 'Failed to claim yield');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Please connect your wallet to view yield battles</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Position */}
      {userPosition && userPosition.isActive && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Position</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Deposited Amount</h3>
              <p className="text-lg font-semibold text-blue-600">
                {formatAmount(userPosition.amount)} RFT
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-900 mb-2">Battle ID</h3>
              <p className="text-lg font-semibold text-green-600">
                {userPosition.battleId || 'Regular Deposit'}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Deposit Time</h3>
              <p className="text-sm text-purple-600">
                {new Date(userPosition.depositTime * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Withdrawing...' : 'Withdraw'}
            </button>
            <button
              onClick={handleClaimYield}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Claiming...' : 'Claim Yield'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (RFT)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                id="depositAmount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleDeposit}
                disabled={loading || !depositAmount}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Depositing...' : 'Deposit'}
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowJoinModal(true)}
              disabled={loading}
              className="w-full bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Join Battle
            </button>
          </div>
        </div>
      </div>

      {/* Battles List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Battles</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : battles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active battles found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {battles.map((battle) => (
              <div key={battle.battleId} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{battle.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-medium">{formatAmount(battle.entryFee)} RFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span className="font-medium">{battle.currentParticipants}/{battle.maxParticipants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ends:</span>
                    <span className="font-medium">
                      {new Date(battle.endTime * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBattle(battle.battleId);
                    setShowJoinModal(true);
                  }}
                  disabled={!battle.isActive || battle.currentParticipants >= battle.maxParticipants}
                  className="w-full mt-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {!battle.isActive ? 'Ended' : 
                   battle.currentParticipants >= battle.maxParticipants ? 'Full' : 'Join Battle'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Battle Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Join Battle</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="modalDepositAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount (RFT)
                </label>
                <input
                  type="number"
                  id="modalDepositAmount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleJoinBattle}
                  disabled={loading || !depositAmount}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {loading ? 'Joining...' : 'Join Battle'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setDepositAmount('');
                    setSelectedBattle(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YieldBattles;
