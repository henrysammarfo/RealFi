const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Checking AIStrategy contract...\n');

  const aiStrategyAddress = '0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01';
  
  try {
    // Get the contract
    const AIStrategy = await ethers.getContractFactory('AIStrategy');
    const aiStrategy = AIStrategy.attach(aiStrategyAddress);
    
    console.log('AIStrategy contract address:', aiStrategyAddress);
    
    // Check total strategies
    const stats = await aiStrategy.getAIStrategyStats();
    console.log('Total strategies:', Number(stats._totalStrategies));
    console.log('Total users with strategies:', Number(stats._totalUsersWithStrategies));
    
    // Check if strategies exist
    if (Number(stats._totalStrategies) === 0) {
      console.log('\n❌ No strategies found! Creating default strategies...');
      
      const [deployer] = await ethers.getSigners();
      console.log('Deployer address:', deployer.address);
      
      // Create strategies
      const strategies = [
        {
          name: "Conservative Yield",
          description: "Low-risk strategy focusing on stable yields with minimal volatility",
          riskLevel: 2,
          expectedYield: 800, // 8% APY
          minDeposit: ethers.parseEther("0.1"),
          maxDeposit: ethers.parseEther("10"),
          duration: 30
        },
        {
          name: "Balanced Growth", 
          description: "Moderate risk strategy balancing yield and growth potential",
          riskLevel: 5,
          expectedYield: 1500, // 15% APY
          minDeposit: ethers.parseEther("0.05"),
          maxDeposit: ethers.parseEther("50"),
          duration: 60
        },
        {
          name: "High Yield Aggressive",
          description: "High-risk strategy targeting maximum yield with higher volatility", 
          riskLevel: 8,
          expectedYield: 3000, // 30% APY
          minDeposit: ethers.parseEther("0.2"),
          maxDeposit: ethers.parseEther("100"),
          duration: 90
        },
        {
          name: "DeFi Farming",
          description: "Strategy focused on DeFi protocol farming and liquidity provision",
          riskLevel: 6,
          expectedYield: 2000, // 20% APY
          minDeposit: ethers.parseEther("0.1"),
          maxDeposit: ethers.parseEther("200"),
          duration: 45
        }
      ];
      
      for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`\nCreating strategy ${i + 1}: ${strategy.name}`);
        
        try {
          const tx = await aiStrategy.createStrategy(
            strategy.name,
            strategy.description,
            strategy.riskLevel,
            strategy.expectedYield,
            strategy.minDeposit,
            strategy.maxDeposit,
            strategy.duration
          );
          await tx.wait();
          console.log(`✅ Strategy ${i + 1} created successfully`);
        } catch (error) {
          console.error(`❌ Failed to create strategy ${i + 1}:`, error.message);
        }
      }
      
      // Check final stats
      const finalStats = await aiStrategy.getAIStrategyStats();
      console.log('\n📊 Final stats:');
      console.log('Total strategies:', Number(finalStats._totalStrategies));
      console.log('Total users with strategies:', Number(finalStats._totalUsersWithStrategies));
      
    } else {
      console.log('\n✅ Strategies already exist!');
      
      // List existing strategies
      for (let i = 1; i <= Number(stats._totalStrategies); i++) {
        try {
          const strategyDetails = await aiStrategy.getStrategyDetails(i);
          console.log(`\nStrategy ${i}:`);
          console.log('Name:', strategyDetails.name);
          console.log('Description:', strategyDetails.description);
          console.log('Risk Level:', Number(strategyDetails.riskLevel));
          console.log('Expected Yield:', Number(strategyDetails.expectedYield), 'basis points');
          console.log('Min Deposit:', ethers.formatEther(strategyDetails.minDeposit), 'RFT');
          console.log('Max Deposit:', ethers.formatEther(strategyDetails.maxDeposit), 'RFT');
          console.log('Duration:', Number(strategyDetails.duration), 'days');
          console.log('Active:', strategyDetails.isActive);
          console.log('Total Users:', Number(strategyDetails.totalUsers));
          console.log('Success Rate:', Number(strategyDetails.successRate), '%');
        } catch (error) {
          console.log(`Strategy ${i}: Error reading details - ${error.message}`);
        }
      }
    }
    
    // Check market condition
    const marketCondition = await aiStrategy.getCurrentMarketCondition();
    console.log('\n📈 Market Condition:');
    console.log('Volatility:', Number(marketCondition.volatility));
    console.log('Liquidity:', Number(marketCondition.liquidity));
    console.log('Yield Trend:', Number(marketCondition.yieldTrend));
    console.log('Risk Level:', Number(marketCondition.riskLevel));
    console.log('Timestamp:', new Date(Number(marketCondition.timestamp) * 1000).toLocaleString());
    
  } catch (error) {
    console.error('❌ Error checking AIStrategy contract:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});