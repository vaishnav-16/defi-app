// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IMintableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
}

/**
 * @title TokenFarm
 * @notice Stake mDAI, earn DAPP rewards continuously (per-second accrual).
 * @dev    Reimplementation of the legacy farm using the Synthetix-style
 *         `rewardPerTokenStored` accumulator. Key improvements over the v1:
 *
 *         - Rewards accrue linearly over time instead of being handed out
 *           in a single owner-triggered round.
 *         - No unbounded loops: `O(1)` stake / unstake / claim regardless
 *           of staker count.
 *         - `ReentrancyGuard` on all state-changing external functions.
 *         - `Pausable` for emergency stops.
 *         - `SafeERC20` for transfers (handles non-compliant tokens).
 *         - Rewards minted on claim via the DAPP token's `mint()` instead
 *           of pre-funding the farm with 1M tokens.
 */
contract TokenFarm is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ---------- Immutable config ----------

    /// @notice The staking token (mDAI).
    IERC20 public immutable stakingToken;

    /// @notice The reward token (DAPP). Must grant this contract minter rights.
    IMintableERC20 public immutable rewardToken;

    // ---------- Reward accounting ----------

    /// @notice Reward tokens emitted per second across the entire pool.
    uint256 public rewardRate;

    /// @notice Last time `rewardPerTokenStored` was updated.
    uint256 public lastUpdateTime;

    /// @notice Cumulative reward-per-token, scaled by 1e18.
    uint256 public rewardPerTokenStored;

    /// @notice Total amount staked across all users.
    uint256 public totalStaked;

    /// @notice Per-user snapshot of `rewardPerTokenStored` at last interaction.
    mapping(address => uint256) public userRewardPerTokenPaid;

    /// @notice Per-user rewards earned but not yet claimed.
    mapping(address => uint256) public rewards;

    /// @notice Per-user staked amount.
    mapping(address => uint256) public stakedBalance;

    // ---------- Events ----------

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);

    // ---------- Errors ----------

    error ZeroAmount();
    error InsufficientStakedBalance(uint256 requested, uint256 available);
    error NothingToClaim();

    // ---------- Constructor ----------

    /**
     * @param _stakingToken Address of the staking token (mDAI).
     * @param _rewardToken  Address of the reward token (DAPP).
     * @param _rewardRate   Initial reward rate (DAPP per second, 18 decimals).
     *                      E.g. 1e15 = 0.001 DAPP/sec (~86 DAPP/day pool-wide).
     */
    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate)
        Ownable(msg.sender)
    {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IMintableERC20(_rewardToken);
        rewardRate = _rewardRate;
        lastUpdateTime = block.timestamp;
    }

    // ---------- Modifiers ----------

    /// @dev Checkpoint rewards for `account` before running the body.
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    // ---------- Views ----------

    /// @notice Live value of `rewardPerTokenStored` including accrual since last update.
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        uint256 elapsed = block.timestamp - lastUpdateTime;
        return rewardPerTokenStored + (elapsed * rewardRate * 1e18) / totalStaked;
    }

    /// @notice Total unclaimed reward for `account`.
    function earned(address account) public view returns (uint256) {
        uint256 perToken = rewardPerToken() - userRewardPerTokenPaid[account];
        return (stakedBalance[account] * perToken) / 1e18 + rewards[account];
    }

    // ---------- User-facing actions ----------

    /// @notice Stake `amount` of mDAI and start earning DAPP.
    function stake(uint256 amount)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        if (amount == 0) revert ZeroAmount();
        totalStaked += amount;
        stakedBalance[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /// @notice Withdraw `amount` of previously staked mDAI.
    function unstake(uint256 amount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        if (amount == 0) revert ZeroAmount();
        uint256 staked = stakedBalance[msg.sender];
        if (amount > staked) revert InsufficientStakedBalance(amount, staked);
        totalStaked -= amount;
        stakedBalance[msg.sender] = staked - amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /// @notice Claim all accrued DAPP rewards.
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward == 0) revert NothingToClaim();
        rewards[msg.sender] = 0;
        rewardToken.mint(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    /// @notice Convenience: unstake everything AND claim in one tx.
    function exit() external nonReentrant updateReward(msg.sender) {
        uint256 staked = stakedBalance[msg.sender];
        if (staked > 0) {
            totalStaked -= staked;
            stakedBalance[msg.sender] = 0;
            stakingToken.safeTransfer(msg.sender, staked);
            emit Unstaked(msg.sender, staked);
        }
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.mint(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    // ---------- Admin ----------

    /// @notice Update the reward emission rate. Checkpoint first to avoid retro-pay.
    function setRewardRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        emit RewardRateUpdated(rewardRate, newRate);
        rewardRate = newRate;
    }

    /// @notice Emergency pause — blocks new stakes. Unstake & claim remain open.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
