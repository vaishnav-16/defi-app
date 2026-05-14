import type { Address } from "viem";
import {
  DEMO_ADDRESSES,
  DemoLoanState,
  type DemoEvent,
  type DemoLoan,
  type DemoState,
  ZERO_ADDRESS,
} from "./types";

// ──────────────────────────────────────────────────────────────────────────────
// Reward math — mirrors TokenFarm.sol exactly.
// Keep these as pure functions so they can be unit-tested against hardhat output.
// ──────────────────────────────────────────────────────────────────────────────

const SCALE = 10n ** 18n;

export function rewardPerToken(state: DemoState, now: bigint): bigint {
  if (state.totalStaked === 0n) return state.rewardPerTokenStored;
  const elapsed = now - state.lastUpdateTime;
  return state.rewardPerTokenStored + (elapsed * state.rewardRate * SCALE) / state.totalStaked;
}

export function earned(state: DemoState, account: Address, now: bigint): bigint {
  const acct = state.rewardAccounts[account] ?? { userRewardPerTokenPaid: 0n, rewards: 0n };
  const perToken = rewardPerToken(state, now) - acct.userRewardPerTokenPaid;
  const staked = state.stakedBalance[account] ?? 0n;
  return (staked * perToken) / SCALE + acct.rewards;
}

/** Checkpoint: advance `rewardPerTokenStored` + snapshot the account. */
function checkpoint(state: DemoState, account: Address | null, now: bigint): DemoState {
  const rpt = rewardPerToken(state, now);
  const next: DemoState = {
    ...state,
    rewardPerTokenStored: rpt,
    lastUpdateTime: now,
    chainTime: now,
  };
  if (account) {
    const acct = state.rewardAccounts[account] ?? { userRewardPerTokenPaid: 0n, rewards: 0n };
    const staked = state.stakedBalance[account] ?? 0n;
    const pending = (staked * (rpt - acct.userRewardPerTokenPaid)) / SCALE + acct.rewards;
    next.rewardAccounts = {
      ...state.rewardAccounts,
      [account]: { userRewardPerTokenPaid: rpt, rewards: pending },
    };
  }
  return next;
}

// ──────────────────────────────────────────────────────────────────────────────
// Reducers — each returns the next state plus any events to emit.
// Mirror `stake`, `unstake`, `claimReward`, `transfer`, and the LoanBook methods.
// ──────────────────────────────────────────────────────────────────────────────

export type ReducerResult = { state: DemoState; events: DemoEvent[] };

export class DemoError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "DemoError";
  }
}

export function doStake(
  state: DemoState,
  user: Address,
  amount: bigint,
  now: bigint
): ReducerResult {
  if (amount <= 0n) throw new DemoError("ZeroAmount", "Amount must be greater than zero.");
  const balance = state.daiBalances[user] ?? 0n;
  if (amount > balance) throw new DemoError("InsufficientBalance", "Not enough mDAI.");

  const checkpointed = checkpoint(state, user, now);
  const next: DemoState = {
    ...checkpointed,
    daiBalances: {
      ...checkpointed.daiBalances,
      [user]: (checkpointed.daiBalances[user] ?? 0n) - amount,
      [DEMO_ADDRESSES.farm]: (checkpointed.daiBalances[DEMO_ADDRESSES.farm] ?? 0n) + amount,
    },
    stakedBalance: {
      ...checkpointed.stakedBalance,
      [user]: (checkpointed.stakedBalance[user] ?? 0n) + amount,
    },
    totalStaked: checkpointed.totalStaked + amount,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "Staked", user, amount, at: now }] };
}

export function doUnstake(
  state: DemoState,
  user: Address,
  amount: bigint,
  now: bigint
): ReducerResult {
  if (amount <= 0n) throw new DemoError("ZeroAmount", "Amount must be greater than zero.");
  const staked = state.stakedBalance[user] ?? 0n;
  if (amount > staked)
    throw new DemoError("InsufficientStaked", `Only ${staked} staked, can't unstake ${amount}.`);

  const cp = checkpoint(state, user, now);
  const next: DemoState = {
    ...cp,
    daiBalances: {
      ...cp.daiBalances,
      [user]: (cp.daiBalances[user] ?? 0n) + amount,
      [DEMO_ADDRESSES.farm]: (cp.daiBalances[DEMO_ADDRESSES.farm] ?? 0n) - amount,
    },
    stakedBalance: {
      ...cp.stakedBalance,
      [user]: staked - amount,
    },
    totalStaked: cp.totalStaked - amount,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "Unstaked", user, amount, at: now }] };
}

export function doClaim(state: DemoState, user: Address, now: bigint): ReducerResult {
  const cp = checkpoint(state, user, now);
  const pending = cp.rewardAccounts[user]?.rewards ?? 0n;
  if (pending === 0n) throw new DemoError("NothingToClaim", "No rewards to claim.");

  const next: DemoState = {
    ...cp,
    rewardAccounts: {
      ...cp.rewardAccounts,
      [user]: { ...cp.rewardAccounts[user]!, rewards: 0n },
    },
    dappBalances: {
      ...cp.dappBalances,
      [user]: (cp.dappBalances[user] ?? 0n) + pending,
    },
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "RewardClaimed", user, amount: pending, at: now }] };
}

export function doExit(state: DemoState, user: Address, now: bigint): ReducerResult {
  const staked = state.stakedBalance[user] ?? 0n;
  const events: DemoEvent[] = [];
  let s = state;
  if (staked > 0n) {
    const r = doUnstake(s, user, staked, now);
    s = r.state;
    events.push(...r.events);
  }
  try {
    const r = doClaim(s, user, now);
    s = r.state;
    events.push(...r.events);
  } catch (err) {
    if (!(err instanceof DemoError) || err.code !== "NothingToClaim") throw err;
  }
  return { state: s, events };
}

export function doTransfer(
  state: DemoState,
  from: Address,
  to: Address,
  amount: bigint,
  now: bigint
): ReducerResult {
  if (amount <= 0n) throw new DemoError("ZeroAmount", "Amount must be greater than zero.");
  const balance = state.daiBalances[from] ?? 0n;
  if (amount > balance) throw new DemoError("InsufficientBalance", "Not enough mDAI.");
  const next: DemoState = {
    ...state,
    daiBalances: {
      ...state.daiBalances,
      [from]: balance - amount,
      [to]: (state.daiBalances[to] ?? 0n) + amount,
    },
    chainTime: now,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "Transfer", from, to, amount, at: now }] };
}

// ──────────────────────────────────────────────────────────────────────────────
// Loan reducers — mirror LoanBook.sol
// ──────────────────────────────────────────────────────────────────────────────

export function doOfferLoan(
  state: DemoState,
  lender: Address,
  loanAmount: bigint,
  feeAmount: bigint,
  collateralAmount: bigint,
  duration: bigint,
  now: bigint
): ReducerResult {
  if (loanAmount <= 0n) throw new DemoError("InvalidLoanAmount", "Loan amount must be > 0.");
  if (collateralAmount <= 0n) throw new DemoError("InvalidCollateral", "Collateral must be > 0.");
  if (duration <= 0n) throw new DemoError("InvalidDuration", "Duration must be > 0.");

  const balance = state.daiBalances[lender] ?? 0n;
  if (loanAmount > balance)
    throw new DemoError("InsufficientBalance", "Lender has insufficient mDAI to escrow.");

  const id = state.nextLoanId;
  const loan: DemoLoan = {
    id,
    lender,
    borrower: ZERO_ADDRESS,
    loanAmount,
    feeAmount,
    collateralAmount,
    duration,
    takenAt: 0n,
    state: DemoLoanState.Offered,
  };

  const next: DemoState = {
    ...state,
    daiBalances: {
      ...state.daiBalances,
      [lender]: balance - loanAmount,
      [DEMO_ADDRESSES.book]: (state.daiBalances[DEMO_ADDRESSES.book] ?? 0n) + loanAmount,
    },
    loans: [...state.loans, loan],
    nextLoanId: id + 1n,
    chainTime: now,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "LoanOffered", loanId: id, lender, at: now }] };
}

export function doCancelOffer(
  state: DemoState,
  caller: Address,
  loanId: bigint,
  now: bigint
): ReducerResult {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) throw new DemoError("NotFound", `Loan ${loanId} not found.`);
  if (loan.state !== DemoLoanState.Offered)
    throw new DemoError("WrongState", "Only offered loans can be cancelled.");
  if (loan.lender !== caller) throw new DemoError("NotLender", "Only the lender can cancel.");

  const next: DemoState = {
    ...state,
    daiBalances: {
      ...state.daiBalances,
      [loan.lender]: (state.daiBalances[loan.lender] ?? 0n) + loan.loanAmount,
      [DEMO_ADDRESSES.book]: (state.daiBalances[DEMO_ADDRESSES.book] ?? 0n) - loan.loanAmount,
    },
    loans: state.loans.map((l) =>
      l.id === loanId ? { ...l, state: DemoLoanState.Cancelled } : l
    ),
    chainTime: now,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "LoanCancelled", loanId, at: now }] };
}

export function doTakeLoan(
  state: DemoState,
  borrower: Address,
  loanId: bigint,
  ethSent: bigint,
  now: bigint
): ReducerResult {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) throw new DemoError("NotFound", `Loan ${loanId} not found.`);
  if (loan.state !== DemoLoanState.Offered)
    throw new DemoError("WrongState", "Loan is not available to take.");
  if (ethSent !== loan.collateralAmount)
    throw new DemoError("WrongCollateral", "Exact collateral required.");
  const ethBalance = state.ethBalances[borrower] ?? 0n;
  if (ethBalance < ethSent)
    throw new DemoError("InsufficientEth", "Not enough ETH for collateral.");

  const next: DemoState = {
    ...state,
    ethBalances: {
      ...state.ethBalances,
      [borrower]: ethBalance - ethSent,
      [DEMO_ADDRESSES.book]: (state.ethBalances[DEMO_ADDRESSES.book] ?? 0n) + ethSent,
    },
    daiBalances: {
      ...state.daiBalances,
      [borrower]: (state.daiBalances[borrower] ?? 0n) + loan.loanAmount,
      [DEMO_ADDRESSES.book]: (state.daiBalances[DEMO_ADDRESSES.book] ?? 0n) - loan.loanAmount,
    },
    loans: state.loans.map((l) =>
      l.id === loanId
        ? { ...l, borrower, takenAt: now, state: DemoLoanState.Taken }
        : l
    ),
    chainTime: now,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "LoanTaken", loanId, borrower, at: now }] };
}

export function doRepay(
  state: DemoState,
  caller: Address,
  loanId: bigint,
  now: bigint
): ReducerResult {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) throw new DemoError("NotFound", `Loan ${loanId} not found.`);
  if (loan.state !== DemoLoanState.Taken)
    throw new DemoError("WrongState", "Only taken loans can be repaid.");
  if (loan.borrower !== caller) throw new DemoError("NotBorrower", "Only the borrower can repay.");

  const total = loan.loanAmount + loan.feeAmount;
  const balance = state.daiBalances[caller] ?? 0n;
  if (balance < total) throw new DemoError("InsufficientBalance", "Not enough mDAI to repay.");

  const next: DemoState = {
    ...state,
    daiBalances: {
      ...state.daiBalances,
      [caller]: balance - total,
      [loan.lender]: (state.daiBalances[loan.lender] ?? 0n) + total,
    },
    ethBalances: {
      ...state.ethBalances,
      [caller]: (state.ethBalances[caller] ?? 0n) + loan.collateralAmount,
      [DEMO_ADDRESSES.book]:
        (state.ethBalances[DEMO_ADDRESSES.book] ?? 0n) - loan.collateralAmount,
    },
    loans: state.loans.map((l) =>
      l.id === loanId ? { ...l, state: DemoLoanState.Repaid } : l
    ),
    chainTime: now,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "LoanRepaid", loanId, at: now }] };
}

export function doLiquidate(
  state: DemoState,
  caller: Address,
  loanId: bigint,
  now: bigint
): ReducerResult {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) throw new DemoError("NotFound", `Loan ${loanId} not found.`);
  if (loan.state !== DemoLoanState.Taken)
    throw new DemoError("WrongState", "Only taken loans can be liquidated.");
  if (loan.lender !== caller)
    throw new DemoError("NotLender", "Only the lender can liquidate.");
  const deadline = loan.takenAt + loan.duration;
  if (now < deadline) throw new DemoError("DeadlineNotPassed", "Not yet past deadline.");

  const next: DemoState = {
    ...state,
    ethBalances: {
      ...state.ethBalances,
      [loan.lender]: (state.ethBalances[loan.lender] ?? 0n) + loan.collateralAmount,
      [DEMO_ADDRESSES.book]:
        (state.ethBalances[DEMO_ADDRESSES.book] ?? 0n) - loan.collateralAmount,
    },
    loans: state.loans.map((l) =>
      l.id === loanId ? { ...l, state: DemoLoanState.Liquidated } : l
    ),
    chainTime: now,
    txCount: state.txCount + 1,
  };
  return { state: next, events: [{ kind: "LoanLiquidated", loanId, at: now }] };
}
