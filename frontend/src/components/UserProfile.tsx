import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { CONTRACT_ADDRESSES } from '../config/contracts';

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
  const { account, isConnected, getContract, formatAmount } = useWeb3();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [username, setUsername] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      checkUserRegistration();
    }
  }, [isConnected, account]);

  const checkUserRegistration = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const userProfileContract = await getContract('UserProfile');
      
      try {
        const userData = await userProfileContract.getUserData(account);
        setUserData({
          username: userData[0],
          registrationTime: Number(userData[1]),
          totalDeposits: userData[2].toString(),
          totalWithdrawals: userData[3].toString(),
          battlesJoined: Number(userData[4]),
          battlesWon: Number(userData[5]),
          reputationScore: Number(userData[6]),
          isActive: userData[7],
        });
        setIsRegistered(true);
      } catch (err) {
        // User not registered
        setIsRegistered(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check user registration');
    } finally {
      setLoading(false);
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
      
      const userProfileContract = await getContract('UserProfile');
      const tx = await userProfileContract.registerUser(username.trim());
      await tx.wait();
      
      setShowRegistration(false);
      setUsername('');
      await checkUserRegistration();
    } catch (err: any) {
      setError(err.message || 'Failed to register user');
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
      
      const userProfileContract = await getContract('UserProfile');
      const tx = await userProfileContract.updateProfile(username.trim());
      await tx.wait();
      
      setShowRegistration(false);
      setUsername('');
      await checkUserRegistration();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Please connect your wallet to view profile</p>
      </div>
    );
  }

  if (loading && !userData) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Register Your Profile</h2>
        
        {!showRegistration ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Welcome to RealFi! Create your profile to start participating in yield battles.
            </p>
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Create Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters, alphanumeric only
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button
                onClick={() => {
                  setShowRegistration(false);
                  setUsername('');
                  setError(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
          <p className="text-gray-600">@{userData?.username}</p>
        </div>
        <button
          onClick={() => setShowRegistration(true)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Edit Profile
        </button>
      </div>

      {showRegistration && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Username</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter new username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={20}
            />
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => {
                  setShowRegistration(false);
                  setUsername('');
                  setError(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Reputation Score</h3>
            <p className="text-2xl font-bold text-blue-600">{userData?.reputationScore}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 mb-2">Total Deposits</h3>
            <p className="text-lg font-semibold text-green-600">
              {formatAmount(userData?.totalDeposits || '0')} RFT
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Total Withdrawals</h3>
            <p className="text-lg font-semibold text-yellow-600">
              {formatAmount(userData?.totalWithdrawals || '0')} RFT
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-2">Battles Joined</h3>
            <p className="text-2xl font-bold text-purple-600">{userData?.battlesJoined}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-900 mb-2">Battles Won</h3>
            <p className="text-2xl font-bold text-red-600">{userData?.battlesWon}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Member Since</h3>
            <p className="text-sm text-gray-600">
              {userData?.registrationTime ? new Date(Number(userData.registrationTime) * 1000).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
