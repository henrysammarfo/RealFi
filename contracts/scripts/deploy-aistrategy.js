const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🤖 Deploying AIStrategy contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy AIStrategy contract
  const AIStrategy = await ethers.getContractFactory("AIStrategy");
  const aiStrategy = await upgrades.deployProxy(AIStrategy, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await aiStrategy.waitForDeployment();
  const aiStrategyAddress = await aiStrategy.getAddress();
  console.log("✅ AIStrategy deployed to:", aiStrategyAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "somnia-testnet",
    chainId: 50312,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AIStrategy: aiStrategyAddress
    }
  };

  const fs = require('fs');
  fs.writeFileSync('./ai-strategy-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 AIStrategy deployment info saved to ai-strategy-deployment.json");

  console.log("\n🎉 AIStrategy deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
