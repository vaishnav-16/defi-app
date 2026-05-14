import type { Address } from "viem";

/** Loan lifecycle states — mirrors `LoanBook.sol` enum. */
export enum DemoLoanState {
  Offered = 0,
  Taken = 1,
  Repaid = 2,
  Liquidated = 3,
  Cancelled = 4,
}

export type DemoLoan = {
  id: bigint;
  lender: Address;
  borrower: Address; // zero address until taken
  loanAmount: bigint;
  feeAmount: bigint;
  collateralAmount: bigint; // in wei
  duration: bigint; // seconds
  takenAt: bigint; // chain-timestamp when taken, 0 if not
  state: DemoLoanState;
};

/** Per-account snapshot needed to compute pending DAPP rewards. */
export type RewardAccount = {
  userRewardPerTokenPaid: bigint;
  rewards: bigint;
};

/**
 * The full demo state. Designed so every field maps 1:1 onto a storage slot
 * or mapping in the real Solidity contracts — making the engine's math
 * verifiable against on-chain behavior.
 */
export type DemoState = {
  // Addresses
  user: Address;

  // Balances
  daiBalances: Record<Address, bigint>;
  dappBalances: Record<Address, bigint>;
  ethBalances: Record<Address, bigint>; // only tracked for user + book

  // TokenFarm state
  stakedBalance: Record<Address, bigint>;
  totalStaked: bigint;
  rewardRate: bigint; // DAPP wei per second, pool-wide
  rewardPerTokenStored: bigint; // scaled by 1e18
  lastUpdateTime: bigint; // chain seconds
  rewardAccounts: Record<Address, RewardAccount>;

  // LoanBook state
  loans: DemoLoan[];
  nextLoanId: bigint;

  // Meta
  chainTime: bigint; // frozen at last write; live time comes from the clock
  txCount: number;
};

/** Domain event stream. Used by the explainer panels. */
export type DemoEvent =
  | { kind: "Staked"; user: Address; amount: bigint; at: bigint }
  | { kind: "Unstaked"; user: Address; amount: bigint; at: bigint }
  | { kind: "RewardClaimed"; user: Address; amount: bigint; at: bigint }
  | { kind: "Transfer"; from: Address; to: Address; amount: bigint; at: bigint }
  | { kind: "LoanOffered"; loanId: bigint; lender: Address; at: bigint }
  | { kind: "LoanCancelled"; loanId: bigint; at: bigint }
  | { kind: "LoanTaken"; loanId: bigint; borrower: Address; at: bigint }
  | { kind: "LoanRepaid"; loanId: bigint; at: bigint }
  | { kind: "LoanLiquidated"; loanId: bigint; at: bigint };

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

/** Well-known seed addresses for the demo. Stable across sessions for tour continuity. */
export const DEMO_ADDRESSES = {
  user: "0x00000000000000000000000000000000000000A1" as Address,
  alice: "0x00000000000000000000000000000000000000B1" as Address, // lender
  bob: "0x00000000000000000000000000000000000000B2" as Address, // another lender
  book: "0x0000000000000000000000000000000000000F00" as Address, // LoanBook address
  farm: "0x0000000000000000000000000000000000000F01" as Address, // TokenFarm address
} as const;
