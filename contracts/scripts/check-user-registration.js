const { ethers } = require('hardhat');

async function main() {
  console.log('👤 Checking User Registration Status...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const userProfileAddress = '0x41d87298B54d329872c29ec385367cD4C404e8e6';
  const leaderboardAddress = '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f';

  const UserProfile = await ethers.getContractFactory('UserProfile');
  const userProfile = UserProfile.attach(userProfileAddress);

  const Leaderboard = await ethers.getContractFactory('Leaderboard');
  const leaderboard = Leaderboard.attach(leaderboardAddress);

  try {
    // Check total users in UserProfile
    const totalUsersInProfile = await userProfile.totalUsers();
    console.log('📊 Total users in UserProfile:', Number(totalUsersInProfile));

    // Check total users in Leaderboard
    const [totalUsersInLeaderboard, lastUpdateTime, topUser, topScore] = await leaderboard.getLeaderboardStats();
    console.log('📊 Total users in Leaderboard:', Number(totalUsersInLeaderboard));

    // Check if deployer is registered in UserProfile
    console.log('\n👤 Checking deployer registration...');
    const deployerData = await userProfile.users(deployer.address);
    console.log('Deployer registered in UserProfile:', deployerData.username !== '');
    console.log('Username:', deployerData.username);
    console.log('Registration time:', new Date(Number(deployerData.registrationTime) * 1000).toLocaleString());

    // Check if deployer is registered in Leaderboard
    const isRegisteredInLeaderboard = await leaderboard.isRegistered(deployer.address);
    console.log('Deployer registered in Leaderboard:', isRegisteredInLeaderboard);

    if (isRegisteredInLeaderboard) {
      const userScoreDetails = await leaderboard.getUserScoreDetails(deployer.address);
      console.log('Deployer score details:', {
        username: userScoreDetails.username,
        totalScore: Number(userScoreDetails.totalScore),
        yieldScore: Number(userScoreDetails.yieldScore),
        battleScore: Number(userScoreDetails.battleScore),
        reputationScore: Number(userScoreDetails.reputationScore),
        isActive: userScoreDetails.isActive
      });
    }

    // Check top users in leaderboard
    console.log('\n🏆 Top 5 users in leaderboard:');
    const [users, scores, usernames] = await leaderboard.getTopUsers(5);
    users.forEach((user, index) => {
      console.log(`Rank ${index + 1}: ${usernames[index]} (${user}) - Score: ${Number(scores[index])}`);
    });

  } catch (error) {
    console.error('❌ Error checking user registration:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
