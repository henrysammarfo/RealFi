// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title UserProfile
 * @dev Manages user registration and profile data for RealFi DeFi platform
 * @notice This contract handles user onboarding, profile management, and reputation scoring
 */
contract UserProfile is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    
    struct UserData {
        string username;
        uint256 registrationTime;
        uint256 totalDeposits;
        uint256 totalWithdrawals;
        uint256 battlesJoined;
        uint256 battlesWon;
        uint256 reputationScore;
        bool isActive;
        mapping(string => string) metadata; // For storing additional user data
    }
    
    // Events
    event UserRegistered(address indexed user, string username, uint256 timestamp);
    event UserUpdated(address indexed user, string username, uint256 timestamp);
    event ReputationUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event UserDeactivated(address indexed user, uint256 timestamp);
    
    // State variables
    mapping(address => UserData) public users;
    mapping(string => address) public usernameToAddress;
    mapping(address => bool) public isRegistered;
    
    uint256 public totalUsers;
    uint256 public activeUsers;
    
    // Constants
    uint256 public constant MIN_USERNAME_LENGTH = 3;
    uint256 public constant MAX_USERNAME_LENGTH = 20;
    uint256 public constant INITIAL_REPUTATION_SCORE = 100;
    
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
    }
    
    /**
     * @dev Register a new user
     * @param _username The username for the user
     * @notice Users can only register once and usernames must be unique
     */
    function registerUser(string memory _username) external nonReentrant {
        require(!isRegistered[msg.sender], "User already registered");
        require(bytes(_username).length >= MIN_USERNAME_LENGTH, "Username too short");
        require(bytes(_username).length <= MAX_USERNAME_LENGTH, "Username too long");
        require(usernameToAddress[_username] == address(0), "Username already taken");
        
        // Validate username contains only alphanumeric characters
        bytes memory usernameBytes = bytes(_username);
        for (uint256 i = 0; i < usernameBytes.length; i++) {
            bytes1 char = usernameBytes[i];
            require(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A),   // a-z
                "Username contains invalid characters"
            );
        }
        
        UserData storage user = users[msg.sender];
        user.username = _username;
        user.registrationTime = block.timestamp;
        user.reputationScore = INITIAL_REPUTATION_SCORE;
        user.isActive = true;
        
        usernameToAddress[_username] = msg.sender;
        isRegistered[msg.sender] = true;
        totalUsers++;
        activeUsers++;
        
        emit UserRegistered(msg.sender, _username, block.timestamp);
    }
    
    /**
     * @dev Update user profile information
     * @param _username New username (must be unique)
     */
    function updateProfile(string memory _username) external nonReentrant {
        require(isRegistered[msg.sender], "User not registered");
        require(users[msg.sender].isActive, "User account deactivated");
        require(bytes(_username).length >= MIN_USERNAME_LENGTH, "Username too short");
        require(bytes(_username).length <= MAX_USERNAME_LENGTH, "Username too long");
        require(usernameToAddress[_username] == address(0) || usernameToAddress[_username] == msg.sender, "Username already taken");
        
        // Validate username contains only alphanumeric characters
        bytes memory usernameBytes = bytes(_username);
        for (uint256 i = 0; i < usernameBytes.length; i++) {
            bytes1 char = usernameBytes[i];
            require(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A),   // a-z
                "Username contains invalid characters"
            );
        }
        
        string memory oldUsername = users[msg.sender].username;
        users[msg.sender].username = _username;
        
        // Update username mapping
        delete usernameToAddress[oldUsername];
        usernameToAddress[_username] = msg.sender;
        
        emit UserUpdated(msg.sender, _username, block.timestamp);
    }
    
    /**
     * @dev Update user metadata
     * @param _key The metadata key
     * @param _value The metadata value
     */
    function updateMetadata(string memory _key, string memory _value) external {
        require(isRegistered[msg.sender], "User not registered");
        require(users[msg.sender].isActive, "User account deactivated");
        
        users[msg.sender].metadata[_key] = _value;
    }
    
    /**
     * @dev Update user statistics (only callable by authorized contracts)
     * @param _user The user address
     * @param _depositAmount Amount deposited
     * @param _withdrawalAmount Amount withdrawn
     * @param _battleJoined Whether user joined a battle
     * @param _battleWon Whether user won a battle
     */
    function updateUserStats(
        address _user,
        uint256 _depositAmount,
        uint256 _withdrawalAmount,
        bool _battleJoined,
        bool _battleWon
    ) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        
        UserData storage user = users[_user];
        user.totalDeposits += _depositAmount;
        user.totalWithdrawals += _withdrawalAmount;
        
        if (_battleJoined) {
            user.battlesJoined++;
        }
        
        if (_battleWon) {
            user.battlesWon++;
        }
        
        // Update reputation score based on activity
        _updateReputationScore(_user);
    }
    
    /**
     * @dev Update reputation score based on user activity
     * @param _user The user address
     */
    function _updateReputationScore(address _user) internal {
        UserData storage user = users[_user];
        uint256 oldScore = user.reputationScore;
        
        // Calculate new reputation score
        uint256 newScore = INITIAL_REPUTATION_SCORE;
        
        // Add points for deposits (1 point per 0.1 ETH equivalent)
        newScore += user.totalDeposits / 1e17;
        
        // Add points for battle participation
        newScore += user.battlesJoined * 10;
        
        // Add points for battle wins
        newScore += user.battlesWon * 50;
        
        // Subtract points for withdrawals (penalty for early exits)
        newScore -= user.totalWithdrawals / 1e18;
        
        // Ensure score doesn't go below 0
        if (newScore < 0) {
            newScore = 0;
        }
        
        user.reputationScore = newScore;
        
        if (oldScore != newScore) {
            emit ReputationUpdated(_user, oldScore, newScore);
        }
    }
    
    /**
     * @dev Deactivate a user account
     * @param _user The user address to deactivate
     */
    function deactivateUser(address _user) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        require(users[_user].isActive, "User already deactivated");
        
        users[_user].isActive = false;
        activeUsers--;
        
        emit UserDeactivated(_user, block.timestamp);
    }
    
    /**
     * @dev Get user data
     * @param _user The user address
     * @return username The user's username
     * @return registrationTime When the user registered
     * @return totalDeposits Total amount deposited
     * @return totalWithdrawals Total amount withdrawn
     * @return battlesJoined Number of battles joined
     * @return battlesWon Number of battles won
     * @return reputationScore Current reputation score
     * @return isActive Whether the user is active
     */
    function getUserData(address _user) external view returns (
        string memory username,
        uint256 registrationTime,
        uint256 totalDeposits,
        uint256 totalWithdrawals,
        uint256 battlesJoined,
        uint256 battlesWon,
        uint256 reputationScore,
        bool isActive
    ) {
        require(isRegistered[_user], "User not registered");
        
        UserData storage user = users[_user];
        return (
            user.username,
            user.registrationTime,
            user.totalDeposits,
            user.totalWithdrawals,
            user.battlesJoined,
            user.battlesWon,
            user.reputationScore,
            user.isActive
        );
    }
    
    /**
     * @dev Get user metadata
     * @param _user The user address
     * @param _key The metadata key
     * @return The metadata value
     */
    function getUserMetadata(address _user, string memory _key) external view returns (string memory) {
        require(isRegistered[_user], "User not registered");
        return users[_user].metadata[_key];
    }
    
    /**
     * @dev Check if a username is available
     * @param _username The username to check
     * @return True if available, false otherwise
     */
    function isUsernameAvailable(string memory _username) external view returns (bool) {
        return usernameToAddress[_username] == address(0);
    }
    
    /**
     * @dev Get total statistics
     * @return _totalUsers Total number of registered users
     * @return _activeUsers Total number of active users
     */
    function getTotalStats() external view returns (uint256 _totalUsers, uint256 _activeUsers) {
        return (totalUsers, activeUsers);
    }
    
    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
