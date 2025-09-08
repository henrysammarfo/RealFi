// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/**
 * @title CrossChainBridge
 * @dev Manages cross-chain asset transfers for RealFi DeFi platform
 * @notice This contract handles bridging assets between ETH, MATIC, and BSC networks
 */
contract CrossChainBridge is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    enum ChainId {
        ETHEREUM,
        POLYGON,
        BSC,
        SOMNIA
    }
    
    struct BridgeRequest {
        uint256 requestId;
        address user;
        address token;
        uint256 amount;
        ChainId sourceChain;
        ChainId targetChain;
        uint256 timestamp;
        bool isProcessed;
        bytes32 transactionHash;
    }
    
    struct ChainConfig {
        bool isSupported;
        string name;
        uint256 chainId;
        address bridgeContract;
        uint256 minBridgeAmount;
        uint256 maxBridgeAmount;
        uint256 bridgeFee;
    }
    
    // Events
    event BridgeRequestCreated(
        uint256 indexed requestId,
        address indexed user,
        address token,
        uint256 amount,
        ChainId sourceChain,
        ChainId targetChain,
        uint256 timestamp
    );
    
    event BridgeRequestProcessed(
        uint256 indexed requestId,
        address indexed user,
        bytes32 transactionHash,
        uint256 timestamp
    );
    
    event AssetBridged(
        address indexed user,
        address token,
        uint256 amount,
        ChainId sourceChain,
        ChainId targetChain,
        bytes32 transactionHash,
        uint256 timestamp
    );
    
    event ChainConfigUpdated(
        ChainId chainId,
        bool isSupported,
        string name,
        uint256 chainIdNumber,
        address bridgeContract,
        uint256 minBridgeAmount,
        uint256 maxBridgeAmount,
        uint256 bridgeFee
    );
    
    // State variables
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(ChainId => ChainConfig) public chainConfigs;
    mapping(address => uint256[]) public userBridgeRequests;
    mapping(address => mapping(ChainId => uint256)) public userChainBalances;
    
    uint256 public nextRequestId;
    uint256 public totalBridgesProcessed;
    uint256 public totalVolumeBridged;
    
    // Constants
    uint256 public constant MAX_BRIDGE_FEE = 1000; // 10% max fee
    uint256 public constant MIN_BRIDGE_AMOUNT = 0.001 ether;
    uint256 public constant MAX_BRIDGE_AMOUNT = 1000 ether;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract
     * @param _owner The address of the contract owner
     */
    function initialize(address _owner) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _transferOwnership(_owner);
        
        nextRequestId = 1;
        _initializeChainConfigs();
    }
    
    /**
     * @dev Initialize default chain configurations
     */
    function _initializeChainConfigs() internal {
        // Ethereum configuration
        chainConfigs[ChainId.ETHEREUM] = ChainConfig({
            isSupported: true,
            name: "Ethereum",
            chainId: 1,
            bridgeContract: address(0), // Will be set during deployment
            minBridgeAmount: 0.01 ether,
            maxBridgeAmount: 100 ether,
            bridgeFee: 50 // 0.5%
        });
        
        // Polygon configuration
        chainConfigs[ChainId.POLYGON] = ChainConfig({
            isSupported: true,
            name: "Polygon",
            chainId: 137,
            bridgeContract: address(0), // Will be set during deployment
            minBridgeAmount: 0.01 ether,
            maxBridgeAmount: 100 ether,
            bridgeFee: 30 // 0.3%
        });
        
        // BSC configuration
        chainConfigs[ChainId.BSC] = ChainConfig({
            isSupported: true,
            name: "BSC",
            chainId: 56,
            bridgeContract: address(0), // Will be set during deployment
            minBridgeAmount: 0.01 ether,
            maxBridgeAmount: 100 ether,
            bridgeFee: 40 // 0.4%
        });
        
        // Somnia configuration
        chainConfigs[ChainId.SOMNIA] = ChainConfig({
            isSupported: true,
            name: "Somnia",
            chainId: 420, // Update with actual Somnia chain ID
            bridgeContract: address(this),
            minBridgeAmount: 0.001 ether,
            maxBridgeAmount: 1000 ether,
            bridgeFee: 20 // 0.2%
        });
    }
    
    /**
     * @dev Create a bridge request
     * @param _token The token address to bridge
     * @param _amount The amount to bridge
     * @param _targetChain The target chain ID
     */
    function createBridgeRequest(
        address _token,
        uint256 _amount,
        ChainId _targetChain
    ) external nonReentrant {
        require(_amount >= MIN_BRIDGE_AMOUNT, "Amount too small");
        require(_amount <= MAX_BRIDGE_AMOUNT, "Amount too large");
        require(chainConfigs[_targetChain].isSupported, "Target chain not supported");
        require(_targetChain != ChainId.SOMNIA, "Cannot bridge to same chain");
        
        ChainConfig storage targetConfig = chainConfigs[_targetChain];
        require(_amount >= targetConfig.minBridgeAmount, "Amount below minimum for target chain");
        require(_amount <= targetConfig.maxBridgeAmount, "Amount above maximum for target chain");
        
        // Transfer tokens from user
        IERC20Upgradeable(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Calculate bridge fee
        uint256 bridgeFee = (_amount * targetConfig.bridgeFee) / 10000;
        uint256 amountAfterFee = _amount - bridgeFee;
        
        // Create bridge request
        uint256 requestId = nextRequestId++;
        BridgeRequest storage request = bridgeRequests[requestId];
        
        request.requestId = requestId;
        request.user = msg.sender;
        request.token = _token;
        request.amount = amountAfterFee;
        request.sourceChain = ChainId.SOMNIA;
        request.targetChain = _targetChain;
        request.timestamp = block.timestamp;
        request.isProcessed = false;
        
        // Update user bridge requests
        userBridgeRequests[msg.sender].push(requestId);
        
        // Update user chain balance
        userChainBalances[msg.sender][_targetChain] += amountAfterFee;
        
        emit BridgeRequestCreated(
            requestId,
            msg.sender,
            _token,
            amountAfterFee,
            ChainId.SOMNIA,
            _targetChain,
            block.timestamp
        );
    }
    
    /**
     * @dev Process a bridge request (only owner or authorized bridge operator)
     * @param _requestId The bridge request ID
     * @param _transactionHash The transaction hash on the target chain
     */
    function processBridgeRequest(uint256 _requestId, bytes32 _transactionHash) external onlyOwner {
        BridgeRequest storage request = bridgeRequests[_requestId];
        require(request.requestId != 0, "Request not found");
        require(!request.isProcessed, "Request already processed");
        
        request.isProcessed = true;
        request.transactionHash = _transactionHash;
        
        totalBridgesProcessed++;
        totalVolumeBridged += request.amount;
        
        emit BridgeRequestProcessed(_requestId, request.user, _transactionHash, block.timestamp);
        emit AssetBridged(
            request.user,
            request.token,
            request.amount,
            request.sourceChain,
            request.targetChain,
            _transactionHash,
            block.timestamp
        );
    }
    
    /**
     * @dev Simulate receiving bridged assets from another chain
     * @param _user The user address
     * @param _token The token address
     * @param _amount The amount received
     * @param _sourceChain The source chain
     * @param _transactionHash The transaction hash
     */
    function receiveBridgedAsset(
        address _user,
        address _token,
        uint256 _amount,
        ChainId _sourceChain,
        bytes32 _transactionHash
    ) external onlyOwner {
        require(chainConfigs[_sourceChain].isSupported, "Source chain not supported");
        require(_amount > 0, "Invalid amount");
        
        // Transfer tokens to user
        IERC20Upgradeable(_token).safeTransfer(_user, _amount);
        
        // Update user chain balance
        userChainBalances[_user][ChainId.SOMNIA] += _amount;
        
        emit AssetBridged(
            _user,
            _token,
            _amount,
            _sourceChain,
            ChainId.SOMNIA,
            _transactionHash,
            block.timestamp
        );
    }
    
    /**
     * @dev Update chain configuration
     * @param _chainId The chain ID
     * @param _isSupported Whether the chain is supported
     * @param _name The chain name
     * @param _chainIdNumber The numeric chain ID
     * @param _bridgeContract The bridge contract address
     * @param _minBridgeAmount Minimum bridge amount
     * @param _maxBridgeAmount Maximum bridge amount
     * @param _bridgeFee Bridge fee in basis points
     */
    function updateChainConfig(
        ChainId _chainId,
        bool _isSupported,
        string memory _name,
        uint256 _chainIdNumber,
        address _bridgeContract,
        uint256 _minBridgeAmount,
        uint256 _maxBridgeAmount,
        uint256 _bridgeFee
    ) external onlyOwner {
        require(_bridgeFee <= MAX_BRIDGE_FEE, "Bridge fee too high");
        require(_minBridgeAmount >= MIN_BRIDGE_AMOUNT, "Min amount too low");
        require(_maxBridgeAmount <= MAX_BRIDGE_AMOUNT, "Max amount too high");
        
        chainConfigs[_chainId] = ChainConfig({
            isSupported: _isSupported,
            name: _name,
            chainId: _chainIdNumber,
            bridgeContract: _bridgeContract,
            minBridgeAmount: _minBridgeAmount,
            maxBridgeAmount: _maxBridgeAmount,
            bridgeFee: _bridgeFee
        });
        
        emit ChainConfigUpdated(
            _chainId,
            _isSupported,
            _name,
            _chainIdNumber,
            _bridgeContract,
            _minBridgeAmount,
            _maxBridgeAmount,
            _bridgeFee
        );
    }
    
    /**
     * @dev Get bridge request details
     * @param _requestId The request ID
     * @return user The user address
     * @return token The token address
     * @return amount The amount
     * @return sourceChain The source chain
     * @return targetChain The target chain
     * @return timestamp The request timestamp
     * @return isProcessed Whether the request is processed
     * @return transactionHash The transaction hash
     */
    function getBridgeRequest(uint256 _requestId) external view returns (
        address user,
        address token,
        uint256 amount,
        ChainId sourceChain,
        ChainId targetChain,
        uint256 timestamp,
        bool isProcessed,
        bytes32 transactionHash
    ) {
        BridgeRequest storage request = bridgeRequests[_requestId];
        require(request.requestId != 0, "Request not found");
        
        return (
            request.user,
            request.token,
            request.amount,
            request.sourceChain,
            request.targetChain,
            request.timestamp,
            request.isProcessed,
            request.transactionHash
        );
    }
    
    /**
     * @dev Get user's bridge requests
     * @param _user The user address
     * @return requestIds Array of request IDs
     */
    function getUserBridgeRequests(address _user) external view returns (uint256[] memory requestIds) {
        return userBridgeRequests[_user];
    }
    
    /**
     * @dev Get user's balance on a specific chain
     * @param _user The user address
     * @param _chainId The chain ID
     * @return The balance on the chain
     */
    function getUserChainBalance(address _user, ChainId _chainId) external view returns (uint256) {
        return userChainBalances[_user][_chainId];
    }
    
    /**
     * @dev Get chain configuration
     * @param _chainId The chain ID
     * @return isSupported Whether the chain is supported
     * @return name The chain name
     * @return chainIdNumber The numeric chain ID
     * @return bridgeContract The bridge contract address
     * @return minBridgeAmount Minimum bridge amount
     * @return maxBridgeAmount Maximum bridge amount
     * @return bridgeFee Bridge fee in basis points
     */
    function getChainConfig(ChainId _chainId) external view returns (
        bool isSupported,
        string memory name,
        uint256 chainIdNumber,
        address bridgeContract,
        uint256 minBridgeAmount,
        uint256 maxBridgeAmount,
        uint256 bridgeFee
    ) {
        ChainConfig storage config = chainConfigs[_chainId];
        return (
            config.isSupported,
            config.name,
            config.chainId,
            config.bridgeContract,
            config.minBridgeAmount,
            config.maxBridgeAmount,
            config.bridgeFee
        );
    }
    
    /**
     * @dev Calculate bridge fee for a given amount and chain
     * @param _amount The amount to bridge
     * @param _targetChain The target chain
     * @return The bridge fee amount
     */
    function calculateBridgeFee(uint256 _amount, ChainId _targetChain) external view returns (uint256) {
        require(chainConfigs[_targetChain].isSupported, "Target chain not supported");
        
        ChainConfig storage config = chainConfigs[_targetChain];
        return (_amount * config.bridgeFee) / 10000;
    }
    
    /**
     * @dev Get bridge statistics
     * @return _totalBridgesProcessed Total number of bridges processed
     * @return _totalVolumeBridged Total volume bridged
     * @return _nextRequestId Next request ID
     */
    function getBridgeStats() external view returns (
        uint256 _totalBridgesProcessed,
        uint256 _totalVolumeBridged,
        uint256 _nextRequestId
    ) {
        return (totalBridgesProcessed, totalVolumeBridged, nextRequestId);
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     * @param _token The token address
     * @param _amount The amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_amount <= IERC20Upgradeable(_token).balanceOf(address(this)), "Insufficient balance");
        IERC20Upgradeable(_token).safeTransfer(owner(), _amount);
    }
    
    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
