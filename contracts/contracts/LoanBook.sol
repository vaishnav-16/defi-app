// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LoanBook
 * @notice Over-collateralized peer-to-peer lending: lender offers mDAI, borrower
 *         locks ETH as collateral, repays by deadline or gets liquidated.
 * @dev    Supersedes the v1 `BasicLoan` which used a one-contract-per-loan
 *         pattern + `selfdestruct` (deprecated in 0.8.24+). This version:
 *
 *         - Holds unlimited loans in a single deployed contract (mapping).
 *         - Uses a finite state machine instead of destructive opcodes.
 *         - Emits events for off-chain indexing.
 *         - Guards every state-changing function against reentrancy.
 *         - Allows the lender to cancel an unfunded offer.
 *
 *         NOTE: this contract does NOT use a price oracle — collateral
 *         amounts are set by the lender at loan-creation time. Integrating
 *         Chainlink for live liquidation would be a clear next iteration.
 */
contract LoanBook is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------- Types ----------

    enum LoanState {
        Offered, // Lender has funded, waiting for a borrower
        Taken, // Borrower has posted collateral and received the loan
        Repaid, // Borrower repaid on time; collateral returned
        Liquidated, // Lender liquidated after deadline; collateral transferred
        Cancelled // Lender cancelled before anyone took it
    }

    struct Loan {
        address lender;
        address borrower; // zero until taken
        uint256 loanAmount; // mDAI to borrow
        uint256 feeAmount; // mDAI fee on top of principal at repayment
        uint256 collateralAmount; // ETH the borrower must post
        uint256 duration; // seconds from `take` to deadline
        uint256 takenAt; // block.timestamp when taken (0 if not)
        LoanState state;
    }

    // ---------- Storage ----------

    IERC20 public immutable dai;

    /// @notice Auto-incrementing loan ID counter.
    uint256 public nextLoanId;

    /// @notice All loans, indexed by ID.
    mapping(uint256 => Loan) public loans;

    // ---------- Events ----------

    event LoanOffered(
        uint256 indexed loanId,
        address indexed lender,
        uint256 loanAmount,
        uint256 feeAmount,
        uint256 collateralAmount,
        uint256 duration
    );
    event LoanCancelled(uint256 indexed loanId);
    event LoanTaken(uint256 indexed loanId, address indexed borrower, uint256 deadline);
    event LoanRepaid(uint256 indexed loanId);
    event LoanLiquidated(uint256 indexed loanId);

    // ---------- Errors ----------

    error InvalidLoanAmount();
    error InvalidCollateral();
    error InvalidDuration();
    error WrongCollateralSent(uint256 expected, uint256 got);
    error NotLender();
    error NotBorrower();
    error WrongState(LoanState expected, LoanState actual);
    error DeadlineNotPassed();
    error EthTransferFailed();

    // ---------- Constructor ----------

    constructor(address _dai) {
        dai = IERC20(_dai);
    }

    // ---------- Lender actions ----------

    /**
     * @notice Post a new loan offer. Lender must `approve` this contract to spend
     *         `loanAmount` mDAI first. Tokens are pulled in escrow until taken.
     */
    function offerLoan(
        uint256 loanAmount,
        uint256 feeAmount,
        uint256 collateralAmount,
        uint256 duration
    ) external nonReentrant returns (uint256 loanId) {
        if (loanAmount == 0) revert InvalidLoanAmount();
        if (collateralAmount == 0) revert InvalidCollateral();
        if (duration == 0) revert InvalidDuration();

        loanId = nextLoanId++;
        loans[loanId] = Loan({
            lender: msg.sender,
            borrower: address(0),
            loanAmount: loanAmount,
            feeAmount: feeAmount,
            collateralAmount: collateralAmount,
            duration: duration,
            takenAt: 0,
            state: LoanState.Offered
        });

        dai.safeTransferFrom(msg.sender, address(this), loanAmount);

        emit LoanOffered(loanId, msg.sender, loanAmount, feeAmount, collateralAmount, duration);
    }

    /// @notice Withdraw an un-taken offer and get the escrowed mDAI back.
    function cancelOffer(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.state != LoanState.Offered) revert WrongState(LoanState.Offered, loan.state);
        if (msg.sender != loan.lender) revert NotLender();

        loan.state = LoanState.Cancelled;
        dai.safeTransfer(loan.lender, loan.loanAmount);

        emit LoanCancelled(loanId);
    }

    /// @notice Liquidate a taken loan whose deadline has passed. Collateral → lender.
    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.state != LoanState.Taken) revert WrongState(LoanState.Taken, loan.state);
        if (msg.sender != loan.lender) revert NotLender();
        if (block.timestamp < loan.takenAt + loan.duration) revert DeadlineNotPassed();

        loan.state = LoanState.Liquidated;
        _sendEth(loan.lender, loan.collateralAmount);

        emit LoanLiquidated(loanId);
    }

    // ---------- Borrower actions ----------

    /**
     * @notice Take an offered loan. Borrower must send exactly `collateralAmount`
     *         ETH with the call. Principal mDAI is transferred to borrower.
     */
    function takeLoan(uint256 loanId) external payable nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.state != LoanState.Offered) revert WrongState(LoanState.Offered, loan.state);
        if (msg.value != loan.collateralAmount) {
            revert WrongCollateralSent(loan.collateralAmount, msg.value);
        }

        loan.borrower = msg.sender;
        loan.takenAt = block.timestamp;
        loan.state = LoanState.Taken;

        dai.safeTransfer(msg.sender, loan.loanAmount);

        emit LoanTaken(loanId, msg.sender, block.timestamp + loan.duration);
    }

    /**
     * @notice Repay principal + fee. Borrower must `approve` this contract for
     *         `loanAmount + feeAmount` mDAI first. Collateral ETH is returned.
     */
    function repay(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.state != LoanState.Taken) revert WrongState(LoanState.Taken, loan.state);
        if (msg.sender != loan.borrower) revert NotBorrower();

        loan.state = LoanState.Repaid;

        uint256 total = loan.loanAmount + loan.feeAmount;
        dai.safeTransferFrom(msg.sender, loan.lender, total);
        _sendEth(loan.borrower, loan.collateralAmount);

        emit LoanRepaid(loanId);
    }

    // ---------- Views ----------

    /// @notice Returns `true` if the loan is taken and its deadline has passed.
    function isLiquidatable(uint256 loanId) external view returns (bool) {
        Loan storage loan = loans[loanId];
        return loan.state == LoanState.Taken && block.timestamp >= loan.takenAt + loan.duration;
    }

    // ---------- Internal ----------

    function _sendEth(address to, uint256 amount) internal {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert EthTransferFailed();
    }
}
