const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🔄 Redeploying UserProfile with isUserRegistered fix...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

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

    // Test isUserRegistered function
    console.log('\n🧪 Testing isUserRegistered function...');
    
    try {
      const isRegistered = await userProfile.isUserRegistered(deployer.address);
      console.log('✅ isUserRegistered test successful!');
      console.log('Deployer registered:', isRegistered);
      
      // Test with a random address
      const randomAddress = '0x1234567890123456789012345678901234567890';
      const isRandomRegistered = await userProfile.isUserRegistered(randomAddress);
      console.log('Random address registered:', isRandomRegistered);
      
    } catch (error) {
      console.error('❌ isUserRegistered test failed:', error.message);
    }

    console.log('\n📋 Contract Information:');
    console.log('UserProfile Address:', userProfileAddress);

    console.log('\n🔗 Explorer Links:');
    console.log(`UserProfile: https://shannon-explorer.somnia.network/address/${userProfileAddress}`);

  } catch (error) {
    console.error('❌ Error deploying UserProfile:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
