const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Somnia Testnet connection...\n");

  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    
    // Check network
    const network = await deployer.provider.getNetwork();
    console.log("Network:", network);
    
    console.log("\n✅ Network connection successful!");
  } catch (error) {
    console.error("❌ Network connection failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
