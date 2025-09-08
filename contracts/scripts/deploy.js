const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Starting RealFi DeFi Platform Deployment to Somnia Testnet...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy RealFi Token first
  console.log("📝 Deploying RealFi Token...");
  const RealFiToken = await ethers.getContractFactory("RealFiToken");
  const token = await RealFiToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ RealFi Token deployed to:", tokenAddress);

  // Deploy UserProfile contract
  console.log("\n👤 Deploying UserProfile contract...");
  const UserProfile = await ethers.getContractFactory("UserProfile");
  const userProfile = await upgrades.deployProxy(UserProfile, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await userProfile.waitForDeployment();
  const userProfileAddress = await userProfile.getAddress();
  console.log("✅ UserProfile deployed to:", userProfileAddress);

  // Deploy YieldVault contract
  console.log("\n🏦 Deploying YieldVault contract...");
  const YieldVault = await ethers.getContractFactory("YieldVault");
  const yieldVault = await upgrades.deployProxy(YieldVault, [deployer.address, tokenAddress, userProfileAddress], {
    initializer: "initialize",
    kind: "uups"
  });
  await yieldVault.waitForDeployment();
  const yieldVaultAddress = await yieldVault.getAddress();
  console.log("✅ YieldVault deployed to:", yieldVaultAddress);

  // Deploy Leaderboard contract
  console.log("\n🏆 Deploying Leaderboard contract...");
  const Leaderboard = await ethers.getContractFactory("Leaderboard");
  const leaderboard = await upgrades.deployProxy(Leaderboard, [deployer.address, yieldVaultAddress, userProfileAddress], {
    initializer: "initialize",
    kind: "uups"
  });
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("✅ Leaderboard deployed to:", leaderboardAddress);

  // Deploy CrossChainBridge contract
  console.log("\n🌉 Deploying CrossChainBridge contract...");
  const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
  const crossChainBridge = await upgrades.deployProxy(CrossChainBridge, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await crossChainBridge.waitForDeployment();
  const crossChainBridgeAddress = await crossChainBridge.getAddress();
  console.log("✅ CrossChainBridge deployed to:", crossChainBridgeAddress);

  // Deploy AIStrategy contract
  console.log("\n🤖 Deploying AIStrategy contract...");
  const AIStrategy = await ethers.getContractFactory("AIStrategy");
  const aiStrategy = await upgrades.deployProxy(AIStrategy, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await aiStrategy.waitForDeployment();
  const aiStrategyAddress = await aiStrategy.getAddress();
  console.log("✅ AIStrategy deployed to:", aiStrategyAddress);

  // Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");
  
  // Create some initial yield battles
  console.log("Creating initial yield battles...");
  await yieldVault.createBattle("Welcome Battle", ethers.parseEther("0.001"), 50, 7 * 24 * 60 * 60); // 7 days
  await yieldVault.createBattle("High Stakes", ethers.parseEther("0.01"), 20, 14 * 24 * 60 * 60); // 14 days
  await yieldVault.createBattle("Mega Battle", ethers.parseEther("0.1"), 10, 30 * 24 * 60 * 60); // 30 days
  console.log("✅ Initial battles created");

  // Mint some tokens for testing
  console.log("Minting test tokens...");
  await token.mint(deployer.address, ethers.parseEther("10000")); // 10,000 tokens for testing
  console.log("✅ Test tokens minted");

  // Display deployment summary
  console.log("\n" + "=".repeat(80));
  console.log("🎉 RealFi DeFi Platform Successfully Deployed to Somnia Testnet!");
  console.log("=".repeat(80));
  console.log("\n📋 Contract Addresses:");
  console.log("┌─────────────────────┬──────────────────────────────────────────────┐");
  console.log("│ Contract            │ Address                                      │");
  console.log("├─────────────────────┼──────────────────────────────────────────────┤");
  console.log(`│ RealFiToken         │ ${tokenAddress.padEnd(42)} │`);
  console.log(`│ UserProfile         │ ${userProfileAddress.padEnd(42)} │`);
  console.log(`│ YieldVault          │ ${yieldVaultAddress.padEnd(42)} │`);
  console.log(`│ Leaderboard         │ ${leaderboardAddress.padEnd(42)} │`);
  console.log(`│ CrossChainBridge    │ ${crossChainBridgeAddress.padEnd(42)} │`);
  console.log(`│ AIStrategy          │ ${aiStrategyAddress.padEnd(42)} │`);
  console.log("└─────────────────────┴──────────────────────────────────────────────┘");

  console.log("\n🔗 Network Information:");
  console.log("• Network: Somnia Testnet");
  console.log("• Chain ID: 420 (Update with actual Somnia Testnet chain ID)");
  console.log("• RPC URL: https://testnet.somnia.network");
  console.log("• Explorer: https://testnet-explorer.somnia.network");
  console.log("• Faucet: https://faucet.somnia.network");

  console.log("\n📝 Next Steps:");
  console.log("1. Update frontend configuration with these contract addresses");
  console.log("2. Test the contracts with sample transactions");
  console.log("3. Deploy the React frontend");
  console.log("4. Run integration tests");

  console.log("\n⚠️  Important Notes:");
  console.log("• All contracts are upgradeable (UUPS pattern)");
  console.log("• Only the deployer can upgrade contracts");
  console.log("• Test thoroughly before mainnet deployment");
  console.log("• Keep private keys secure");

  // Save deployment info to file
  const deploymentInfo = {
    network: "somnia-testnet",
    chainId: 420,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      RealFiToken: tokenAddress,
      UserProfile: userProfileAddress,
      YieldVault: yieldVaultAddress,
      Leaderboard: leaderboardAddress,
      CrossChainBridge: crossChainBridgeAddress,
      AIStrategy: aiStrategyAddress
    }
  };

  const fs = require('fs');
  fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment-info.json");

  console.log("\n🚀 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
