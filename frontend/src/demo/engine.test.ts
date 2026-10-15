import { describe, it, expect, beforeEach } from "vitest";
import { parseEther } from "viem";

import {
  doStake,
  doUnstake,
  doClaim,
  doOfferLoan,
  doTakeLoan,
  doRepay,
  doLiquidate,
  doCancelOffer,
  earned,
  rewardPerToken,
  DemoError,
} from "./engine";
import { DemoLoanState, DEMO_ADDRESSES, type DemoState } from "./types";

/**
 * These tests establish that the in-browser simulation produces the same
 * numerical results as the Hardhat TokenFarm + LoanBook tests for equivalent
 * scenarios. Keep the reward-math expected values in sync if TokenFarm.sol's
 * accounting changes.
 */

/** The demo engine throws DemoError with a code named after the contract's custom error. */
function expectCode(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (e) {
    expect((e as { code?: string }).code).toBe(code);
    return;
  }
  throw new Error(`expected ${code} to be thrown`);
}

const { user, alice, book, farm } = DEMO_ADDRESSES;
const ONE_DAY = 24n * 60n * 60n;
const INITIAL_TIME = 1_700_000_000n;

function baseState(): DemoState {
  return {
    user,
    daiBalances: {
      [user]: parseEther("1000"),
      [alice]: parseEther("500"),
      [farm]: 0n,
      [book]: 0n,
    },
    dappBalances: { [user]: 0n },
    ethBalances: {
      [user]: parseEther("5"),
      [alice]: parseEther("5"),
      [book]: 0n,
    },
    stakedBalance: {},
    totalStaked: 0n,
    rewardRate: 10n ** 15n, // 0.001 DAPP/sec pool-wide
    rewardPerTokenStored: 0n,
    lastUpdateTime: INITIAL_TIME,
    rewardAccounts: {},
    loans: [],
    nextLoanId: 0n,
    chainTime: INITIAL_TIME,
    txCount: 0,
  };
}

describe("TokenFarm math", () => {
  let state: DemoState;
  beforeEach(() => {
    state = baseState();
  });

  it("stake debits user balance and credits farm", () => {
    const { state: next } = doStake(state, user, parseEther("100"), INITIAL_TIME);
    expect(next.daiBalances[user]).toBe(parseEther("900"));
    expect(next.daiBalances[farm]).toBe(parseEther("100"));
    expect(next.stakedBalance[user]).toBe(parseEther("100"));
    expect(next.totalStaked).toBe(parseEther("100"));
  });

  it("rejects zero-amount stake", () => {
    expect(() => doStake(state, user, 0n, INITIAL_TIME)).toThrow(DemoError);
  });

  it("rejects stake beyond balance", () => {
    expect(() => doStake(state, user, parseEther("9999"), INITIAL_TIME)).toThrow(DemoError);
  });

  it("accrues rewards proportionally to time when solo staker", () => {
    // Stake 100 at t=0.
    const { state: s1 } = doStake(state, user, parseEther("100"), INITIAL_TIME);

    // Check rewards 1 hour later.
    const later = INITIAL_TIME + 3600n;
    const e = earned(s1, user, later);

    // With rate 1e15/sec and a sole staker, expected = 3600 * 1e15 = 3.6e18.
    expect(e).toBe(3600n * 10n ** 15n);
  });

  it("splits rewards proportionally between two stakers", () => {
    // User stakes 100, Alice stakes 300. Alice should earn 3x user.
    let s = state;
    s = doStake(s, user, parseEther("100"), INITIAL_TIME).state;
    // Shim: credit Alice some balance so she can stake.
    s = { ...s, daiBalances: { ...s.daiBalances, [alice]: parseEther("300") } };
    s = doStake(s, alice, parseEther("300"), INITIAL_TIME).state;

    const later = INITIAL_TIME + 3600n;
    const userEarned = earned(s, user, later);
    const aliceEarned = earned(s, alice, later);
    expect(aliceEarned).toBe(userEarned * 3n);
  });

  it("unstake returns funds and keeps pending rewards", () => {
    let s = doStake(state, user, parseEther("100"), INITIAL_TIME).state;
    const later = INITIAL_TIME + 3600n;
    const preEarned = earned(s, user, later);

    s = doUnstake(s, user, parseEther("100"), later).state;
    expect(s.daiBalances[user]).toBe(parseEther("1000"));
    expect(s.stakedBalance[user]).toBe(0n);

    // Rewards should be preserved in the account bucket.
    expect(s.rewardAccounts[user]!.rewards).toBe(preEarned);
  });

  it("claim mints DAPP and zeroes pending", () => {
    let s = doStake(state, user, parseEther("100"), INITIAL_TIME).state;
    const later = INITIAL_TIME + 3600n;
    s = doClaim(s, user, later).state;
    expect(s.dappBalances[user]).toBe(3600n * 10n ** 15n);
    expect(s.rewardAccounts[user]!.rewards).toBe(0n);
  });

  it("claim fails when nothing accrued", () => {
    expect(() => doClaim(state, user, INITIAL_TIME)).toThrow(DemoError);
  });

  it("rewardPerToken returns stored value when nothing is staked", () => {
    expect(rewardPerToken(state, INITIAL_TIME + 3600n)).toBe(0n);
  });
});

describe("LoanBook state machine", () => {
  let state: DemoState;
  beforeEach(() => {
    state = baseState();
  });

  const offer = (s: DemoState) =>
    doOfferLoan(
      s,
      user,
      parseEther("100"),
      parseEther("5"),
      parseEther("1"),
      7n * ONE_DAY,
      INITIAL_TIME
    );

  it("offerLoan escrows principal", () => {
    const { state: s } = offer(state);
    expect(s.daiBalances[user]).toBe(parseEther("900"));
    expect(s.daiBalances[book]).toBe(parseEther("100"));
    expect(s.loans[0]!.state).toBe(DemoLoanState.Offered);
    expect(s.nextLoanId).toBe(1n);
  });

  it("cancelOffer returns the escrow to lender", () => {
    let s = offer(state).state;
    s = doCancelOffer(s, user, 0n, INITIAL_TIME).state;
    expect(s.daiBalances[user]).toBe(parseEther("1000"));
    expect(s.loans[0]!.state).toBe(DemoLoanState.Cancelled);
  });

  it("non-lender cannot cancel", () => {
    const s = offer(state).state;
    expectCode(() => doCancelOffer(s, alice, 0n, INITIAL_TIME), "NotLender");
  });

  it("takeLoan transfers principal and locks collateral", () => {
    let s = offer(state).state;
    s = doTakeLoan(s, alice, 0n, parseEther("1"), INITIAL_TIME).state;
    expect(s.daiBalances[alice]).toBe(parseEther("600")); // 500 seed + 100 principal
    expect(s.ethBalances[alice]).toBe(parseEther("4")); // collateral deducted
    expect(s.ethBalances[book]).toBe(parseEther("1"));
    expect(s.loans[0]!.state).toBe(DemoLoanState.Taken);
    expect(s.loans[0]!.borrower).toBe(alice);
  });

  it("takeLoan rejects wrong collateral amount", () => {
    const s = offer(state).state;
    expectCode(() => doTakeLoan(s, alice, 0n, parseEther("0.5"), INITIAL_TIME), "WrongCollateral");
  });

  it("repay settles principal + fee and returns ETH", () => {
    let s = offer(state).state;
    s = doTakeLoan(s, alice, 0n, parseEther("1"), INITIAL_TIME).state;
    s = doRepay(s, alice, 0n, INITIAL_TIME + ONE_DAY).state;

    // Lender received principal + fee.
    expect(s.daiBalances[user]).toBe(parseEther("1005"));
    // Borrower paid principal + fee: 500 seed + 100 principal - 105 = 495.
    expect(s.daiBalances[alice]).toBe(parseEther("495"));
    // Collateral returned.
    expect(s.ethBalances[alice]).toBe(parseEther("5"));
    expect(s.loans[0]!.state).toBe(DemoLoanState.Repaid);
  });

  it("liquidate only works past deadline", () => {
    let s = offer(state).state;
    s = doTakeLoan(s, alice, 0n, parseEther("1"), INITIAL_TIME).state;

    expectCode(() => doLiquidate(s, user, 0n, INITIAL_TIME + ONE_DAY), "DeadlineNotPassed");

    const afterDeadline = INITIAL_TIME + 8n * ONE_DAY;
    const { state: liquidated } = doLiquidate(s, user, 0n, afterDeadline);
    expect(liquidated.ethBalances[user]).toBe(parseEther("6"));
    expect(liquidated.loans[0]!.state).toBe(DemoLoanState.Liquidated);
  });

  it("non-lender cannot liquidate", () => {
    let s = offer(state).state;
    s = doTakeLoan(s, alice, 0n, parseEther("1"), INITIAL_TIME).state;
    expectCode(() => doLiquidate(s, alice, 0n, INITIAL_TIME + 8n * ONE_DAY), "NotLender");
  });
});
