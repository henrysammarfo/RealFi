const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🪙 Redeploying RealFiToken with publicMint function...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  try {
    // Deploy RealFiToken (not upgradeable, just regular deployment)
    console.log('Deploying RealFiToken...');
    const RealFiToken = await ethers.getContractFactory('RealFiToken');
    const token = await RealFiToken.deploy();
    await token.waitForDeployment();
    
    const tokenAddress = await token.getAddress();
    console.log('✅ RealFiToken deployed to:', tokenAddress);

    // Test the publicMint function
    console.log('\n🧪 Testing publicMint function...');
    const mintAmount = ethers.parseEther('1000');
    const tx = await token.publicMint(mintAmount);
    await tx.wait();
    console.log('✅ publicMint test successful!');

    // Check balance
    const balance = await token.balanceOf(deployer.address);
    console.log('Deployer balance:', ethers.formatEther(balance), 'RFT');

    console.log('\n📋 Contract Information:');
    console.log('Address:', tokenAddress);
    console.log('Name:', await token.name());
    console.log('Symbol:', await token.symbol());
    console.log('Total Supply:', ethers.formatEther(await token.totalSupply()), 'RFT');
    console.log('Max Supply:', ethers.formatEther(await token.MAX_SUPPLY()), 'RFT');

    console.log('\n🔗 Explorer Link:');
    console.log(`https://shannon-explorer.somnia.network/address/${tokenAddress}`);

  } catch (error) {
    console.error('❌ Error deploying RealFiToken:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
