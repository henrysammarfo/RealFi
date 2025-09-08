// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title AIStrategy
 * @dev Manages AI-generated strategies and scoring for RealFi DeFi platform
 * @notice This contract simulates AI strategy generation and scoring based on user behavior and market conditions
 */
contract AIStrategy is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    
    struct Strategy {
        uint256 strategyId;
        string name;
        string description;
        uint256 riskLevel; // 1-10 scale
        uint256 expectedYield; // APY in basis points
        uint256 minDeposit;
        uint256 maxDeposit;
        uint256 duration; // in days
        bool isActive;
        uint256 totalUsers;
        uint256 totalVolume;
        uint256 successRate; // percentage
    }
    
    struct UserStrategy {
        uint256 strategyId;
        uint256 depositAmount;
        uint256 startTime;
        uint256 endTime;
        uint256 expectedReturn;
        uint256 actualReturn;
        bool isActive;
        uint256 performanceScore;
    }
    
    struct MarketCondition {
        uint256 volatility;
        uint256 liquidity;
        uint256 yieldTrend;
        uint256 riskLevel;
        uint256 timestamp;
    }
    
    // Events
    event StrategyCreated(
        uint256 indexed strategyId,
        string name,
        uint256 riskLevel,
        uint256 expectedYield,
        uint256 timestamp
    );
    
    event StrategyAdopted(
        address indexed user,
        uint256 indexed strategyId,
        uint256 depositAmount,
        uint256 expectedReturn,
        uint256 timestamp
    );
    
    event StrategyCompleted(
        address indexed user,
        uint256 indexed strategyId,
        uint256 actualReturn,
        uint256 performanceScore,
        uint256 timestamp
    );
    
    event MarketConditionUpdated(
        uint256 volatility,
        uint256 liquidity,
        uint256 yieldTrend,
        uint256 riskLevel,
        uint256 timestamp
    );
    
    event AIRecommendationGenerated(
        address indexed user,
        uint256[] recommendedStrategies,
        uint256 confidence,
        uint256 timestamp
    );
    
    // State variables
    mapping(uint256 => Strategy) public strategies;
    mapping(address => UserStrategy[]) public userStrategies;
    mapping(address => uint256) public userStrategyCount;
    mapping(address => uint256) public userTotalPerformance;
    
    MarketCondition public currentMarketCondition;
    uint256 public nextStrategyId;
    uint256 public totalStrategies;
    uint256 public totalUsersWithStrategies;
    
    // AI parameters
    uint256 public constant MAX_RISK_LEVEL = 10;
    uint256 public constant MIN_RISK_LEVEL = 1;
    uint256 public constant MAX_YIELD = 5000; // 50% APY max
    uint256 public constant MIN_YIELD = 100; // 1% APY min
    uint256 public constant PERFORMANCE_BONUS = 1000; // 10% bonus for good performance
    
    // Market condition weights
    uint256 public constant VOLATILITY_WEIGHT = 30;
    uint256 public constant LIQUIDITY_WEIGHT = 25;
    uint256 public constant YIELD_TREND_WEIGHT = 25;
    uint256 public constant RISK_WEIGHT = 20;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract
     * @param _owner The address of the contract owner
     */
    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        nextStrategyId = 1;
        _initializeDefaultStrategies();
        _updateMarketCondition();
    }
    
    /**
     * @dev Initialize default AI strategies
     */
    function _initializeDefaultStrategies() internal {
        // Conservative Strategy
        _createStrategy(
            "Conservative Yield",
            "Low-risk strategy focusing on stable yields with minimal volatility",
            2, // risk level
            800, // 8% APY
            0.1 ether, // min deposit
            10 ether, // max deposit
            30 // 30 days
        );
        
        // Balanced Strategy
        _createStrategy(
            "Balanced Growth",
            "Moderate risk strategy balancing yield and growth potential",
            5, // risk level
            1500, // 15% APY
            0.05 ether, // min deposit
            50 ether, // max deposit
            60 // 60 days
        );
        
        // Aggressive Strategy
        _createStrategy(
            "High Yield Aggressive",
            "High-risk strategy targeting maximum yield with higher volatility",
            8, // risk level
            3000, // 30% APY
            0.2 ether, // min deposit
            100 ether, // max deposit
            90 // 90 days
        );
        
        // DeFi Farming Strategy
        _createStrategy(
            "DeFi Farming",
            "Strategy focused on DeFi protocol farming and liquidity provision",
            6, // risk level
            2000, // 20% APY
            0.1 ether, // min deposit
            200 ether, // max deposit
            45 // 45 days
        );
    }
    
    /**
     * @dev Create a new AI strategy
     * @param _name Strategy name
     * @param _description Strategy description
     * @param _riskLevel Risk level (1-10)
     * @param _expectedYield Expected APY in basis points
     * @param _minDeposit Minimum deposit amount
     * @param _maxDeposit Maximum deposit amount
     * @param _duration Strategy duration in days
     */
    function createStrategy(
        string memory _name,
        string memory _description,
        uint256 _riskLevel,
        uint256 _expectedYield,
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _duration
    ) external onlyOwner {
        _createStrategy(_name, _description, _riskLevel, _expectedYield, _minDeposit, _maxDeposit, _duration);
    }
    
    /**
     * @dev Internal function to create a strategy
     */
    function _createStrategy(
        string memory _name,
        string memory _description,
        uint256 _riskLevel,
        uint256 _expectedYield,
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _duration
    ) internal {
        require(_riskLevel >= MIN_RISK_LEVEL && _riskLevel <= MAX_RISK_LEVEL, "Invalid risk level");
        require(_expectedYield >= MIN_YIELD && _expectedYield <= MAX_YIELD, "Invalid expected yield");
        require(_minDeposit > 0 && _maxDeposit > _minDeposit, "Invalid deposit limits");
        require(_duration > 0 && _duration <= 365, "Invalid duration");
        
        uint256 strategyId = nextStrategyId++;
        Strategy storage strategy = strategies[strategyId];
        
        strategy.strategyId = strategyId;
        strategy.name = _name;
        strategy.description = _description;
        strategy.riskLevel = _riskLevel;
        strategy.expectedYield = _expectedYield;
        strategy.minDeposit = _minDeposit;
        strategy.maxDeposit = _maxDeposit;
        strategy.duration = _duration;
        strategy.isActive = true;
        strategy.totalUsers = 0;
        strategy.totalVolume = 0;
        strategy.successRate = 100; // Start with 100% success rate
        
        totalStrategies++;
        
        emit StrategyCreated(strategyId, _name, _riskLevel, _expectedYield, block.timestamp);
    }
    
    /**
     * @dev Adopt an AI strategy
     * @param _strategyId The strategy ID to adopt
     * @param _depositAmount The amount to deposit
     */
    function adoptStrategy(uint256 _strategyId, uint256 _depositAmount) external nonReentrant {
        require(strategies[_strategyId].isActive, "Strategy not active");
        require(_depositAmount >= strategies[_strategyId].minDeposit, "Deposit below minimum");
        require(_depositAmount <= strategies[_strategyId].maxDeposit, "Deposit above maximum");
        
        Strategy storage strategy = strategies[_strategyId];
        
        // Calculate expected return
        uint256 expectedReturn = (_depositAmount * strategy.expectedYield * strategy.duration) / (365 days * 10000);
        
        // Create user strategy
        UserStrategy memory userStrategy = UserStrategy({
            strategyId: _strategyId,
            depositAmount: _depositAmount,
            startTime: block.timestamp,
            endTime: block.timestamp + (strategy.duration * 1 days),
            expectedReturn: expectedReturn,
            actualReturn: 0,
            isActive: true,
            performanceScore: 0
        });
        
        userStrategies[msg.sender].push(userStrategy);
        userStrategyCount[msg.sender]++;
        
        // Update strategy statistics
        strategy.totalUsers++;
        strategy.totalVolume += _depositAmount;
        
        // Update total users with strategies
        if (userStrategyCount[msg.sender] == 1) {
            totalUsersWithStrategies++;
        }
        
        emit StrategyAdopted(msg.sender, _strategyId, _depositAmount, expectedReturn, block.timestamp);
    }
    
    /**
     * @dev Complete a strategy and calculate performance
     * @param _strategyIndex The index of the user's strategy
     */
    function completeStrategy(uint256 _strategyIndex) external nonReentrant {
        require(_strategyIndex < userStrategies[msg.sender].length, "Invalid strategy index");
        
        UserStrategy storage userStrategy = userStrategies[msg.sender][_strategyIndex];
        require(userStrategy.isActive, "Strategy not active");
        require(block.timestamp >= userStrategy.endTime, "Strategy not completed yet");
        
        // Calculate actual return based on market conditions and strategy performance
        uint256 actualReturn = _calculateActualReturn(userStrategy);
        userStrategy.actualReturn = actualReturn;
        userStrategy.isActive = false;
        
        // Calculate performance score
        uint256 performanceScore = _calculatePerformanceScore(userStrategy);
        userStrategy.performanceScore = performanceScore;
        
        // Update user total performance
        userTotalPerformance[msg.sender] += performanceScore;
        
        // Update strategy success rate
        _updateStrategySuccessRate(userStrategy.strategyId, performanceScore);
        
        emit StrategyCompleted(msg.sender, userStrategy.strategyId, actualReturn, performanceScore, block.timestamp);
    }
    
    /**
     * @dev Calculate actual return based on market conditions
     * @param _userStrategy The user strategy
     * @return The actual return amount
     */
    function _calculateActualReturn(UserStrategy memory _userStrategy) internal view returns (uint256) {
        Strategy storage strategy = strategies[_userStrategy.strategyId];
        
        // Base return calculation
        uint256 baseReturn = _userStrategy.expectedReturn;
        
        // Apply market condition modifiers
        uint256 volatilityModifier = (currentMarketCondition.volatility * 10) / 100; // 0-10% modifier
        uint256 liquidityModifier = (currentMarketCondition.liquidity * 5) / 100; // 0-5% modifier
        uint256 yieldTrendModifier = (currentMarketCondition.yieldTrend * 15) / 100; // 0-15% modifier
        
        // Calculate total modifier
        int256 totalModifier = int256(volatilityModifier) + int256(liquidityModifier) + int256(yieldTrendModifier);
        
        // Apply risk-based adjustment
        if (strategy.riskLevel > 5) {
            totalModifier += int256(strategy.riskLevel * 2); // Higher risk = higher potential return
        } else {
            totalModifier -= int256((6 - strategy.riskLevel) * 2); // Lower risk = lower potential return
        }
        
        // Calculate final return
        int256 finalReturn = int256(baseReturn) + (int256(baseReturn) * totalModifier) / 100;
        
        // Ensure return is not negative
        if (finalReturn < 0) {
            finalReturn = 0;
        }
        
        return uint256(finalReturn);
    }
    
    /**
     * @dev Calculate performance score
     * @param _userStrategy The user strategy
     * @return The performance score
     */
    function _calculatePerformanceScore(UserStrategy memory _userStrategy) internal view returns (uint256) {
        if (_userStrategy.expectedReturn == 0) {
            return 0;
        }
        
        // Calculate performance ratio
        uint256 performanceRatio = (_userStrategy.actualReturn * 100) / _userStrategy.expectedReturn;
        
        // Base score is 100
        uint256 baseScore = 100;
        
        // Apply performance bonus/penalty
        if (performanceRatio >= 100) {
            // Above expected performance
            uint256 bonus = (performanceRatio - 100) * 2; // 2 points per 1% above expected
            return baseScore + bonus;
        } else {
            // Below expected performance
            uint256 penalty = (100 - performanceRatio) * 1; // 1 point per 1% below expected
            if (penalty > baseScore) {
                penalty = baseScore;
            }
            return baseScore - penalty;
        }
    }
    
    /**
     * @dev Update strategy success rate
     * @param _strategyId The strategy ID
     * @param _performanceScore The performance score
     */
    function _updateStrategySuccessRate(uint256 _strategyId, uint256 _performanceScore) internal {
        Strategy storage strategy = strategies[_strategyId];
        
        // Simple moving average of success rate
        uint256 currentSuccessRate = strategy.successRate;
        uint256 newSuccessRate = (currentSuccessRate + (_performanceScore >= 100 ? 100 : 0)) / 2;
        
        strategy.successRate = newSuccessRate;
    }
    
    /**
     * @dev Update market conditions (simulated AI analysis)
     */
    function updateMarketCondition() external onlyOwner {
        _updateMarketCondition();
    }
    
    /**
     * @dev Internal function to update market conditions
     */
    function _updateMarketCondition() internal {
        // Simulate AI analysis of market conditions
        // In a real implementation, this would be based on actual market data
        
        currentMarketCondition = MarketCondition({
            volatility: _generateRandomValue(1, 10), // 1-10 scale
            liquidity: _generateRandomValue(1, 10), // 1-10 scale
            yieldTrend: _generateRandomValue(1, 10), // 1-10 scale
            riskLevel: _generateRandomValue(1, 10), // 1-10 scale
            timestamp: block.timestamp
        });
        
        emit MarketConditionUpdated(
            currentMarketCondition.volatility,
            currentMarketCondition.liquidity,
            currentMarketCondition.yieldTrend,
            currentMarketCondition.riskLevel,
            block.timestamp
        );
    }
    
    /**
     * @dev Generate AI recommendations for a user
     * @param _user The user address
     * @return recommendedStrategies Array of recommended strategy IDs
     * @return confidence Confidence level (0-100)
     */
    function generateAIRecommendations(address _user) external view returns (
        uint256[] memory recommendedStrategies,
        uint256 confidence
    ) {
        // Analyze user's historical performance
        uint256 userPerformance = userTotalPerformance[_user];
        uint256 userStrategyCountValue = userStrategyCount[_user];
        
        // Calculate confidence based on user history
        if (userStrategyCountValue == 0) {
            confidence = 60; // Lower confidence for new users
        } else {
            confidence = 70 + (userPerformance / userStrategyCountValue) / 10; // Higher confidence for experienced users
            if (confidence > 95) confidence = 95;
        }
        
        // Generate recommendations based on market conditions and user profile
        uint256[] memory recommendations = new uint256[](3);
        uint256 recommendationCount = 0;
        
        // Recommend strategies based on current market conditions
        for (uint256 i = 1; i <= totalStrategies; i++) {
            if (!strategies[i].isActive) continue;
            
            Strategy storage strategy = strategies[i];
            
            // Match strategy risk level with market conditions
            bool isRecommended = false;
            
            if (currentMarketCondition.volatility <= 3 && strategy.riskLevel <= 3) {
                isRecommended = true; // Low volatility -> conservative strategies
            } else if (currentMarketCondition.volatility >= 7 && strategy.riskLevel >= 7) {
                isRecommended = true; // High volatility -> aggressive strategies
            } else if (currentMarketCondition.volatility >= 4 && currentMarketCondition.volatility <= 6 && 
                      strategy.riskLevel >= 4 && strategy.riskLevel <= 6) {
                isRecommended = true; // Medium volatility -> balanced strategies
            }
            
            if (isRecommended && recommendationCount < 3) {
                recommendations[recommendationCount] = i;
                recommendationCount++;
            }
        }
        
        // Resize array to actual recommendation count
        uint256[] memory finalRecommendations = new uint256[](recommendationCount);
        for (uint256 i = 0; i < recommendationCount; i++) {
            finalRecommendations[i] = recommendations[i];
        }
        
        return (finalRecommendations, confidence);
    }
    
    /**
     * @dev Generate a random value (simplified for demonstration)
     * @param _min Minimum value
     * @param _max Maximum value
     * @return Random value between min and max
     */
    function _generateRandomValue(uint256 _min, uint256 _max) internal view returns (uint256) {
        return _min + (uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % (_max - _min + 1));
    }
    
    /**
     * @dev Get user's active strategies
     * @param _user The user address
     * @return strategyIds Array of active strategy IDs
     * @return depositAmounts Array of deposit amounts
     * @return endTimes Array of end times
     */
    function getUserActiveStrategies(address _user) external view returns (
        uint256[] memory strategyIds,
        uint256[] memory depositAmounts,
        uint256[] memory endTimes
    ) {
        uint256 activeCount = 0;
        
        // Count active strategies
        for (uint256 i = 0; i < userStrategies[_user].length; i++) {
            if (userStrategies[_user][i].isActive) {
                activeCount++;
            }
        }
        
        // Create arrays
        strategyIds = new uint256[](activeCount);
        depositAmounts = new uint256[](activeCount);
        endTimes = new uint256[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < userStrategies[_user].length; i++) {
            if (userStrategies[_user][i].isActive) {
                strategyIds[index] = userStrategies[_user][i].strategyId;
                depositAmounts[index] = userStrategies[_user][i].depositAmount;
                endTimes[index] = userStrategies[_user][i].endTime;
                index++;
            }
        }
    }
    
    /**
     * @dev Get strategy details
     * @param _strategyId The strategy ID
     * @return name Strategy name
     * @return description Strategy description
     * @return riskLevel Risk level
     * @return expectedYield Expected APY
     * @return minDeposit Minimum deposit
     * @return maxDeposit Maximum deposit
     * @return duration Duration in days
     * @return isActive Whether strategy is active
     * @return totalUsers Total users
     * @return totalVolume Total volume
     * @return successRate Success rate percentage
     */
    function getStrategyDetails(uint256 _strategyId) external view returns (
        string memory name,
        string memory description,
        uint256 riskLevel,
        uint256 expectedYield,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 duration,
        bool isActive,
        uint256 totalUsers,
        uint256 totalVolume,
        uint256 successRate
    ) {
        Strategy storage strategy = strategies[_strategyId];
        require(strategy.strategyId != 0, "Strategy not found");
        
        return (
            strategy.name,
            strategy.description,
            strategy.riskLevel,
            strategy.expectedYield,
            strategy.minDeposit,
            strategy.maxDeposit,
            strategy.duration,
            strategy.isActive,
            strategy.totalUsers,
            strategy.totalVolume,
            strategy.successRate
        );
    }
    
    /**
     * @dev Get current market conditions
     * @return volatility Volatility level
     * @return liquidity Liquidity level
     * @return yieldTrend Yield trend
     * @return riskLevel Risk level
     * @return timestamp Last update timestamp
     */
    function getCurrentMarketCondition() external view returns (
        uint256 volatility,
        uint256 liquidity,
        uint256 yieldTrend,
        uint256 riskLevel,
        uint256 timestamp
    ) {
        return (
            currentMarketCondition.volatility,
            currentMarketCondition.liquidity,
            currentMarketCondition.yieldTrend,
            currentMarketCondition.riskLevel,
            currentMarketCondition.timestamp
        );
    }
    
    /**
     * @dev Get AI strategy statistics
     * @return _totalStrategies Total number of strategies
     * @return _totalUsersWithStrategies Total users with strategies
     * @return _nextStrategyId Next strategy ID
     */
    function getAIStrategyStats() external view returns (
        uint256 _totalStrategies,
        uint256 _totalUsersWithStrategies,
        uint256 _nextStrategyId
    ) {
        return (totalStrategies, totalUsersWithStrategies, nextStrategyId);
    }
    
    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
