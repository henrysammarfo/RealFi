const { ethers } = require('hardhat');

async function main() {
  console.log('🪙 Testing RealFiToken PublicMint Function...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  
  // Create a test user address
  const userAddress = '0x61b329219e3365B4ad3C60E4437908067Fdb9a84';
  console.log('User address:', userAddress);

  // Get the deployed RealFiToken contract
  const RealFiTokenAddress = '0x8a3302773939f504074098f3F268Ae019F70f4c3';
  const RealFiToken = await ethers.getContractFactory('RealFiToken');
  const token = RealFiToken.attach(RealFiTokenAddress);

  console.log('RealFiToken contract address:', RealFiTokenAddress);

  try {
    // Check initial balance
    const initialBalance = await token.balanceOf(userAddress);
    console.log('\n💰 Initial user balance:', ethers.formatEther(initialBalance), 'RFT');

    // Test publicMint function
    console.log('\n🪙 Testing publicMint function...');
    const mintAmount = ethers.parseEther('1000'); // 1000 RFT
    
    const tx = await token.publicMint(mintAmount);
    console.log('Transaction hash:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Check new balance
    const newBalance = await token.balanceOf(userAddress);
    console.log('New user balance:', ethers.formatEther(newBalance), 'RFT');

    // Check total supply
    const totalSupply = await token.totalSupply();
    console.log('Total supply:', ethers.formatEther(totalSupply), 'RFT');

    console.log('\n✅ PublicMint function test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing publicMint function:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
