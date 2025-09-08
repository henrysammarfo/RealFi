const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Live RealFi Contracts on Somnia Testnet...\n");

  // Contract addresses (LIVE on Somnia Testnet)
  const contracts = {
    RealFiToken: "0x8c73284b55cb55EB46Dd42617bA6213037e602e9",
    UserProfile: "0x41d87298B54d329872c29ec385367cD4C404e8e6",
    YieldVault: "0x2ABa80F8931d52DEE8e6732d213eabe795535660",
    Leaderboard: "0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f",
    CrossChainBridge: "0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d"
  };

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Test RealFi Token
  console.log("📝 Testing RealFi Token...");
  try {
    const token = await ethers.getContractAt("RealFiToken", contracts.RealFiToken);
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    const balance = await token.balanceOf(deployer.address);
    
    console.log(`✅ Token Name: ${name}`);
    console.log(`✅ Token Symbol: ${symbol}`);
    console.log(`✅ Total Supply: ${ethers.formatEther(totalSupply)} RFT`);
    console.log(`✅ Deployer Balance: ${ethers.formatEther(balance)} RFT`);
  } catch (error) {
    console.log(`❌ Token test failed: ${error.message}`);
  }

  // Test UserProfile
  console.log("\n👤 Testing UserProfile...");
  try {
    const userProfile = await ethers.getContractAt("UserProfile", contracts.UserProfile);
    const [totalUsers, activeUsers] = await userProfile.getTotalStats();
    
    console.log(`✅ Total Users: ${totalUsers}`);
    console.log(`✅ Active Users: ${activeUsers}`);
  } catch (error) {
    console.log(`❌ UserProfile test failed: ${error.message}`);
  }

  // Test YieldVault
  console.log("\n🏦 Testing YieldVault...");
  try {
    const yieldVault = await ethers.getContractAt("YieldVault", contracts.YieldVault);
    const [totalVaultValue, totalYieldDistributed, nextBattleId] = await yieldVault.getVaultStats();
    
    console.log(`✅ Total Vault Value: ${ethers.formatEther(totalVaultValue)} RFT`);
    console.log(`✅ Total Yield Distributed: ${ethers.formatEther(totalYieldDistributed)} RFT`);
    console.log(`✅ Next Battle ID: ${nextBattleId}`);
  } catch (error) {
    console.log(`❌ YieldVault test failed: ${error.message}`);
  }

  // Test Leaderboard
  console.log("\n🏆 Testing Leaderboard...");
  try {
    const leaderboard = await ethers.getContractAt("Leaderboard", contracts.Leaderboard);
    const [totalUsers, lastUpdateTime, topUser, topScore] = await leaderboard.getLeaderboardStats();
    
    console.log(`✅ Total Users: ${totalUsers}`);
    console.log(`✅ Last Update: ${new Date(Number(lastUpdateTime) * 1000).toLocaleString()}`);
    console.log(`✅ Top User: ${topUser}`);
    console.log(`✅ Top Score: ${topScore}`);
  } catch (error) {
    console.log(`❌ Leaderboard test failed: ${error.message}`);
  }

  // Test CrossChainBridge
  console.log("\n🌉 Testing CrossChainBridge...");
  try {
    const bridge = await ethers.getContractAt("CrossChainBridge", contracts.CrossChainBridge);
    const [totalBridges, totalVolume, nextRequestId] = await bridge.getBridgeStats();
    
    console.log(`✅ Total Bridges: ${totalBridges}`);
    console.log(`✅ Total Volume: ${ethers.formatEther(totalVolume)} RFT`);
    console.log(`✅ Next Request ID: ${nextRequestId}`);
  } catch (error) {
    console.log(`❌ CrossChainBridge test failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎉 Live Contract Testing Complete!");
  console.log("=".repeat(80));
  console.log("\n📋 Contract Addresses (LIVE on Somnia Testnet):");
  console.log(`• RealFiToken: ${contracts.RealFiToken}`);
  console.log(`• UserProfile: ${contracts.UserProfile}`);
  console.log(`• YieldVault: ${contracts.YieldVault}`);
  console.log(`• Leaderboard: ${contracts.Leaderboard}`);
  console.log(`• CrossChainBridge: ${contracts.CrossChainBridge}`);
  console.log("\n🔗 Explorer: https://testnet-explorer.somnia.network");
  console.log("🌐 RPC: https://dream-rpc.somnia.network");
  console.log("⛓️  Chain ID: 50312");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
