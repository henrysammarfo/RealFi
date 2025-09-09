const { ethers } = require('hardhat');

async function main() {
  console.log('🤖 Checking AIStrategy Contract Deployment...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const addresses = [
    '0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01', // From frontend config
    '0x917b514C0B0cf8e174c9B5379e0cbc5527B25bb6'  // From test script
  ];

  for (const address of addresses) {
    console.log(`\n📋 Checking AIStrategy at ${address}...`);
    try {
      const code = await ethers.provider.getCode(address);
      if (code === '0x') {
        console.log('❌ No contract deployed at this address');
      } else {
        console.log(`✅ Contract deployed (${code.length} bytes)`);
        
        // Try to interact with the contract
        const AIStrategy = await ethers.getContractFactory('AIStrategy');
        const contract = AIStrategy.attach(address);
        
        try {
          const totalStrategies = await contract.totalStrategies();
          console.log(`📊 Total strategies: ${Number(totalStrategies)}`);
          
          // Test strategy 1
          const strategy1 = await contract.getStrategyDetails(1);
          console.log(`📋 Strategy 1: ${strategy1[0]} (Active: ${strategy1[7]})`);
        } catch (error) {
          console.log('❌ Error interacting with contract:', error.message);
        }
      }
    } catch (error) {
      console.log('❌ Error checking address:', error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
