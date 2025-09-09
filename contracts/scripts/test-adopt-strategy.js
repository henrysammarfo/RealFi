const { ethers } = require('hardhat');

async function main() {
  console.log('🤖 Testing Adopt Strategy Function...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const aiStrategyAddress = '0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01'; // Frontend config address
  const AIStrategy = await ethers.getContractFactory('AIStrategy');
  const aiStrategy = AIStrategy.attach(aiStrategyAddress);

  console.log('AIStrategy contract address:', aiStrategyAddress);

  try {
    // Test adopting strategy 1 with 1 RFT
    console.log('\n🎯 Testing adoptStrategy function...');
    const amount = ethers.parseEther('1'); // 1 RFT
    
    // First check if user has enough tokens
    const tokenAddress = '0x8c73284b55cb55EB46Dd42617bA6213037e602e9';
    const RealFiToken = await ethers.getContractFactory('RealFiToken');
    const token = RealFiToken.attach(tokenAddress);
    
    const balance = await token.balanceOf(deployer.address);
    console.log('User token balance:', ethers.formatEther(balance), 'RFT');
    
    if (balance < amount) {
      console.log('❌ Insufficient token balance for testing');
      return;
    }
    
    // Approve tokens for AIStrategy contract
    console.log('Approving tokens...');
    const approveTx = await token.approve(aiStrategyAddress, amount);
    await approveTx.wait();
    console.log('✅ Tokens approved');
    
    // Try to adopt strategy
    console.log('Adopting strategy 1...');
    const adoptTx = await aiStrategy.adoptStrategy(1, amount);
    const receipt = await adoptTx.wait();
    
    console.log('✅ Strategy adopted successfully!');
    console.log('Transaction hash:', receipt.hash);
    
    // Check user's active strategies
    console.log('\n📋 Checking user active strategies...');
    const [strategyIds, amounts, startTimes] = await aiStrategy.getUserActiveStrategies(deployer.address);
    console.log('Active strategies:', strategyIds.map((id, index) => ({
      strategyId: Number(id),
      amount: ethers.formatEther(amounts[index]),
      startTime: new Date(Number(startTimes[index]) * 1000).toLocaleString()
    })));

  } catch (error) {
    console.error('❌ Error testing adopt strategy:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
