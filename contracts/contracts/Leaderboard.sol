// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title Leaderboard
 * @dev Manages real-time leaderboards for RealFi DeFi platform
 * @notice This contract tracks user rankings, scores, and updates leaderboards in real-time
 */
contract Leaderboard is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    
    struct UserScore {
        address user;
        string username;
        uint256 totalScore;
        uint256 yieldScore;
        uint256 battleScore;
        uint256 reputationScore;
        uint256 lastUpdated;
        bool isActive;
    }
    
    struct BattleLeaderboard {
        uint256 battleId;
        mapping(address => uint256) userScores;
        mapping(address => bool) hasScore;
        address[] participants;
        bool isActive;
    }
    
    // Events
    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore, uint256 timestamp);
    event LeaderboardUpdated(uint256 timestamp);
    event BattleScoreUpdated(uint256 indexed battleId, address indexed user, uint256 score, uint256 timestamp);
    event UserRanked(address indexed user, uint256 rank, uint256 timestamp);
    
    // State variables
    mapping(address => UserScore) public userScores;
    mapping(uint256 => BattleLeaderboard) public battleLeaderboards;
    mapping(address => bool) public isRegistered;
    
    address[] public rankedUsers;
    address public yieldVaultContract;
    address public userProfileContract;
    
    uint256 public totalUsers;
    uint256 public lastUpdateTime;
    uint256 public constant UPDATE_INTERVAL = 1 hours;
    uint256 public constant MAX_LEADERBOARD_SIZE = 1000;
    
    // Score weights
    uint256 public constant YIELD_WEIGHT = 40; // 40% weight for yield performance
    uint256 public constant BATTLE_WEIGHT = 35; // 35% weight for battle performance
    uint256 public constant REPUTATION_WEIGHT = 25; // 25% weight for reputation
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract
     * @param _owner The address of the contract owner
     * @param _yieldVaultContract The address of the YieldVault contract
     * @param _userProfileContract The address of the UserProfile contract
     */
    function initialize(
        address _owner,
        address _yieldVaultContract,
        address _userProfileContract
    ) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        yieldVaultContract = _yieldVaultContract;
        userProfileContract = _userProfileContract;
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Register a user for leaderboard tracking
     * @param _user The user address
     * @param _username The user's username
     */
    function registerUser(address _user, string memory _username) external onlyOwner {
        require(!isRegistered[_user], "User already registered");
        require(bytes(_username).length > 0, "Invalid username");
        
        UserScore storage score = userScores[_user];
        score.user = _user;
        score.username = _username;
        score.totalScore = 0;
        score.yieldScore = 0;
        score.battleScore = 0;
        score.reputationScore = 0;
        score.lastUpdated = block.timestamp;
        score.isActive = true;
        
        isRegistered[_user] = true;
        rankedUsers.push(_user);
        totalUsers++;
        
        emit ScoreUpdated(_user, 0, 0, block.timestamp);
    }
    
    /**
     * @dev Update user yield score
     * @param _user The user address
     * @param _yieldAmount The yield amount earned
     * @param _depositAmount The deposit amount
     */
    function updateYieldScore(address _user, uint256 _yieldAmount, uint256 _depositAmount) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        
        UserScore storage score = userScores[_user];
        uint256 oldScore = score.totalScore;
        
        // Calculate yield score based on yield rate and deposit amount
        uint256 yieldRate = _depositAmount > 0 ? (_yieldAmount * 10000) / _depositAmount : 0;
        score.yieldScore = yieldRate;
        
        _updateTotalScore(_user);
        
        emit ScoreUpdated(_user, oldScore, score.totalScore, block.timestamp);
    }
    
    /**
     * @dev Update user battle score
     * @param _user The user address
     * @param _battleId The battle ID
     * @param _battleScore The battle score
     */
    function updateBattleScore(address _user, uint256 _battleId, uint256 _battleScore) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        
        UserScore storage score = userScores[_user];
        uint256 oldScore = score.totalScore;
        
        score.battleScore += _battleScore;
        
        // Update battle-specific leaderboard
        BattleLeaderboard storage battleLB = battleLeaderboards[_battleId];
        if (!battleLB.hasScore[_user]) {
            battleLB.participants.push(_user);
            battleLB.hasScore[_user] = true;
        }
        battleLB.userScores[_user] = _battleScore;
        battleLB.isActive = true;
        
        _updateTotalScore(_user);
        
        emit BattleScoreUpdated(_battleId, _user, _battleScore, block.timestamp);
        emit ScoreUpdated(_user, oldScore, score.totalScore, block.timestamp);
    }
    
    /**
     * @dev Update user reputation score
     * @param _user The user address
     * @param _reputationScore The reputation score
     */
    function updateReputationScore(address _user, uint256 _reputationScore) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        
        UserScore storage score = userScores[_user];
        uint256 oldScore = score.totalScore;
        
        score.reputationScore = _reputationScore;
        _updateTotalScore(_user);
        
        emit ScoreUpdated(_user, oldScore, score.totalScore, block.timestamp);
    }
    
    /**
     * @dev Update total score for a user
     * @param _user The user address
     */
    function _updateTotalScore(address _user) internal {
        UserScore storage score = userScores[_user];
        
        // Calculate weighted total score
        uint256 totalScore = (
            (score.yieldScore * YIELD_WEIGHT) +
            (score.battleScore * BATTLE_WEIGHT) +
            (score.reputationScore * REPUTATION_WEIGHT)
        ) / 100;
        
        score.totalScore = totalScore;
        score.lastUpdated = block.timestamp;
        
        // Update global leaderboard
        _updateGlobalLeaderboard();
    }
    
    /**
     * @dev Update the global leaderboard ranking
     */
    function _updateGlobalLeaderboard() internal {
        // Sort users by total score (simplified bubble sort for demonstration)
        // In production, you'd want a more efficient sorting algorithm
        for (uint256 i = 0; i < rankedUsers.length - 1; i++) {
            for (uint256 j = 0; j < rankedUsers.length - i - 1; j++) {
                if (userScores[rankedUsers[j]].totalScore < userScores[rankedUsers[j + 1]].totalScore) {
                    address temp = rankedUsers[j];
                    rankedUsers[j] = rankedUsers[j + 1];
                    rankedUsers[j + 1] = temp;
                }
            }
        }
        
        lastUpdateTime = block.timestamp;
        emit LeaderboardUpdated(block.timestamp);
    }
    
    /**
     * @dev Get user rank in global leaderboard
     * @param _user The user address
     * @return The user's rank (1-based)
     */
    function getUserRank(address _user) external view returns (uint256) {
        require(isRegistered[_user], "User not registered");
        
        for (uint256 i = 0; i < rankedUsers.length; i++) {
            if (rankedUsers[i] == _user) {
                return i + 1;
            }
        }
        return 0;
    }
    
    /**
     * @dev Get top N users from global leaderboard
     * @param _count The number of top users to return
     * @return users Array of user addresses
     * @return scores Array of user scores
     * @return usernames Array of usernames
     */
    function getTopUsers(uint256 _count) external view returns (
        address[] memory users,
        uint256[] memory scores,
        string[] memory usernames
    ) {
        require(_count > 0 && _count <= MAX_LEADERBOARD_SIZE, "Invalid count");
        
        uint256 actualCount = _count > rankedUsers.length ? rankedUsers.length : _count;
        
        users = new address[](actualCount);
        scores = new uint256[](actualCount);
        usernames = new string[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            users[i] = rankedUsers[i];
            scores[i] = userScores[rankedUsers[i]].totalScore;
            usernames[i] = userScores[rankedUsers[i]].username;
        }
    }
    
    /**
     * @dev Get user score details
     * @param _user The user address
     * @return totalScore Total weighted score
     * @return yieldScore Yield performance score
     * @return battleScore Battle performance score
     * @return reputationScore Reputation score
     * @return lastUpdated Last update timestamp
     */
    function getUserScoreDetails(address _user) external view returns (
        uint256 totalScore,
        uint256 yieldScore,
        uint256 battleScore,
        uint256 reputationScore,
        uint256 lastUpdated
    ) {
        require(isRegistered[_user], "User not registered");
        
        UserScore storage score = userScores[_user];
        return (
            score.totalScore,
            score.yieldScore,
            score.battleScore,
            score.reputationScore,
            score.lastUpdated
        );
    }
    
    /**
     * @dev Get battle leaderboard
     * @param _battleId The battle ID
     * @return users Array of participant addresses
     * @return scores Array of battle scores
     */
    function getBattleLeaderboard(uint256 _battleId) external view returns (
        address[] memory users,
        uint256[] memory scores
    ) {
        BattleLeaderboard storage battleLB = battleLeaderboards[_battleId];
        require(battleLB.isActive, "Battle not active");
        
        uint256 participantCount = battleLB.participants.length;
        users = new address[](participantCount);
        scores = new uint256[](participantCount);
        
        for (uint256 i = 0; i < participantCount; i++) {
            users[i] = battleLB.participants[i];
            scores[i] = battleLB.userScores[battleLB.participants[i]];
        }
    }
    
    /**
     * @dev Get user's rank in a specific battle
     * @param _user The user address
     * @param _battleId The battle ID
     * @return The user's rank in the battle (1-based)
     */
    function getUserBattleRank(address _user, uint256 _battleId) external view returns (uint256) {
        BattleLeaderboard storage battleLB = battleLeaderboards[_battleId];
        require(battleLB.isActive, "Battle not active");
        require(battleLB.hasScore[_user], "User not in battle");
        
        uint256 userScore = battleLB.userScores[_user];
        uint256 rank = 1;
        
        for (uint256 i = 0; i < battleLB.participants.length; i++) {
            if (battleLB.userScores[battleLB.participants[i]] > userScore) {
                rank++;
            }
        }
        
        return rank;
    }
    
    /**
     * @dev Get leaderboard statistics
     * @return _totalUsers Total number of registered users
     * @return _lastUpdateTime Last update timestamp
     * @return _topUserAddress Address of the top user
     * @return _topUserScore Score of the top user
     */
    function getLeaderboardStats() external view returns (
        uint256 _totalUsers,
        uint256 _lastUpdateTime,
        address _topUserAddress,
        uint256 _topUserScore
    ) {
        address topUser = rankedUsers.length > 0 ? rankedUsers[0] : address(0);
        uint256 topScore = topUser != address(0) ? userScores[topUser].totalScore : 0;
        
        return (totalUsers, lastUpdateTime, topUser, topScore);
    }
    
    /**
     * @dev Get users around a specific rank
     * @param _rank The rank to get users around
     * @param _range The range of ranks to include (e.g., 5 means ranks _rank-2 to _rank+2)
     * @return users Array of user addresses
     * @return scores Array of user scores
     * @return usernames Array of usernames
     * @return ranks Array of actual ranks
     */
    function getUsersAroundRank(uint256 _rank, uint256 _range) external view returns (
        address[] memory users,
        uint256[] memory scores,
        string[] memory usernames,
        uint256[] memory ranks
    ) {
        require(_rank > 0 && _rank <= rankedUsers.length, "Invalid rank");
        require(_range > 0, "Invalid range");
        
        uint256 startRank = _rank > _range ? _rank - _range : 1;
        uint256 endRank = _rank + _range > rankedUsers.length ? rankedUsers.length : _rank + _range;
        uint256 count = endRank - startRank + 1;
        
        users = new address[](count);
        scores = new uint256[](count);
        usernames = new string[](count);
        ranks = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 actualRank = startRank + i;
            uint256 index = actualRank - 1;
            
            users[i] = rankedUsers[index];
            scores[i] = userScores[rankedUsers[index]].totalScore;
            usernames[i] = userScores[rankedUsers[index]].username;
            ranks[i] = actualRank;
        }
    }
    
    /**
     * @dev Force update all user scores (only owner)
     */
    function forceUpdateAllScores() external onlyOwner {
        for (uint256 i = 0; i < rankedUsers.length; i++) {
            _updateTotalScore(rankedUsers[i]);
        }
        _updateGlobalLeaderboard();
    }
    
    /**
     * @dev Deactivate a user from leaderboard
     * @param _user The user address
     */
    function deactivateUser(address _user) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        
        userScores[_user].isActive = false;
        
        // Remove from ranked users array
        for (uint256 i = 0; i < rankedUsers.length; i++) {
            if (rankedUsers[i] == _user) {
                rankedUsers[i] = rankedUsers[rankedUsers.length - 1];
                rankedUsers.pop();
                break;
            }
        }
        
        totalUsers--;
        _updateGlobalLeaderboard();
    }
    
    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
