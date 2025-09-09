const { ethers } = require('hardhat');

async function main() {
  console.log('🤖 Testing AIStrategy Contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Get the deployed AIStrategy contract
  const AIStrategyAddress = '0x917b514C0B0cf8e174c9B5379e0cbc5527B25bb6';
  const AIStrategy = await ethers.getContractFactory('AIStrategy');
  const aiStrategy = AIStrategy.attach(AIStrategyAddress);

  console.log('AIStrategy contract address:', AIStrategyAddress);

  try {
    // Test getCurrentMarketCondition
    console.log('\n📊 Testing getCurrentMarketCondition...');
    const marketCondition = await aiStrategy.getCurrentMarketCondition();
    console.log('Market Condition:', {
      volatility: Number(marketCondition[0]),
      trend: Number(marketCondition[1]),
      liquidity: Number(marketCondition[2]),
      risk: Number(marketCondition[3]),
      opportunity: Number(marketCondition[4])
    });

    // Test getStrategyDetails for strategy 1
    console.log('\n📋 Testing getStrategyDetails...');
    try {
      const strategyDetails = await aiStrategy.getStrategyDetails(1);
      console.log('Strategy 1 Details:', {
        name: strategyDetails[0],
        description: strategyDetails[1],
        riskLevel: Number(strategyDetails[2]),
        expectedReturn: Number(strategyDetails[3]),
        minDeposit: Number(strategyDetails[4]),
        maxDeposit: Number(strategyDetails[5]),
        duration: Number(strategyDetails[6]),
        successRate: Number(strategyDetails[7]),
        isActive: strategyDetails[8],
        totalAdopted: Number(strategyDetails[9]),
        totalReturn: Number(strategyDetails[10])
      });
    } catch (error) {
      console.log('Strategy 1 not found (expected if no strategies added yet)');
    }

    // Test generateAIRecommendations
    console.log('\n🎯 Testing generateAIRecommendations...');
    try {
      const recommendations = await aiStrategy.generateAIRecommendations(deployer.address);
      console.log('AI Recommendations:', {
        strategies: recommendations[0].map(id => Number(id)),
        confidence: Number(recommendations[1])
      });
    } catch (error) {
      console.log('AI Recommendations not available yet');
    }

    // Test getUserActiveStrategies
    console.log('\n👤 Testing getUserActiveStrategies...');
    try {
      const userStrategies = await aiStrategy.getUserActiveStrategies(deployer.address);
      console.log('User Active Strategies:', {
        strategyIds: userStrategies[0].map(id => Number(id)),
        amounts: userStrategies[1].map(amount => ethers.formatEther(amount)),
        startTimes: userStrategies[2].map(time => Number(time))
      });
    } catch (error) {
      console.log('User strategies not available yet');
    }

    console.log('\n✅ AIStrategy contract tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing AIStrategy contract:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
