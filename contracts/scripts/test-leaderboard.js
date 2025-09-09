const { ethers } = require('hardhat');

async function main() {
  console.log('🏆 Testing Leaderboard Contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Get the deployed Leaderboard contract
  const LeaderboardAddress = '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f';
  const Leaderboard = await ethers.getContractFactory('Leaderboard');
  const leaderboard = Leaderboard.attach(LeaderboardAddress);

  console.log('Leaderboard contract address:', LeaderboardAddress);

  try {
    // Test getLeaderboardStats
    console.log('\n📊 Testing getLeaderboardStats...');
    const [totalUsers, lastUpdateTime, topUserAddress, topUserScore] = await leaderboard.getLeaderboardStats();
    console.log('Total Users:', Number(totalUsers));
    console.log('Last Update Time:', new Date(Number(lastUpdateTime) * 1000).toLocaleString());
    console.log('Top User Address:', topUserAddress);
    console.log('Top User Score:', Number(topUserScore));

    // Test getTopUser
    console.log('\n👑 Testing getTopUser...');
    const topUser = await leaderboard.getTopUser();
    console.log('Top User:', topUser);

    // Test getTopScore
    console.log('\n🎯 Testing getTopScore...');
    const topScore = await leaderboard.getTopScore();
    console.log('Top Score:', topScore.toString());

    // Test getTopUsers
    console.log('\n🏅 Testing getTopUsers...');
    const topUsers = await leaderboard.getTopUsers(5);
    console.log('Top 5 Users:', topUsers);

    // Test getUserScore
    console.log('\n👤 Testing getUserScore...');
    const userScore = await leaderboard.getUserScore(deployer.address);
    console.log('User Score:', userScore.toString());

    // Test getUserRank
    console.log('\n📈 Testing getUserRank...');
    const userRank = await leaderboard.getUserRank(deployer.address);
    console.log('User Rank:', userRank.toString());

    console.log('\n✅ Leaderboard contract tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Leaderboard contract:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
