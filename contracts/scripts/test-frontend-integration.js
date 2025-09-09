const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Frontend Integration...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Test UserProfile contract
  console.log("\n👤 Testing UserProfile contract...");
  const userProfileAddress = "0x41d87298B54d329872c29ec385367cD4C404e8e6";
  
  try {
    // Get the contract code to see what methods are available
    const code = await deployer.provider.getCode(userProfileAddress);
    console.log("Contract code length:", code.length, "bytes");
    
    // Try to call a simple method
    const userProfile = new ethers.Contract(
      userProfileAddress,
      [
        "function getUserData(address user) view returns (string, uint256, uint256, uint256, uint256, uint256, uint256, bool)",
        "function isUsernameAvailable(string memory username) view returns (bool)",
        "function getTotalStats() view returns (uint256, uint256)"
      ],
      deployer
    );

    // Test getUserData
    try {
      const userData = await userProfile.getUserData(deployer.address);
      console.log("✅ getUserData works:", userData);
    } catch (err) {
      console.log("❌ getUserData failed:", err.message);
    }

    // Test isUsernameAvailable
    try {
      const isAvailable = await userProfile.isUsernameAvailable("testuser");
      console.log("✅ isUsernameAvailable works:", isAvailable);
    } catch (err) {
      console.log("❌ isUsernameAvailable failed:", err.message);
    }

    // Test getTotalStats
    try {
      const stats = await userProfile.getTotalStats();
      console.log("✅ getTotalStats works:", stats);
    } catch (err) {
      console.log("❌ getTotalStats failed:", err.message);
    }

  } catch (err) {
    console.log("❌ UserProfile contract interaction failed:", err.message);
  }

  // Test RealFiToken contract
  console.log("\n🪙 Testing RealFiToken contract...");
  const tokenAddress = "0x8c73284b55cb55EB46Dd42617bA6213037e602e9";
  
  try {
    const token = new ethers.Contract(
      tokenAddress,
      [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function mint(address to, uint256 amount)"
      ],
      deployer
    );

    const name = await token.name();
    const symbol = await token.symbol();
    const balance = await token.balanceOf(deployer.address);
    
    console.log("✅ Token name:", name);
    console.log("✅ Token symbol:", symbol);
    console.log("✅ Token balance:", ethers.formatEther(balance), symbol);

  } catch (err) {
    console.log("❌ RealFiToken contract interaction failed:", err.message);
  }

  // Test YieldVault contract
  console.log("\n🏦 Testing YieldVault contract...");
  const vaultAddress = "0x2ABa80F8931d52DEE8e6732d213eabe795535660";
  
  try {
    const vault = new ethers.Contract(
      vaultAddress,
      [
        "function getUserPosition(address user) view returns (uint256, uint256, uint256, uint256, bool)",
        "function getVaultStats() view returns (uint256, uint256, uint256)"
      ],
      deployer
    );

    const position = await vault.getUserPosition(deployer.address);
    console.log("✅ User position:", position);

    const stats = await vault.getVaultStats();
    console.log("✅ Vault stats:", stats);

  } catch (err) {
    console.log("❌ YieldVault contract interaction failed:", err.message);
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎯 FRONTEND INTEGRATION TEST COMPLETE");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
