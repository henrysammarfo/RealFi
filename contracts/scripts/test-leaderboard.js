const { ethers } = require('hardhat');

async function main() {
  console.log('🏆 Testing Leaderboard Contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Get the deployed Leaderboard contract
  const LeaderboardAddress = '0xab978B200e99b1Cd110D62a4731086ce7a0D1FA4';
  const Leaderboard = await ethers.getContractFactory('Leaderboard');
  const leaderboard = Leaderboard.attach(LeaderboardAddress);

  console.log('Leaderboard contract address:', LeaderboardAddress);

  try {
    // Test getTotalStats
    console.log('\n📊 Testing getTotalStats...');
    const [totalUsers, totalBattles] = await leaderboard.getTotalStats();
    console.log('Total Users:', totalUsers.toString());
    console.log('Total Battles:', totalBattles.toString());

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
