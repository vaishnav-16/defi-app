// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DaiToken
 * @notice Mock DAI-like stablecoin for local development and testing.
 * @dev Built on OpenZeppelin's audited ERC20 implementation. The owner can
 *      mint additional supply for test scenarios (e.g., funding investors
 *      in deploy scripts). Not for production use.
 */
contract DaiToken is ERC20, Ownable {
    /// @notice Initial supply minted to the deployer: 1,000,000 mDAI (18 decimals).
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;

    constructor() ERC20("Mock DAI Token", "mDAI") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Mint additional tokens. Restricted to owner — test-only convenience.
     * @param to     Recipient address.
     * @param amount Amount in wei-units (18 decimals).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
