const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🔄 Redeploying Leaderboard with UserProfile integration...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const yieldVaultAddress = '0xC973ca43A057ED2437B795752126015ae94c8541';
  const userProfileAddress = '0xe38E37a0536400440F5C322CBCf540E2c3ac0aFA';

  try {
    // Deploy Leaderboard
    console.log('Deploying Leaderboard...');
    const Leaderboard = await ethers.getContractFactory('Leaderboard');
    const leaderboard = await upgrades.deployProxy(
      Leaderboard,
      [deployer.address, yieldVaultAddress, userProfileAddress],
      { initializer: 'initialize' }
    );
    await leaderboard.waitForDeployment();
    
    const leaderboardAddress = await leaderboard.getAddress();
    console.log('✅ Leaderboard deployed to:', leaderboardAddress);

    // Test getTopUsers function
    console.log('\n🧪 Testing getTopUsers function...');
    
    try {
      const [users, scores, usernames] = await leaderboard.getTopUsers(10);
      console.log('✅ getTopUsers test successful!');
      console.log('Users found:', users.length);
      
      if (users.length > 0) {
        console.log('📊 Sample data:');
        for (let i = 0; i < Math.min(3, users.length); i++) {
          console.log(`  ${i + 1}. ${usernames[i] || 'Unknown'} (${users[i]}) - Score: ${scores[i]}`);
        }
      } else {
        console.log('No users in leaderboard yet');
      }
      
    } catch (error) {
      console.error('❌ getTopUsers test failed:', error.message);
    }

    // Test leaderboard stats
    console.log('\n🧪 Testing leaderboard stats...');
    try {
      const [totalUsers, lastUpdateTime, topUser, topScore] = await leaderboard.getLeaderboardStats();
      console.log('✅ Leaderboard stats:');
      console.log('Total Users:', Number(totalUsers));
      console.log('Last Update:', new Date(Number(lastUpdateTime) * 1000).toLocaleString());
      console.log('Top User:', topUser);
      console.log('Top Score:', Number(topScore));
    } catch (error) {
      console.error('❌ Leaderboard stats test failed:', error.message);
    }

    console.log('\n📋 Contract Information:');
    console.log('Leaderboard Address:', leaderboardAddress);
    console.log('YieldVault Address:', yieldVaultAddress);
    console.log('UserProfile Address:', userProfileAddress);

    console.log('\n🔗 Explorer Links:');
    console.log(`Leaderboard: https://shannon-explorer.somnia.network/address/${leaderboardAddress}`);

  } catch (error) {
    console.error('❌ Error deploying Leaderboard:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
