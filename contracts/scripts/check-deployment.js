const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Actual Deployment Status...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Contract addresses from deployment
  const contracts = {
    RealFiToken: "0x8c73284b55cb55EB46Dd42617bA6213037e602e9",
    UserProfile: "0x41d87298B54d329872c29ec385367cD4C404e8e6",
    YieldVault: "0x2ABa80F8931d52DEE8e6732d213eabe795535660",
    Leaderboard: "0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f",
    CrossChainBridge: "0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d"
  };

  console.log("Checking if contracts actually exist on-chain...\n");

  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`📋 Checking ${name} at ${address}...`);
      
      // Check if contract has code
      const code = await deployer.provider.getCode(address);
      if (code === "0x") {
        console.log(`❌ ${name}: NO CODE - Contract not deployed`);
      } else {
        console.log(`✅ ${name}: HAS CODE - Contract deployed (${code.length} bytes)`);
        
        // Try to call a function
        try {
          if (name === "RealFiToken") {
            const contract = await ethers.getContractAt("RealFiToken", address);
            const name_result = await contract.name();
            console.log(`   📝 Token name: ${name_result}`);
          } else if (name === "UserProfile") {
            const contract = await ethers.getContractAt("UserProfile", address);
            const [totalUsers] = await contract.getTotalStats();
            console.log(`   👤 Total users: ${totalUsers}`);
          }
        } catch (callError) {
          console.log(`   ⚠️  Function call failed: ${callError.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${name}: Error checking - ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎯 DEPLOYMENT VERIFICATION COMPLETE");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
