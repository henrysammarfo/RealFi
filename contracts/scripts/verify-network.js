const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying Network Connection...\n");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    // Get network info
    const network = await deployer.provider.getNetwork();
    console.log("Network chainId:", network.chainId.toString());
    console.log("Expected chainId: 50312");
    console.log("Chain ID matches:", network.chainId.toString() === "50312");
    
    // Get block number
    const blockNumber = await deployer.provider.getBlockNumber();
    console.log("Current block number:", blockNumber);
    
    // Get balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    
    // Try to get block info
    const block = await deployer.provider.getBlock(blockNumber);
    console.log("Block timestamp:", new Date(Number(block.timestamp) * 1000).toLocaleString());
    
    // Check if we can send a transaction
    console.log("\n🧪 Testing transaction capability...");
    const gasPrice = await deployer.provider.getGasPrice();
    console.log("Gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
    
    // Try to estimate gas for a simple transfer
    const gasEstimate = await deployer.provider.estimateGas({
      to: deployer.address,
      value: ethers.parseEther("0.001"),
      from: deployer.address
    });
    console.log("Gas estimate for transfer:", gasEstimate.toString());
    
    console.log("\n✅ Network verification complete!");
    
  } catch (error) {
    console.error("❌ Network verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
