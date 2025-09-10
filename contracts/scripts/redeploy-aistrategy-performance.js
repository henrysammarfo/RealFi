const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🔄 Redeploying AIStrategy with performance tracking...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  try {
    // Deploy AIStrategy
    console.log('Deploying AIStrategy...');
    const AIStrategy = await ethers.getContractFactory('AIStrategy');
    const aiStrategy = await upgrades.deployProxy(
      AIStrategy,
      [deployer.address],
      { initializer: 'initialize' }
    );
    await aiStrategy.waitForDeployment();
    
    const aiStrategyAddress = await aiStrategy.getAddress();
    console.log('✅ AIStrategy deployed to:', aiStrategyAddress);

    // Test the new getUserStrategyPerformance function
    console.log('\n🧪 Testing getUserStrategyPerformance function...');
    
    try {
      // This will fail if no user strategies exist, which is expected
      const performance = await aiStrategy.getUserStrategyPerformance(deployer.address, 0);
      console.log('✅ getUserStrategyPerformance test successful!');
      console.log('Performance data:', {
        strategyId: Number(performance.strategyId),
        depositAmount: ethers.formatEther(performance.depositAmount),
        startTime: Number(performance.startTime),
        endTime: Number(performance.endTime),
        expectedReturn: ethers.formatEther(performance.expectedReturn),
        actualReturn: ethers.formatEther(performance.actualReturn),
        isActive: performance.isActive,
        performanceScore: Number(performance.performanceScore)
      });
    } catch (error) {
      console.log('ℹ️ getUserStrategyPerformance test expected to fail (no user strategies yet):', error.message);
    }

    // Test strategy details
    console.log('\n🧪 Testing getStrategyDetails function...');
    try {
      const strategyDetails = await aiStrategy.getStrategyDetails(1);
      console.log('✅ Strategy details test successful!');
      console.log('Strategy 1 details:', {
        name: strategyDetails.name,
        description: strategyDetails.description,
        riskLevel: Number(strategyDetails.riskLevel),
        expectedYield: Number(strategyDetails.expectedYield),
        isActive: strategyDetails.isActive
      });
    } catch (error) {
      console.log('ℹ️ Strategy details test expected to fail (no strategies created yet):', error.message);
    }

    console.log('\n📋 Contract Information:');
    console.log('AIStrategy Address:', aiStrategyAddress);

    console.log('\n🔗 Explorer Links:');
    console.log(`AIStrategy: https://shannon-explorer.somnia.network/address/${aiStrategyAddress}`);

  } catch (error) {
    console.error('❌ Error deploying AIStrategy:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
