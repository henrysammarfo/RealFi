const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying Private Key and Address...\n");

  // Your private key
  const privateKey = "d9e25f44ae486674c6587c7fe2f72ddcf828b03911924b17a1baa09f98b72fc6";
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(privateKey);
  console.log("Address from private key:", wallet.address);
  
  // Get signer from Hardhat
  const [deployer] = await ethers.getSigners();
  console.log("Address from Hardhat signer:", deployer.address);
  
  // Check if they match
  console.log("Addresses match:", wallet.address === deployer.address);
  
  // Check balance on Somnia Testnet
  const provider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance on Somnia Testnet:", ethers.formatEther(balance), "ETH");
  
  // Check if this is the correct network
  const network = await provider.getNetwork();
  console.log("Network chainId:", network.chainId.toString());
  console.log("Expected chainId: 50312");
  console.log("Correct network:", network.chainId.toString() === "50312");
  
  console.log("\n" + "=".repeat(80));
  console.log("🎯 PRIVATE KEY VERIFICATION COMPLETE");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
