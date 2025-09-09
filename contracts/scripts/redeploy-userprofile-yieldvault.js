const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🔄 Redeploying UserProfile and YieldVault with user stats integration...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const newTokenAddress = '0x7941e8df64Ce12751e8823A058ebE9872371eFAc';
  const leaderboardAddress = '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f';

  try {
    // Deploy UserProfile
    console.log('Deploying UserProfile...');
    const UserProfile = await ethers.getContractFactory('UserProfile');
    const userProfile = await upgrades.deployProxy(
      UserProfile,
      [deployer.address],
      { initializer: 'initialize' }
    );
    await userProfile.waitForDeployment();
    
    const userProfileAddress = await userProfile.getAddress();
    console.log('✅ UserProfile deployed to:', userProfileAddress);

    // Deploy YieldVault with new UserProfile address
    console.log('\nDeploying YieldVault...');
    const YieldVault = await ethers.getContractFactory('YieldVault');
    const yieldVault = await upgrades.deployProxy(
      YieldVault,
      [deployer.address, newTokenAddress, userProfileAddress],
      { initializer: 'initialize' }
    );
    await yieldVault.waitForDeployment();
    
    const yieldVaultAddress = await yieldVault.getAddress();
    console.log('✅ YieldVault deployed to:', yieldVaultAddress);

    // Set up contract references
    console.log('\n⚙️ Setting up contract references...');
    
    // Set leaderboard contract in UserProfile
    await userProfile.setLeaderboardContract(leaderboardAddress);
    console.log('✅ Leaderboard contract set in UserProfile');
    
    // Set YieldVault contract in UserProfile
    await userProfile.setYieldVaultContract(yieldVaultAddress);
    console.log('✅ YieldVault contract set in UserProfile');

    // Test the integration
    console.log('\n🧪 Testing user stats integration...');
    
    // Register a test user
    const testUsername = 'testuser_stats';
    await userProfile.registerUser(testUsername);
    console.log('✅ Test user registered');
    
    // Test deposit and user stats update
    const testAmount = ethers.parseEther('1');
    
    // Approve tokens
    const RealFiToken = await ethers.getContractFactory('RealFiToken');
    const token = RealFiToken.attach(newTokenAddress);
    const approveTx = await token.approve(yieldVaultAddress, testAmount);
    await approveTx.wait();
    console.log('✅ Token approval successful');
    
    // Make deposit
    const depositTx = await yieldVault.deposit(testAmount);
    await depositTx.wait();
    console.log('✅ Deposit successful');
    
    // Check user stats
    const userData = await userProfile.getUserData(deployer.address);
    console.log('📊 User stats after deposit:');
    console.log('Total Deposits:', ethers.formatEther(userData.totalDeposits), 'RFT');
    console.log('Battles Joined:', Number(userData.battlesJoined));
    console.log('Reputation Score:', Number(userData.reputationScore));

    console.log('\n📋 Contract Information:');
    console.log('UserProfile Address:', userProfileAddress);
    console.log('YieldVault Address:', yieldVaultAddress);
    console.log('RealFiToken Address:', newTokenAddress);
    console.log('Leaderboard Address:', leaderboardAddress);

    console.log('\n🔗 Explorer Links:');
    console.log(`UserProfile: https://shannon-explorer.somnia.network/address/${userProfileAddress}`);
    console.log(`YieldVault: https://shannon-explorer.somnia.network/address/${yieldVaultAddress}`);

  } catch (error) {
    console.error('❌ Error deploying contracts:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
