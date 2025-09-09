const { ethers } = require('hardhat');

async function main() {
  console.log('👥 Registering Users in Leaderboard...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const userProfileAddress = '0x41d87298B54d329872c29ec385367cD4C404e8e6';
  const leaderboardAddress = '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f';

  const UserProfile = await ethers.getContractFactory('UserProfile');
  const userProfile = UserProfile.attach(userProfileAddress);

  const Leaderboard = await ethers.getContractFactory('Leaderboard');
  const leaderboard = Leaderboard.attach(leaderboardAddress);

  console.log('UserProfile contract address:', userProfileAddress);
  console.log('Leaderboard contract address:', leaderboardAddress);

  try {
    // Get total users from UserProfile
    const totalUsers = await userProfile.totalUsers();
    console.log('Total users in UserProfile:', Number(totalUsers));

    // Register some test users in the leaderboard
    const testUsers = [
      { address: '0x2F914bcbAD5bf4967BbB11e4372200b7c7594AEB', username: 'deployer' },
      { address: '0x61b329219e3365B4ad3C60E4437908067Fdb9a84', username: 'testuser1' },
      { address: '0x8c73284b55cb55EB46Dd42617bA6213037e602e9', username: 'testuser2' }
    ];

    for (const user of testUsers) {
      try {
        console.log(`\n👤 Registering ${user.username} (${user.address})...`);
        const tx = await leaderboard.registerUser(user.address, user.username);
        await tx.wait();
        console.log(`✅ ${user.username} registered successfully!`);
      } catch (error) {
        if (error.message.includes('User already registered')) {
          console.log(`ℹ️  ${user.username} already registered`);
        } else {
          console.log(`❌ Error registering ${user.username}:`, error.message);
        }
      }
    }

    // Check leaderboard stats after registration
    console.log('\n📊 Checking leaderboard stats after registration...');
    const [totalUsersLB, lastUpdateTime, topUserAddress, topUserScore] = await leaderboard.getLeaderboardStats();
    console.log('Total Users in Leaderboard:', Number(totalUsersLB));
    console.log('Last Update Time:', new Date(Number(lastUpdateTime) * 1000).toLocaleString());
    console.log('Top User Address:', topUserAddress);
    console.log('Top User Score:', Number(topUserScore));

    // Get top users
    console.log('\n🏆 Top Users:');
    const [users, scores, usernames] = await leaderboard.getTopUsers(5);
    users.forEach((user, index) => {
      console.log(`Rank ${index + 1}: ${usernames[index]} (${user}) - Score: ${Number(scores[index])}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
