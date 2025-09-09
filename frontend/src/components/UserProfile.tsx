import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';

interface UserData {
  username: string;
  registrationTime: number;
  totalDeposits: string;
  totalWithdrawals: string;
  battlesJoined: number;
  battlesWon: number;
  reputationScore: number;
  isActive: boolean;
}

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { account, isConnected } = useWeb3();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [username, setUsername] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');

  useEffect(() => {
    if (isConnected && account) {
      checkUserRegistration();
      loadTokenBalance();
    }
  }, [isConnected, account]);

  // Listen for user data updates from other components
  useEffect(() => {
    const handleUserDataUpdate = () => {
      if (isConnected && account) {
        refreshProfile();
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    return () => window.removeEventListener('userDataUpdated', handleUserDataUpdate);
  }, [isConnected, account]);

  const checkUserRegistration = async () => {
    if (!account) return;

    try {
      setLoading(true);
      
      // Get user profile data
      const userData = await contractService.getUserData(account);
      setUserData(userData);
      setIsRegistered(true);
      
      // Get vault position to show actual deposits
      const vaultPosition = await contractService.getUserPosition(account);
      if (vaultPosition && vaultPosition.depositedAmount !== '0.0') {
        setUserData(prev => prev ? {
          ...prev,
          totalDeposits: vaultPosition.depositedAmount
        } : null);
      }
    } catch (error: any) {
      // User not registered
      setIsRegistered(false);
      console.log('User not registered yet');
    } finally {
      setLoading(false);
    }
  };

  const loadTokenBalance = async () => {
    if (!account) return;

    try {
      const balance = await contractService.getTokenBalance(account);
      setTokenBalance(balance);
    } catch (error: any) {
      console.error('Failed to load token balance:', error);
    }
  };

  const refreshProfile = async () => {
    if (isConnected && account) {
      await checkUserRegistration();
      await loadTokenBalance();
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tx = await contractService.registerUser(username.trim());
      await contractService.waitForTransaction(tx.hash);
      
      setShowRegistration(false);
      setUsername('');
      await checkUserRegistration();
    } catch (error: any) {
      console.error('Failed to register user:', error);
      setError(error.message || 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tx = await contractService.updateProfile(username.trim());
      await contractService.waitForTransaction(tx.hash);
      
      setShowRegistration(false);
      setUsername('');
      await checkUserRegistration();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
          <button
            onClick={refreshProfile}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
        <p className="text-gray-600">Manage your profile and view your statistics</p>
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

      {/* User Data */}
      {userData && isRegistered ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">@{userData.username}</h3>
              <p className="text-gray-600">Member since {formatTime(userData.registrationTime)}</p>
            </div>
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{userData.reputationScore}</div>
              <div className="text-sm text-blue-800">Reputation Score</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{userData.totalDeposits} RFT</div>
              <div className="text-sm text-green-800">Total Deposits</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{userData.battlesJoined}</div>
              <div className="text-sm text-purple-800">Battles Joined</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{userData.battlesWon}</div>
              <div className="text-sm text-orange-800">Battles Won</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Account Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${userData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {userData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Withdrawals:</span>
                  <span className="font-medium">{userData.totalWithdrawals} RFT</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Token Balance</h4>
              <div className="text-2xl font-bold text-gray-900">{tokenBalance} RFT</div>
              <p className="text-sm text-gray-600 mt-1">RealFi Token Balance</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome to RealFi!</h3>
            <p className="text-gray-600 mb-6">Register your profile to start participating in yield battles and earning rewards.</p>
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Register Profile
            </button>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRegistered ? 'Update Profile' : 'Register Profile'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowRegistration(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={isRegistered ? handleUpdateProfile : handleRegister}
                disabled={loading || !username.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isRegistered ? 'Update' : 'Register')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;