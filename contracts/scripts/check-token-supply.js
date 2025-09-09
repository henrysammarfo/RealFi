const { ethers } = require('hardhat');

async function main() {
  console.log('🪙 Checking Token Supply Status...\n');

  const tokenAddress = '0x8c73284b55cb55EB46Dd42617bA6213037e602e9';
  const RealFiToken = await ethers.getContractFactory('RealFiToken');
  const token = RealFiToken.attach(tokenAddress);

  try {
    const totalSupply = await token.totalSupply();
    const maxSupply = await token.MAX_SUPPLY();
    const initialSupply = await token.INITIAL_SUPPLY();
    
    console.log('📊 Token Supply Information:');
    console.log('Total Supply:', ethers.formatEther(totalSupply), 'RFT');
    console.log('Max Supply:', ethers.formatEther(maxSupply), 'RFT');
    console.log('Initial Supply:', ethers.formatEther(initialSupply), 'RFT');
    console.log('Available for minting:', ethers.formatEther(maxSupply - totalSupply), 'RFT');
    
    // Check if user can mint 1000 tokens
    const mintAmount = ethers.parseEther('1000');
    const canMint = totalSupply + mintAmount <= maxSupply;
    console.log('\n🎯 Can mint 1000 RFT?', canMint);
    
    if (!canMint) {
      console.log('❌ Cannot mint 1000 RFT - would exceed max supply');
      const maxMintable = maxSupply - totalSupply;
      console.log('Max mintable amount:', ethers.formatEther(maxMintable), 'RFT');
    }

    // Check user's current balance
    const userAddress = '0x61b329219e3365B4ad3C60E4437908067Fdb9a84';
    const userBalance = await token.balanceOf(userAddress);
    console.log('\n👤 User Balance:');
    console.log('Address:', userAddress);
    console.log('Balance:', ethers.formatEther(userBalance), 'RFT');

  } catch (error) {
    console.error('❌ Error checking token supply:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
