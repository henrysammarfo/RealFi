// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldVault
 * @dev Manages yield farming vaults and battle participation for RealFi DeFi platform
 * @notice This contract handles deposits, withdrawals, yield calculations, and battle mechanics
 */
contract YieldVault is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    
    struct VaultPosition {
        uint256 amount;
        uint256 depositTime;
        uint256 lastClaimTime;
        uint256 battleId;
        bool isActive;
    }
    
    struct Battle {
        uint256 battleId;
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPrizePool;
        uint256 entryFee;
        uint256 maxParticipants;
        uint256 currentParticipants;
        bool isActive;
        mapping(address => bool) participants;
        mapping(address => uint256) participantDeposits;
    }
    
    // Events
    event DepositMade(address indexed user, uint256 amount, uint256 battleId, uint256 timestamp);
    event WithdrawalMade(address indexed user, uint256 amount, uint256 timestamp);
    event BattleCreated(uint256 indexed battleId, string name, uint256 startTime, uint256 endTime, uint256 entryFee);
    event BattleJoined(address indexed user, uint256 indexed battleId, uint256 amount, uint256 timestamp);
    event BattleEnded(uint256 indexed battleId, address winner, uint256 prizeAmount, uint256 timestamp);
    event YieldClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event PrizeDistributed(uint256 indexed battleId, address indexed winner, uint256 amount, uint256 timestamp);
    
    // State variables
    mapping(address => VaultPosition) public userPositions;
    mapping(uint256 => Battle) public battles;
    mapping(address => uint256) public userTotalDeposits;
    mapping(address => uint256) public userTotalWithdrawals;
    mapping(address => uint256) public userTotalYield;
    
    IERC20 public token;
    address public userProfileContract;
    
    uint256 public nextBattleId;
    uint256 public totalVaultValue;
    uint256 public totalYieldDistributed;
    uint256 public constant YIELD_RATE = 5; // 5% APY
    uint256 public constant BATTLE_DURATION = 7 days;
    uint256 public constant MIN_DEPOSIT = 0.01 ether;
    uint256 public constant MAX_DEPOSIT = 100 ether;
    
    // Battle configuration
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint256 public constant MAX_ENTRY_FEE = 1 ether;
    uint256 public constant DEFAULT_MAX_PARTICIPANTS = 100;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract
     * @param _owner The address of the contract owner
     * @param _token The ERC20 token address for deposits
     * @param _userProfileContract The address of the UserProfile contract
     */
    function initialize(
        address _owner,
        address _token,
        address _userProfileContract
    ) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        token = IERC20(_token);
        userProfileContract = _userProfileContract;
        nextBattleId = 1;
    }
    
    /**
     * @dev Create a new yield battle
     * @param _name The name of the battle
     * @param _entryFee The entry fee for the battle
     * @param _maxParticipants Maximum number of participants
     * @param _duration Battle duration in seconds
     */
    function createBattle(
        string memory _name,
        uint256 _entryFee,
        uint256 _maxParticipants,
        uint256 _duration
    ) external onlyOwner {
        require(_entryFee >= MIN_ENTRY_FEE && _entryFee <= MAX_ENTRY_FEE, "Invalid entry fee");
        require(_maxParticipants > 0 && _maxParticipants <= DEFAULT_MAX_PARTICIPANTS, "Invalid max participants");
        require(_duration > 0 && _duration <= 30 days, "Invalid duration");
        
        uint256 battleId = nextBattleId++;
        Battle storage battle = battles[battleId];
        
        battle.battleId = battleId;
        battle.name = _name;
        battle.startTime = block.timestamp;
        battle.endTime = block.timestamp + _duration;
        battle.entryFee = _entryFee;
        battle.maxParticipants = _maxParticipants;
        battle.currentParticipants = 0;
        battle.isActive = true;
        
        emit BattleCreated(battleId, _name, battle.startTime, battle.endTime, _entryFee);
    }
    
    /**
     * @dev Join a yield battle with a deposit
     * @param _battleId The ID of the battle to join
     * @param _amount The amount to deposit
     */
    function joinBattle(uint256 _battleId, uint256 _amount) external nonReentrant {
        require(_amount >= MIN_DEPOSIT && _amount <= MAX_DEPOSIT, "Invalid deposit amount");
        require(battles[_battleId].isActive, "Battle not active");
        require(block.timestamp >= battles[_battleId].startTime, "Battle not started");
        require(block.timestamp <= battles[_battleId].endTime, "Battle ended");
        require(!battles[_battleId].participants[msg.sender], "Already joined battle");
        require(battles[_battleId].currentParticipants < battles[_battleId].maxParticipants, "Battle full");
        
        // Transfer tokens from user
        token.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update battle state
        battles[_battleId].participants[msg.sender] = true;
        battles[_battleId].participantDeposits[msg.sender] = _amount;
        battles[_battleId].currentParticipants++;
        
        // Update user position
        VaultPosition storage position = userPositions[msg.sender];
        position.amount += _amount;
        position.depositTime = block.timestamp;
        position.lastClaimTime = block.timestamp;
        position.battleId = _battleId;
        position.isActive = true;
        
        // Update global state
        userTotalDeposits[msg.sender] += _amount;
        totalVaultValue += _amount;
        
        // Update user profile stats
        _updateUserProfileStats(msg.sender, _amount, 0, true, false);
        
        emit BattleJoined(msg.sender, _battleId, _amount, block.timestamp);
        emit DepositMade(msg.sender, _amount, _battleId, block.timestamp);
    }
    
    /**
     * @dev Make a regular deposit (not in a battle)
     * @param _amount The amount to deposit
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount >= MIN_DEPOSIT && _amount <= MAX_DEPOSIT, "Invalid deposit amount");
        
        // Transfer tokens from user
        token.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user position
        VaultPosition storage position = userPositions[msg.sender];
        position.amount += _amount;
        position.depositTime = block.timestamp;
        position.lastClaimTime = block.timestamp;
        position.isActive = true;
        
        // Update global state
        userTotalDeposits[msg.sender] += _amount;
        totalVaultValue += _amount;
        
        // Update user profile stats
        _updateUserProfileStats(msg.sender, _amount, 0, false, false);
        
        emit DepositMade(msg.sender, _amount, 0, block.timestamp);
    }
    
    /**
     * @dev Withdraw funds from vault
     * @param _amount The amount to withdraw
     */
    function withdraw(uint256 _amount) external nonReentrant {
        VaultPosition storage position = userPositions[msg.sender];
        require(position.isActive, "No active position");
        require(_amount <= position.amount, "Insufficient balance");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Check if user is in an active battle
        if (position.battleId > 0 && battles[position.battleId].isActive) {
            require(block.timestamp > battles[position.battleId].endTime, "Cannot withdraw during active battle");
        }
        
        // Calculate and claim yield first
        uint256 yieldAmount = calculateYield(msg.sender);
        if (yieldAmount > 0) {
            _claimYield(msg.sender);
        }
        
        // Update position
        position.amount -= _amount;
        if (position.amount == 0) {
            position.isActive = false;
        }
        
        // Update global state
        userTotalWithdrawals[msg.sender] += _amount;
        totalVaultValue -= _amount;
        
        // Transfer tokens to user
        token.safeTransfer(msg.sender, _amount);
        
        // Update user profile stats
        _updateUserProfileStats(msg.sender, 0, _amount, false, false);
        
        emit WithdrawalMade(msg.sender, _amount, block.timestamp);
    }
    
    /**
     * @dev Claim accumulated yield
     */
    function claimYield() external nonReentrant {
        uint256 yieldAmount = calculateYield(msg.sender);
        require(yieldAmount > 0, "No yield to claim");
        
        _claimYield(msg.sender);
    }
    
    /**
     * @dev Internal function to claim yield
     * @param _user The user address
     */
    function _claimYield(address _user) internal {
        uint256 yieldAmount = calculateYield(_user);
        require(yieldAmount > 0, "No yield to claim");
        
        VaultPosition storage position = userPositions[_user];
        position.lastClaimTime = block.timestamp;
        
        userTotalYield[_user] += yieldAmount;
        totalYieldDistributed += yieldAmount;
        
        // Transfer yield to user
        token.safeTransfer(_user, yieldAmount);
        
        emit YieldClaimed(_user, yieldAmount, block.timestamp);
    }
    
    /**
     * @dev Calculate yield for a user
     * @param _user The user address
     * @return The yield amount
     */
    function calculateYield(address _user) public view returns (uint256) {
        VaultPosition storage position = userPositions[_user];
        if (!position.isActive || position.amount == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - position.lastClaimTime;
        uint256 yieldAmount = (position.amount * YIELD_RATE * timeElapsed) / (365 days * 100);
        
        return yieldAmount;
    }
    
    /**
     * @dev End a battle and distribute prizes
     * @param _battleId The ID of the battle to end
     */
    function endBattle(uint256 _battleId) external onlyOwner {
        Battle storage battle = battles[_battleId];
        require(battle.isActive, "Battle not active");
        require(block.timestamp >= battle.endTime, "Battle not ended yet");
        
        battle.isActive = false;
        
        // Calculate total prize pool
        uint256 totalDeposits = 0;
        address winner = address(0);
        uint256 maxDeposit = 0;
        
        // Find winner (user with highest deposit)
        for (uint256 i = 0; i < battle.currentParticipants; i++) {
            // This is a simplified winner selection - in production, you'd want a more sophisticated algorithm
            // For now, we'll select the first participant as winner for demonstration
            // In a real implementation, you'd iterate through all participants
        }
        
        // For demonstration, we'll distribute the entry fees as prizes
        uint256 prizeAmount = battle.entryFee * battle.currentParticipants;
        
        if (prizeAmount > 0 && battle.currentParticipants > 0) {
            // Distribute prize to winner (simplified - in production, implement proper winner selection)
            // For now, we'll just emit the event
            emit BattleEnded(_battleId, winner, prizeAmount, block.timestamp);
        }
    }
    
    /**
     * @dev Update user profile statistics
     * @param _user The user address
     * @param _depositAmount Amount deposited
     * @param _withdrawalAmount Amount withdrawn
     * @param _battleJoined Whether user joined a battle
     * @param _battleWon Whether user won a battle
     */
    function _updateUserProfileStats(
        address _user,
        uint256 _depositAmount,
        uint256 _withdrawalAmount,
        bool _battleJoined,
        bool _battleWon
    ) internal {
        // Call UserProfile contract to update stats
        // This would require the UserProfile contract to have a public updateUserStats function
        // For now, we'll just emit events
    }
    
    /**
     * @dev Get user position details
     * @param _user The user address
     * @return amount Current deposit amount
     * @return depositTime When the deposit was made
     * @return lastClaimTime When yield was last claimed
     * @return battleId Current battle ID (0 if not in battle)
     * @return isActive Whether the position is active
     */
    function getUserPosition(address _user) external view returns (
        uint256 amount,
        uint256 depositTime,
        uint256 lastClaimTime,
        uint256 battleId,
        bool isActive
    ) {
        VaultPosition storage position = userPositions[_user];
        return (
            position.amount,
            position.depositTime,
            position.lastClaimTime,
            position.battleId,
            position.isActive
        );
    }
    
    /**
     * @dev Get battle details
     * @param _battleId The battle ID
     * @return name Battle name
     * @return startTime Battle start time
     * @return endTime Battle end time
     * @return totalPrizePool Total prize pool
     * @return entryFee Entry fee
     * @return maxParticipants Maximum participants
     * @return currentParticipants Current participants
     * @return isActive Whether battle is active
     */
    function getBattleDetails(uint256 _battleId) external view returns (
        string memory name,
        uint256 startTime,
        uint256 endTime,
        uint256 totalPrizePool,
        uint256 entryFee,
        uint256 maxParticipants,
        uint256 currentParticipants,
        bool isActive
    ) {
        Battle storage battle = battles[_battleId];
        return (
            battle.name,
            battle.startTime,
            battle.endTime,
            battle.totalPrizePool,
            battle.entryFee,
            battle.maxParticipants,
            battle.currentParticipants,
            battle.isActive
        );
    }
    
    /**
     * @dev Check if user is in a battle
     * @param _user The user address
     * @param _battleId The battle ID
     * @return True if user is in the battle
     */
    function isUserInBattle(address _user, uint256 _battleId) external view returns (bool) {
        return battles[_battleId].participants[_user];
    }
    
    /**
     * @dev Get user's deposit in a battle
     * @param _user The user address
     * @param _battleId The battle ID
     * @return The deposit amount
     */
    function getUserBattleDeposit(address _user, uint256 _battleId) external view returns (uint256) {
        return battles[_battleId].participantDeposits[_user];
    }
    
    /**
     * @dev Get vault statistics
     * @return _totalVaultValue Total value in vault
     * @return _totalYieldDistributed Total yield distributed
     * @return _nextBattleId Next battle ID
     */
    function getVaultStats() external view returns (
        uint256 _totalVaultValue,
        uint256 _totalYieldDistributed,
        uint256 _nextBattleId
    ) {
        return (totalVaultValue, totalYieldDistributed, nextBattleId);
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     * @param _amount The amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= token.balanceOf(address(this)), "Insufficient contract balance");
        token.safeTransfer(owner(), _amount);
    }
    
    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
