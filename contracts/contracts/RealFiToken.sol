// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RealFiToken
 * @dev ERC20 token for RealFi DeFi platform testing
 * @notice This is a test token for the Somnia Testnet deployment
 */
contract RealFiToken is ERC20, Ownable {
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18; // 10 million tokens max
    
    constructor() ERC20("RealFi Token", "RFT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint new tokens (only owner)
     * @param to The address to mint tokens to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Public mint function for users (with limits)
     * @param amount The amount to mint (max 10000 tokens per mint)
     */
    function publicMint(uint256 amount) external {
        require(amount <= 10000 * 10**18, "Max 10000 tokens per mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens
     * @param amount The amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
