const { ethers } = require('hardhat');

async function main() {
  console.log('🪙 Checking Token Contract Functions...\n');

  const tokenAddress = '0x8c73284b55cb55EB46Dd42617bA6213037e602e9';
  
  try {
    // Get the contract code
    const code = await ethers.provider.getCode(tokenAddress);
    console.log('Contract code length:', code.length, 'bytes');
    
    if (code === '0x') {
      console.log('❌ No contract at this address');
      return;
    }

    // Try to create contract instance and check functions
    const RealFiToken = await ethers.getContractFactory('RealFiToken');
    const token = RealFiToken.attach(tokenAddress);

    console.log('\n📋 Testing contract functions...');
    
    // Test basic functions
    try {
      const name = await token.name();
      console.log('✅ Token name:', name);
    } catch (error) {
      console.log('❌ name() failed:', error.message);
    }

    try {
      const symbol = await token.symbol();
      console.log('✅ Token symbol:', symbol);
    } catch (error) {
      console.log('❌ symbol() failed:', error.message);
    }

    try {
      const totalSupply = await token.totalSupply();
      console.log('✅ Total supply:', ethers.formatEther(totalSupply), 'RFT');
    } catch (error) {
      console.log('❌ totalSupply() failed:', error.message);
    }

    try {
      const maxSupply = await token.MAX_SUPPLY();
      console.log('✅ Max supply:', ethers.formatEther(maxSupply), 'RFT');
    } catch (error) {
      console.log('❌ MAX_SUPPLY() failed:', error.message);
    }

    // Test publicMint function
    try {
      console.log('\n🎯 Testing publicMint function...');
      // Try to call publicMint with 0 amount to see if function exists
      const tx = await token.publicMint(0);
      console.log('✅ publicMint function exists and callable');
    } catch (error) {
      console.log('❌ publicMint() failed:', error.message);
      
      // Check if it's a function not found error
      if (error.message.includes('function') && error.message.includes('not found')) {
        console.log('🔍 publicMint function does not exist on deployed contract');
      }
    }

    // Check if there's a different mint function
    try {
      console.log('\n🎯 Testing mint function...');
      const tx = await token.mint(ethers.ZeroAddress, 0);
      console.log('✅ mint function exists');
    } catch (error) {
      console.log('❌ mint() failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking token functions:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
