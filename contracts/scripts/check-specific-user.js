const { ethers } = require('hardhat');

async function main() {
  console.log('👤 Checking Specific User Registration...\n');

  const userAddress = '0x61b329219e3365B4ad3C60E4437908067Fdb9a84'; // User from frontend
  console.log('Checking user:', userAddress);

  const userProfileAddress = '0x41d87298B54d329872c29ec385367cD4C404e8e6';
  const leaderboardAddress = '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f';

  const UserProfile = await ethers.getContractFactory('UserProfile');
  const userProfile = UserProfile.attach(userProfileAddress);

  const Leaderboard = await ethers.getContractFactory('Leaderboard');
  const leaderboard = Leaderboard.attach(leaderboardAddress);

  try {
    // Check if user is registered in UserProfile
    console.log('\n📋 Checking UserProfile registration...');
    const userData = await userProfile.users(userAddress);
    console.log('Username:', userData.username);
    console.log('Registration time:', new Date(Number(userData.registrationTime) * 1000).toLocaleString());
    console.log('Total deposits:', ethers.formatEther(userData.totalDeposits), 'RFT');
    console.log('Total withdrawals:', ethers.formatEther(userData.totalWithdrawals), 'RFT');
    console.log('Battles joined:', Number(userData.battlesJoined));
    console.log('Battles won:', Number(userData.battlesWon));
    console.log('Reputation score:', Number(userData.reputationScore));
    console.log('Is active:', userData.isActive);

    // Check if user is registered in Leaderboard
    console.log('\n🏆 Checking Leaderboard registration...');
    const isRegisteredInLeaderboard = await leaderboard.isRegistered(userAddress);
    console.log('Registered in Leaderboard:', isRegisteredInLeaderboard);

    if (isRegisteredInLeaderboard) {
      const userScoreDetails = await leaderboard.getUserScoreDetails(userAddress);
      console.log('Score details:', {
        username: userScoreDetails.username,
        totalScore: Number(userScoreDetails.totalScore),
        yieldScore: Number(userScoreDetails.yieldScore),
        battleScore: Number(userScoreDetails.battleScore),
        reputationScore: Number(userScoreDetails.reputationScore),
        isActive: userScoreDetails.isActive
      });

      const userRank = await leaderboard.getUserRank(userAddress);
      console.log('User rank:', Number(userRank));
    }

    // Check YieldVault position
    console.log('\n💰 Checking YieldVault position...');
    const yieldVaultAddress = '0x2ABa80F8931d52DEE8e6732d213eabe795535660';
    const YieldVault = await ethers.getContractFactory('YieldVault');
    const yieldVault = YieldVault.attach(yieldVaultAddress);

    try {
      const position = await yieldVault.getUserPosition(userAddress);
      console.log('Vault position:', {
        depositedAmount: ethers.formatEther(position[0]),
        depositTime: new Date(Number(position[1]) * 1000).toLocaleString(),
        lastUpdateTime: new Date(Number(position[2]) * 1000).toLocaleString(),
        yieldEarned: ethers.formatEther(position[3]),
        isActive: position[4]
      });
    } catch (error) {
      console.log('No vault position found:', error.message);
    }

    // Check token balance
    console.log('\n🪙 Checking token balance...');
    const tokenAddress = '0x8c73284b55cb55EB46Dd42617bA6213037e602e9';
    const RealFiToken = await ethers.getContractFactory('RealFiToken');
    const token = RealFiToken.attach(tokenAddress);

    const balance = await token.balanceOf(userAddress);
    console.log('Token balance:', ethers.formatEther(balance), 'RFT');

  } catch (error) {
    console.error('❌ Error checking user:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
