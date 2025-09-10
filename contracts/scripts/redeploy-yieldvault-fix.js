const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🔄 Redeploying YieldVault with createBattle fix...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const tokenAddress = '0x7941e8df64Ce12751e8823A058ebE9872371eFAc';
  const userProfileAddress = '0x6C76a75860F150DC1A1fD3b369Dde113De02aD55';

  try {
    // Deploy YieldVault
    console.log('Deploying YieldVault...');
    const YieldVault = await ethers.getContractFactory('YieldVault');
    const yieldVault = await upgrades.deployProxy(
      YieldVault,
      [deployer.address, tokenAddress, userProfileAddress],
      { initializer: 'initialize' }
    );
    await yieldVault.waitForDeployment();
    
    const yieldVaultAddress = await yieldVault.getAddress();
    console.log('✅ YieldVault deployed to:', yieldVaultAddress);

    // Test creating a battle
    console.log('\n🧪 Testing createBattle function...');
    
    const testBattleName = 'Test Battle';
    const testEntryFee = ethers.parseEther('0.1'); // 0.1 RFT
    const testMaxParticipants = 10;
    const testDuration = 2 * 60 * 60; // 2 hours in seconds
    
    try {
      const createTx = await yieldVault.createBattle(
        testBattleName,
        testEntryFee,
        testMaxParticipants,
        testDuration
      );
      await createTx.wait();
      console.log('✅ createBattle test successful!');
      
      // Get battle details
      const battleDetails = await yieldVault.getBattleDetails(1);
      console.log('📊 Battle details:');
      console.log('Name:', battleDetails.name);
      console.log('Entry Fee:', ethers.formatEther(battleDetails.entryFee), 'RFT');
      console.log('Max Participants:', Number(battleDetails.maxParticipants));
      console.log('Duration:', Number(battleDetails.duration), 'seconds');
      console.log('Active:', battleDetails.isActive);
      
    } catch (error) {
      console.error('❌ createBattle test failed:', error.message);
    }

    console.log('\n📋 Contract Information:');
    console.log('YieldVault Address:', yieldVaultAddress);
    console.log('RealFiToken Address:', tokenAddress);
    console.log('UserProfile Address:', userProfileAddress);

    console.log('\n🔗 Explorer Links:');
    console.log(`YieldVault: https://shannon-explorer.somnia.network/address/${yieldVaultAddress}`);

  } catch (error) {
    console.error('❌ Error deploying YieldVault:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
