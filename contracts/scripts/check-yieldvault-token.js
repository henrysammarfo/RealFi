const { ethers } = require('hardhat');

async function main() {
  console.log('💰 Checking YieldVault Token Configuration...\n');

  const yieldVaultAddress = '0x2ABa80F8931d52DEE8e6732d213eabe795535660';
  const YieldVault = await ethers.getContractFactory('YieldVault');
  const yieldVault = YieldVault.attach(yieldVaultAddress);

  try {
    // Check if YieldVault has a token address function
    console.log('📋 Checking YieldVault contract...');
    
    // Try to get token address (if it exists)
    try {
      const tokenAddress = await yieldVault.token();
      console.log('✅ Token address in YieldVault:', tokenAddress);
    } catch (error) {
      console.log('❌ No token() function in YieldVault:', error.message);
    }

    // Check if YieldVault has a realFiToken function
    try {
      const realFiTokenAddress = await yieldVault.realFiToken();
      console.log('✅ RealFiToken address in YieldVault:', realFiTokenAddress);
    } catch (error) {
      console.log('❌ No realFiToken() function in YieldVault:', error.message);
    }

    // Test deposit function with new token address
    console.log('\n🧪 Testing deposit with new token address...');
    const newTokenAddress = '0x7941e8df64Ce12751e8823A058ebE9872371eFAc';
    const oldTokenAddress = '0x8c73284b55cb55EB46Dd42617bA6213037e602e9';
    
    console.log('New token address:', newTokenAddress);
    console.log('Old token address:', oldTokenAddress);

    // Check if the YieldVault contract is expecting the old token
    const [deployer] = await ethers.getSigners();
    const testAmount = ethers.parseEther('1');
    
    // First, approve the new token for YieldVault
    const RealFiToken = await ethers.getContractFactory('RealFiToken');
    const newToken = RealFiToken.attach(newTokenAddress);
    
    console.log('\n🔐 Approving new token for YieldVault...');
    const approveTx = await newToken.approve(yieldVaultAddress, testAmount);
    await approveTx.wait();
    console.log('✅ Approval successful');

    // Try to deposit
    console.log('\n💰 Testing deposit...');
    try {
      const depositTx = await yieldVault.deposit(testAmount);
      await depositTx.wait();
      console.log('✅ Deposit successful with new token!');
    } catch (error) {
      console.log('❌ Deposit failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking YieldVault:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
