const { ethers } = require('hardhat');

async function main() {
  console.log('🧪 Testing Frontend Stats Functions...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const yieldVaultAddress = '0x2ABa80F8931d52DEE8e6732d213eabe795535660';
  const leaderboardAddress = '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f';

  const YieldVault = await ethers.getContractFactory('YieldVault');
  const yieldVault = YieldVault.attach(yieldVaultAddress);

  const Leaderboard = await ethers.getContractFactory('Leaderboard');
  const leaderboard = Leaderboard.attach(leaderboardAddress);

  try {
    // Test getVaultStats (what getTotalStats uses for battle count)
    console.log('📊 Testing YieldVault getVaultStats...');
    const [totalVaultValue, totalYieldDistributed, nextBattleId] = await yieldVault.getVaultStats();
    console.log('Total Vault Value:', ethers.formatEther(totalVaultValue), 'RFT');
    console.log('Total Yield Distributed:', ethers.formatEther(totalYieldDistributed), 'RFT');
    console.log('Next Battle ID:', Number(nextBattleId));
    console.log('Total Battles (nextBattleId - 1):', Number(nextBattleId) - 1);

    // Test getLeaderboardStats
    console.log('\n📊 Testing Leaderboard getLeaderboardStats...');
    const [totalUsers, lastUpdateTime, topUserAddress, topUserScore] = await leaderboard.getLeaderboardStats();
    console.log('Total Users:', Number(totalUsers));
    console.log('Last Update Time:', new Date(Number(lastUpdateTime) * 1000).toLocaleString());
    console.log('Top User Address:', topUserAddress);
    console.log('Top User Score:', Number(topUserScore));

    // Simulate what getTotalStats should return
    console.log('\n🎯 Simulating getTotalStats result:');
    const totalBattles = Number(nextBattleId) - 1;
    console.log('Total Users:', Number(totalUsers));
    console.log('Total Battles:', totalBattles);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
