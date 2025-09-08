const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Real Transaction on Somnia Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const balanceBefore = await deployer.provider.getBalance(deployer.address);
  console.log("Balance before:", ethers.formatEther(balanceBefore), "ETH");

  // Test with RealFi Token
  const tokenAddress = "0x8c73284b55cb55EB46Dd42617bA6213037e602e9";
  const token = await ethers.getContractAt("RealFiToken", tokenAddress);
  
  console.log("\n📝 Testing RealFi Token transaction...");
  
  // Get current token balance
  const tokenBalanceBefore = await token.balanceOf(deployer.address);
  console.log("Token balance before:", ethers.formatEther(tokenBalanceBefore), "RFT");
  
  // Try to mint more tokens (this should fail if not owner, proving it's real)
  try {
    console.log("Attempting to mint tokens (should fail if not owner)...");
    const mintTx = await token.mint(deployer.address, ethers.parseEther("1000"));
    await mintTx.wait();
    console.log("✅ Mint transaction successful!");
    
    const tokenBalanceAfter = await token.balanceOf(deployer.address);
    console.log("Token balance after:", ethers.formatEther(tokenBalanceAfter), "RFT");
  } catch (error) {
    console.log("❌ Mint failed (expected if not owner):", error.message);
  }

  // Test UserProfile registration
  console.log("\n👤 Testing UserProfile registration...");
  const userProfileAddress = "0x41d87298B54d329872c29ec385367cD4C404e8e6";
  const userProfile = await ethers.getContractAt("UserProfile", userProfileAddress);
  
  try {
    console.log("Attempting to register user...");
    const registerTx = await userProfile.registerUser("testuser");
    const receipt = await registerTx.wait();
    console.log("✅ User registration successful!");
    console.log("Transaction hash:", receipt.hash);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check user data
    const [username, registrationTime, totalDeposits, totalWithdrawals, battlesJoined, battlesWon, reputationScore, isActive] = 
      await userProfile.getUserData(deployer.address);
    console.log("Username:", username);
    console.log("Reputation score:", reputationScore.toString());
    console.log("Is active:", isActive);
    
  } catch (error) {
    console.log("❌ Registration failed:", error.message);
  }

  const balanceAfter = await deployer.provider.getBalance(deployer.address);
  console.log("\nBalance after:", ethers.formatEther(balanceAfter), "ETH");
  console.log("Gas used:", ethers.formatEther(balanceBefore - balanceAfter), "ETH");

  console.log("\n" + "=".repeat(80));
  console.log("🎉 REAL TRANSACTION TEST COMPLETE!");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
