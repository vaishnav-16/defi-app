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

    /// @notice What one faucet claim pays out: 1,000 mDAI.
    uint256 public constant FAUCET_AMOUNT = 1_000 ether;

    /// @notice How long a wallet waits between faucet claims.
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    /// @notice Last faucet claim per wallet (block timestamp).
    mapping(address => uint256) public lastFaucetClaim;

    event FaucetClaimed(address indexed to, uint256 amount);

    error FaucetCooldown(uint256 availableAt);

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

    /**
     * @notice Public test faucet so any testnet visitor can get mDAI to try the app.
     *         One claim per wallet per day. Fine for a mock token, never for a real one.
     */
    function faucet() external {
        uint256 last = lastFaucetClaim[msg.sender];
        if (last != 0 && block.timestamp < last + FAUCET_COOLDOWN) {
            revert FaucetCooldown(last + FAUCET_COOLDOWN);
        }
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }
}
