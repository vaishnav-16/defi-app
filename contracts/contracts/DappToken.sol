// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DappToken
 * @notice Reward / governance token distributed by the TokenFarm as yield for staking mDAI.
 * @dev    The TokenFarm contract is expected to be set as the `minter` so that
 *         rewards are minted on-demand when users claim (instead of being
 *         pre-minted into the farm's balance). This avoids the old pattern
 *         of transferring 1M tokens up-front.
 */
contract DappToken is ERC20, Ownable {
    /// @notice Address permitted to mint new rewards. Typically the TokenFarm.
    address public minter;

    event MinterUpdated(address indexed previousMinter, address indexed newMinter);

    error NotMinter();

    constructor() ERC20("DApp Token", "DAPP") Ownable(msg.sender) {
        // Zero initial supply — rewards are minted on claim.
    }

    /// @notice Set the address allowed to mint rewards. Only the owner can call.
    function setMinter(address newMinter) external onlyOwner {
        emit MinterUpdated(minter, newMinter);
        minter = newMinter;
    }

    /// @notice Mint reward tokens. Only callable by the designated minter (TokenFarm).
    function mint(address to, uint256 amount) external {
        if (msg.sender != minter) revert NotMinter();
        _mint(to, amount);
    }
}
