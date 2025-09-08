const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Transaction History...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Address:", deployer.address);
  
  // Get current block
  const currentBlock = await deployer.provider.getBlockNumber();
  console.log("Current block:", currentBlock);
  
  // Check last 100 blocks for transactions from this address
  console.log("Checking last 100 blocks for transactions...\n");
  
  let transactionCount = 0;
  const startBlock = Math.max(0, currentBlock - 100);
  
  for (let blockNum = startBlock; blockNum <= currentBlock; blockNum++) {
    try {
      const block = await deployer.provider.getBlock(blockNum, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.from === deployer.address) {
            transactionCount++;
            console.log(`📋 Block ${blockNum}:`);
            console.log(`   Hash: ${tx.hash}`);
            console.log(`   To: ${tx.to || 'Contract Creation'}`);
            console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
            console.log(`   Gas: ${tx.gasLimit.toString()}`);
            console.log(`   Gas Price: ${ethers.formatUnits(tx.gasPrice, 'gwei')} gwei`);
            console.log("");
          }
        }
      }
    } catch (error) {
      // Skip blocks that can't be fetched
    }
  }
  
  console.log(`Total transactions found: ${transactionCount}`);
  
  // Get transaction count (nonce)
  const txCount = await deployer.provider.getTransactionCount(deployer.address);
  console.log(`Transaction count (nonce): ${txCount}`);
  
  console.log("\n" + "=".repeat(80));
  console.log("🎯 TRANSACTION HISTORY COMPLETE");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
