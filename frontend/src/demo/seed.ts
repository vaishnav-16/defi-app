import { parseEther } from "viem";
import { DEMO_ADDRESSES, DemoLoanState, type DemoState } from "./types";

/**
 * Initial state for the demo.
 *
 * The user lands with 1000 mDAI, 10 ETH, and sees two pre-existing loan offers
 * from "Alice" and "Bob" so the Loans page is populated immediately instead of
 * being an empty state.
 *
 * Reward rate is cranked *way* up relative to the real contract: 1e16 wei/sec
 * pool-wide = 0.01 DAPP/sec. Combined with the 60× clock multiplier, the user
 * sees their reward counter tick noticeably within 5 seconds of staking.
 */
export function seedState(): DemoState {
  const now = BigInt(Math.floor(Date.now() / 1000));

  return {
    user: DEMO_ADDRESSES.user,

    daiBalances: {
      [DEMO_ADDRESSES.user]: parseEther("1000"),
      [DEMO_ADDRESSES.alice]: parseEther("2000"),
      [DEMO_ADDRESSES.bob]: parseEther("500"),
      [DEMO_ADDRESSES.farm]: 0n,
      [DEMO_ADDRESSES.book]: parseEther("300"), // escrowed from seed offers below
    },

    dappBalances: {
      [DEMO_ADDRESSES.user]: 0n,
    },

    ethBalances: {
      [DEMO_ADDRESSES.user]: parseEther("10"),
      [DEMO_ADDRESSES.alice]: parseEther("50"),
      [DEMO_ADDRESSES.bob]: parseEther("25"),
      [DEMO_ADDRESSES.book]: 0n,
    },

    stakedBalance: {},
    totalStaked: 0n,
    rewardRate: 10n ** 16n, // 0.01 DAPP/sec pool-wide
    rewardPerTokenStored: 0n,
    lastUpdateTime: now,
    rewardAccounts: {},

    // Two seed loan offers so the Loans page isn't empty on first visit.
    loans: [
      {
        id: 0n,
        lender: DEMO_ADDRESSES.alice,
        borrower: "0x0000000000000000000000000000000000000000",
        loanAmount: parseEther("200"),
        feeAmount: parseEther("10"),
        collateralAmount: parseEther("0.5"),
        duration: 7n * 24n * 60n * 60n, // 7 days
        takenAt: 0n,
        state: DemoLoanState.Offered,
      },
      {
        id: 1n,
        lender: DEMO_ADDRESSES.bob,
        borrower: "0x0000000000000000000000000000000000000000",
        loanAmount: parseEther("100"),
        feeAmount: parseEther("3"),
        collateralAmount: parseEther("0.25"),
        duration: 3n * 24n * 60n * 60n, // 3 days
        takenAt: 0n,
        state: DemoLoanState.Offered,
      },
    ],
    nextLoanId: 2n,

    chainTime: now,
    txCount: 0,
  };
}
