// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing on Base Sepolia
 * This contract mimics USDT with 6 decimal places
 */
contract MockUSDT is ERC20, Ownable {
    constructor(address initialOwner) ERC20("Mock USDT", "USDT") Ownable(initialOwner) {
        // Mint 1 million USDT to the deployer for testing
        _mint(initialOwner, 1_000_000 * 10**6);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For USDT, this is 6 decimals.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Mint new tokens - only for testing purposes
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in base units)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Mint tokens to caller - for easy testing
     * @param amount Amount of tokens to mint (in base units)
     */
    function mintToSelf(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    /**
     * @dev Get 1000 USDT for testing - anyone can call this
     */
    function faucet() public {
        require(balanceOf(msg.sender) < 10_000 * 10**6, "You already have enough USDT for testing");
        _mint(msg.sender, 1_000 * 10**6); // 1000 USDT
    }
}