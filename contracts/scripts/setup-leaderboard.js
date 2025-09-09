const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 Setting up Leaderboard Integration...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const userProfileAddress = '0x41d87298B54d329872c29ec385367cD4C404e8e6';
  const leaderboardAddress = '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f';

  const UserProfile = await ethers.getContractFactory('UserProfile');
  const userProfile = UserProfile.attach(userProfileAddress);

  console.log('UserProfile contract address:', userProfileAddress);
  console.log('Leaderboard contract address:', leaderboardAddress);

  try {
    // Check current leaderboard contract address
    console.log('\n📋 Checking current leaderboard contract address...');
    const currentLeaderboardAddress = await userProfile.leaderboardContract();
    console.log('Current leaderboard address:', currentLeaderboardAddress);

    if (currentLeaderboardAddress === '0x0000000000000000000000000000000000000000') {
      console.log('\n🔧 Setting leaderboard contract address...');
      const tx = await userProfile.setLeaderboardContract(leaderboardAddress);
      await tx.wait();
      console.log('✅ Leaderboard contract address set successfully!');
    } else {
      console.log('✅ Leaderboard contract address already set');
    }

    // Test registering a user
    console.log('\n👤 Testing user registration...');
    try {
      const testUsername = 'testuser' + Date.now();
      const tx = await userProfile.registerUser(testUsername);
      await tx.wait();
      console.log('✅ Test user registered successfully!');
    } catch (error) {
      if (error.message.includes('User already registered')) {
        console.log('ℹ️  User already registered, trying to update profile...');
        const tx = await userProfile.updateProfile('testuser' + Date.now());
        await tx.wait();
        console.log('✅ Profile updated successfully!');
      } else {
        console.log('❌ Error registering user:', error.message);
      }
    }

    // Check leaderboard stats again
    console.log('\n📊 Checking leaderboard stats after setup...');
    const Leaderboard = await ethers.getContractFactory('Leaderboard');
    const leaderboard = Leaderboard.attach(leaderboardAddress);
    
    const [totalUsers, lastUpdateTime, topUserAddress, topUserScore] = await leaderboard.getLeaderboardStats();
    console.log('Total Users:', Number(totalUsers));
    console.log('Last Update Time:', new Date(Number(lastUpdateTime) * 1000).toLocaleString());
    console.log('Top User Address:', topUserAddress);
    console.log('Top User Score:', Number(topUserScore));

  } catch (error) {
    console.error('❌ Error setting up leaderboard:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
