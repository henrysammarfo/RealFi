const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('💰 Redeploying YieldVault with new token address...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const newTokenAddress = '0x7941e8df64Ce12751e8823A058ebE9872371eFAc';
  const userProfileAddress = '0x41d87298B54d329872c29ec385367cD4C404e8e6';

  try {
    // Deploy YieldVault with new token address
    console.log('Deploying YieldVault...');
    const YieldVault = await ethers.getContractFactory('YieldVault');
    const yieldVault = await upgrades.deployProxy(
      YieldVault,
      [deployer.address, newTokenAddress, userProfileAddress],
      { initializer: 'initialize' }
    );
    await yieldVault.waitForDeployment();
    
    const yieldVaultAddress = await yieldVault.getAddress();
    console.log('✅ YieldVault deployed to:', yieldVaultAddress);

    // Test the deposit function
    console.log('\n🧪 Testing deposit with new token...');
    const testAmount = ethers.parseEther('1');
    
    // Approve tokens
    const RealFiToken = await ethers.getContractFactory('RealFiToken');
    const token = RealFiToken.attach(newTokenAddress);
    
    const approveTx = await token.approve(yieldVaultAddress, testAmount);
    await approveTx.wait();
    console.log('✅ Token approval successful');

    // Try deposit
    const depositTx = await yieldVault.deposit(testAmount);
    await depositTx.wait();
    console.log('✅ Deposit test successful!');

    // Check vault stats
    const [totalVaultValue, totalYieldDistributed, nextBattleId] = await yieldVault.getVaultStats();
    console.log('\n📊 Vault Stats:');
    console.log('Total Vault Value:', ethers.formatEther(totalVaultValue), 'RFT');
    console.log('Total Yield Distributed:', ethers.formatEther(totalYieldDistributed), 'RFT');
    console.log('Next Battle ID:', Number(nextBattleId));

    console.log('\n📋 Contract Information:');
    console.log('YieldVault Address:', yieldVaultAddress);
    console.log('Token Address:', newTokenAddress);
    console.log('UserProfile Address:', userProfileAddress);

    console.log('\n🔗 Explorer Link:');
    console.log(`https://shannon-explorer.somnia.network/address/${yieldVaultAddress}`);

  } catch (error) {
    console.error('❌ Error deploying YieldVault:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
