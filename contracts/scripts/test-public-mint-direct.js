const { ethers } = require('hardhat');

async function main() {
  console.log('🪙 Testing Public Mint Function Directly...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const tokenAddress = '0x8c73284b55cb55EB46Dd42617bA6213037e602e9';
  const RealFiToken = await ethers.getContractFactory('RealFiToken');
  const token = RealFiToken.attach(tokenAddress);

  try {
    // Test minting 1000 RFT tokens
    const mintAmount = ethers.parseEther('1000');
    console.log('Attempting to mint:', ethers.formatEther(mintAmount), 'RFT');
    
    // Check current balance
    const balanceBefore = await token.balanceOf(deployer.address);
    console.log('Balance before:', ethers.formatEther(balanceBefore), 'RFT');
    
    // Try to mint
    console.log('Calling publicMint...');
    const tx = await token.publicMint(mintAmount);
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);
    
    // Check balance after
    const balanceAfter = await token.balanceOf(deployer.address);
    console.log('Balance after:', ethers.formatEther(balanceAfter), 'RFT');
    console.log('Minted amount:', ethers.formatEther(balanceAfter - balanceBefore), 'RFT');
    
    console.log('✅ Public mint successful!');

  } catch (error) {
    console.error('❌ Public mint failed:', error);
    
    // Try to get more details about the error
    if (error.data) {
      console.log('Error data:', error.data);
    }
    if (error.reason) {
      console.log('Error reason:', error.reason);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
