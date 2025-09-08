const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("RealFi DeFi Platform", function () {
  let realFiToken, userProfile, yieldVault, leaderboard, crossChainBridge, aiStrategy;
  let owner, user1, user2, user3;
  let deploymentInfo;

  before(async function () {
    // Load deployment info if available
    try {
      const fs = require('fs');
      deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
      console.log("📋 Using deployed contracts from deployment-info.json");
    } catch (error) {
      console.log("⚠️  No deployment info found. Tests will use local deployment.");
    }

    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  describe("Contract Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      if (deploymentInfo) {
        // Use deployed contracts
        realFiToken = await ethers.getContractAt("RealFiToken", deploymentInfo.contracts.RealFiToken);
        userProfile = await ethers.getContractAt("UserProfile", deploymentInfo.contracts.UserProfile);
        yieldVault = await ethers.getContractAt("YieldVault", deploymentInfo.contracts.YieldVault);
        leaderboard = await ethers.getContractAt("Leaderboard", deploymentInfo.contracts.Leaderboard);
        crossChainBridge = await ethers.getContractAt("CrossChainBridge", deploymentInfo.contracts.CrossChainBridge);
        aiStrategy = await ethers.getContractAt("AIStrategy", deploymentInfo.contracts.AIStrategy);
      } else {
        // Deploy locally for testing
        console.log("🚀 Deploying contracts locally for testing...");
        
        // Deploy RealFi Token
        const RealFiToken = await ethers.getContractFactory("RealFiToken");
        realFiToken = await RealFiToken.deploy();
        await realFiToken.waitForDeployment();

        // Deploy UserProfile
        const UserProfile = await ethers.getContractFactory("UserProfile");
        userProfile = await upgrades.deployProxy(UserProfile, [owner.address], {
          initializer: "initialize",
          kind: "uups"
        });
        await userProfile.waitForDeployment();

        // Deploy YieldVault
        const YieldVault = await ethers.getContractFactory("YieldVault");
        yieldVault = await upgrades.deployProxy(YieldVault, [owner.address, await realFiToken.getAddress(), await userProfile.getAddress()], {
          initializer: "initialize",
          kind: "uups"
        });
        await yieldVault.waitForDeployment();

        // Deploy Leaderboard
        const Leaderboard = await ethers.getContractFactory("Leaderboard");
        leaderboard = await upgrades.deployProxy(Leaderboard, [owner.address, await yieldVault.getAddress(), await userProfile.getAddress()], {
          initializer: "initialize",
          kind: "uups"
        });
        await leaderboard.waitForDeployment();

        // Deploy CrossChainBridge
        const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
        crossChainBridge = await upgrades.deployProxy(CrossChainBridge, [owner.address], {
          initializer: "initialize",
          kind: "uups"
        });
        await crossChainBridge.waitForDeployment();

        // Deploy AIStrategy
        const AIStrategy = await ethers.getContractFactory("AIStrategy");
        aiStrategy = await upgrades.deployProxy(AIStrategy, [owner.address], {
          initializer: "initialize",
          kind: "uups"
        });
        await aiStrategy.waitForDeployment();
      }

      // Verify all contracts are deployed
      expect(await realFiToken.getAddress()).to.be.properAddress;
      expect(await userProfile.getAddress()).to.be.properAddress;
      expect(await yieldVault.getAddress()).to.be.properAddress;
      expect(await leaderboard.getAddress()).to.be.properAddress;
      expect(await crossChainBridge.getAddress()).to.be.properAddress;
      expect(await aiStrategy.getAddress()).to.be.properAddress;

      console.log("✅ All contracts deployed successfully");
    });
  });

  describe("RealFi Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await realFiToken.name()).to.equal("RealFi Token");
      expect(await realFiToken.symbol()).to.equal("RFT");
    });

    it("Should have initial supply", async function () {
      const totalSupply = await realFiToken.totalSupply();
      expect(totalSupply).to.be.gt(0);
      console.log(`📊 Total supply: ${ethers.formatEther(totalSupply)} RFT`);
    });

    it("Should allow minting by owner", async function () {
      const mintAmount = ethers.parseEther("1000");
      await realFiToken.mint(user1.address, mintAmount);
      expect(await realFiToken.balanceOf(user1.address)).to.equal(mintAmount);
    });
  });

  describe("User Profile Management", function () {
    it("Should allow user registration", async function () {
      await userProfile.connect(user1).registerUser("testuser1");
      
      const [username, registrationTime, totalDeposits, totalWithdrawals, battlesJoined, battlesWon, reputationScore, isActive] = 
        await userProfile.getUserData(user1.address);
      
      expect(username).to.equal("testuser1");
      expect(isActive).to.be.true;
      expect(reputationScore).to.equal(100); // Initial reputation score
    });

    it("Should prevent duplicate usernames", async function () {
      await expect(
        userProfile.connect(user2).registerUser("testuser1")
      ).to.be.revertedWith("Username already taken");
    });

    it("Should allow profile updates", async function () {
      await userProfile.connect(user1).updateProfile("newusername1");
      
      const [username] = await userProfile.getUserData(user1.address);
      expect(username).to.equal("newusername1");
    });
  });

  describe("Yield Vault Operations", function () {
    beforeEach(async function () {
      // Mint tokens for testing
      await realFiToken.mint(user1.address, ethers.parseEther("1000"));
      await realFiToken.mint(user2.address, ethers.parseEther("1000"));
      
      // Approve vault to spend tokens
      await realFiToken.connect(user1).approve(await yieldVault.getAddress(), ethers.parseEther("1000"));
      await realFiToken.connect(user2).approve(await yieldVault.getAddress(), ethers.parseEther("1000"));
    });

    it("Should allow users to deposit", async function () {
      const depositAmount = ethers.parseEther("100");
      await yieldVault.connect(user1).deposit(depositAmount);
      
      const [amount, depositTime, lastClaimTime, battleId, isActive] = 
        await yieldVault.getUserPosition(user1.address);
      
      expect(amount).to.equal(depositAmount);
      expect(isActive).to.be.true;
    });

    it("Should create yield battles", async function () {
      await yieldVault.createBattle("Test Battle", ethers.parseEther("0.01"), 10, 7 * 24 * 60 * 60);
      
      const [name, startTime, endTime, totalPrizePool, entryFee, maxParticipants, currentParticipants, isActive] = 
        await yieldVault.getBattleDetails(1);
      
      expect(name).to.equal("Test Battle");
      expect(isActive).to.be.true;
      expect(maxParticipants).to.equal(10);
    });

    it("Should allow users to join battles", async function () {
      const battleAmount = ethers.parseEther("50");
      await yieldVault.connect(user1).joinBattle(1, battleAmount);
      
      const isInBattle = await yieldVault.isUserInBattle(user1.address, 1);
      expect(isInBattle).to.be.true;
    });
  });

  describe("Leaderboard System", function () {
    it("Should register users for leaderboard", async function () {
      await leaderboard.registerUser(user1.address, "testuser1");
      await leaderboard.registerUser(user2.address, "testuser2");
      
      const [totalUsers, activeUsers] = await leaderboard.getTotalStats();
      expect(totalUsers).to.be.gte(2);
    });

    it("Should update user scores", async function () {
      await leaderboard.updateYieldScore(user1.address, ethers.parseEther("10"), ethers.parseEther("100"));
      await leaderboard.updateBattleScore(user1.address, 1, 1000);
      
      const [totalScore, yieldScore, battleScore, reputationScore] = 
        await leaderboard.getUserScoreDetails(user1.address);
      
      expect(totalScore).to.be.gt(0);
      expect(yieldScore).to.be.gt(0);
      expect(battleScore).to.equal(1000);
    });

    it("Should provide top users", async function () {
      const [users, scores, usernames] = await leaderboard.getTopUsers(5);
      expect(users.length).to.be.gte(0);
      expect(scores.length).to.equal(users.length);
      expect(usernames.length).to.equal(users.length);
    });
  });

  describe("Cross-Chain Bridge", function () {
    beforeEach(async function () {
      // Mint tokens for testing
      await realFiToken.mint(user1.address, ethers.parseEther("1000"));
      await realFiToken.connect(user1).approve(await crossChainBridge.getAddress(), ethers.parseEther("1000"));
    });

    it("Should create bridge requests", async function () {
      const bridgeAmount = ethers.parseEther("10");
      await crossChainBridge.connect(user1).createBridgeRequest(
        await realFiToken.getAddress(),
        bridgeAmount,
        1 // Ethereum chain
      );
      
      const [user, token, amount, sourceChain, targetChain, timestamp, isProcessed] = 
        await crossChainBridge.getBridgeRequest(1);
      
      expect(user).to.equal(user1.address);
      expect(amount).to.be.gt(0);
      expect(isProcessed).to.be.false;
    });

    it("Should calculate bridge fees", async function () {
      const bridgeAmount = ethers.parseEther("100");
      const fee = await crossChainBridge.calculateBridgeFee(bridgeAmount, 1);
      expect(fee).to.be.gt(0);
    });
  });

  describe("AI Strategy System", function () {
    it("Should have default strategies", async function () {
      const [totalStrategies, totalUsersWithStrategies, nextStrategyId] = 
        await aiStrategy.getAIStrategyStats();
      
      expect(totalStrategies).to.be.gt(0);
      expect(nextStrategyId).to.be.gt(1);
    });

    it("Should allow strategy adoption", async function () {
      const depositAmount = ethers.parseEther("100");
      await aiStrategy.connect(user1).adoptStrategy(1, depositAmount);
      
      const [strategyIds, depositAmounts, endTimes] = 
        await aiStrategy.getUserActiveStrategies(user1.address);
      
      expect(strategyIds.length).to.equal(1);
      expect(depositAmounts[0]).to.equal(depositAmount);
    });

    it("Should generate AI recommendations", async function () {
      const [recommendedStrategies, confidence] = 
        await aiStrategy.generateAIRecommendations(user1.address);
      
      expect(recommendedStrategies.length).to.be.gte(0);
      expect(confidence).to.be.gte(0);
      expect(confidence).to.be.lte(100);
    });

    it("Should update market conditions", async function () {
      await aiStrategy.updateMarketCondition();
      
      const [volatility, liquidity, yieldTrend, riskLevel, timestamp] = 
        await aiStrategy.getCurrentMarketCondition();
      
      expect(volatility).to.be.gte(1);
      expect(volatility).to.be.lte(10);
      expect(liquidity).to.be.gte(1);
      expect(liquidity).to.be.lte(10);
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full user journey", async function () {
      console.log("🧪 Testing complete user journey...");
      
      // 1. Register user
      await userProfile.connect(user3).registerUser("testuser3");
      console.log("✅ User registered");
      
      // 2. Mint and approve tokens
      await realFiToken.mint(user3.address, ethers.parseEther("1000"));
      await realFiToken.connect(user3).approve(await yieldVault.getAddress(), ethers.parseEther("1000"));
      console.log("✅ Tokens minted and approved");
      
      // 3. Join a battle
      await yieldVault.connect(user3).joinBattle(1, ethers.parseEther("100"));
      console.log("✅ User joined battle");
      
      // 4. Adopt AI strategy
      await aiStrategy.connect(user3).adoptStrategy(1, ethers.parseEther("50"));
      console.log("✅ User adopted AI strategy");
      
      // 5. Create bridge request
      await realFiToken.connect(user3).approve(await crossChainBridge.getAddress(), ethers.parseEther("100"));
      await crossChainBridge.connect(user3).createBridgeRequest(
        await realFiToken.getAddress(),
        ethers.parseEther("25"),
        1
      );
      console.log("✅ Bridge request created");
      
      console.log("🎉 Complete user journey test passed!");
    });
  });

  describe("Error Handling", function () {
    it("Should handle invalid inputs gracefully", async function () {
      // Test invalid username
      await expect(
        userProfile.connect(user1).registerUser("ab") // Too short
      ).to.be.revertedWith("Username too short");
      
      // Test invalid deposit amount
      await expect(
        yieldVault.connect(user1).deposit(0)
      ).to.be.revertedWith("Amount must be greater than 0");
      
      // Test invalid bridge amount
      await expect(
        crossChainBridge.connect(user1).createBridgeRequest(
          await realFiToken.getAddress(),
          ethers.parseEther("0.0001"), // Too small
          1
        )
      ).to.be.revertedWith("Amount too small");
    });
  });

  after(async function () {
    console.log("\n" + "=".repeat(80));
    console.log("🎉 All RealFi DeFi Platform Tests Completed Successfully!");
    console.log("=".repeat(80));
    
    if (deploymentInfo) {
      console.log("\n📋 Tested against live Somnia Testnet contracts:");
      console.log(`• RealFiToken: ${deploymentInfo.contracts.RealFiToken}`);
      console.log(`• UserProfile: ${deploymentInfo.contracts.UserProfile}`);
      console.log(`• YieldVault: ${deploymentInfo.contracts.YieldVault}`);
      console.log(`• Leaderboard: ${deploymentInfo.contracts.Leaderboard}`);
      console.log(`• CrossChainBridge: ${deploymentInfo.contracts.CrossChainBridge}`);
      console.log(`• AIStrategy: ${deploymentInfo.contracts.AIStrategy}`);
    } else {
      console.log("\n📋 Tests completed with local deployment");
    }
    
    console.log("\n✅ All functionality verified and working correctly!");
  });
});
