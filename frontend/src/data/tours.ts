/**
 * Tour step definitions for the first-time visitor walkthrough.
 *
 * The walkthrough is event-driven, not time-driven. Each step has a target
 * (DOM selector to anchor to), a prompt, and a `completedWhen` predicate
 * that watches the demo store and the user's actions. If a user does the
 * "completing" action without prompting, the tour advances; if they don't
 * do it, the tour waits.
 *
 * Copy must match `docs/COPY_VOICE.md` — dry, specific, no exclamation.
 */

import type { DemoState } from "@/demo/types";
import { DEMO_ADDRESSES } from "@/demo/types";

export type TourStep = {
  id: string;
  target: string; // CSS selector — anchor element gets a `data-tour` attribute
  title: string;
  body: string;
  /** Returns true when this step's goal has been accomplished. */
  completedWhen: (state: DemoState, eventCount: number) => boolean;
  /** Optional: route the user must be on for this step. */
  requiresRoute?: string;
};

export const stakingTour: TourStep[] = [
  {
    id: "wallet-balance",
    target: '[data-tour="wallet-balance"]',
    title: "You have 1,000 mDAI to play with",
    body: "Treat it like Monopoly money. Nothing here touches a real wallet — the entire experience runs in your browser.",
    completedWhen: () => true, // advances on Next click
    requiresRoute: "/app",
  },
  {
    id: "stake-input",
    target: '[data-tour="stake-input"]',
    title: "Stake any amount to start earning",
    body: "Type a number, or hit Max to stake everything. Once staked, the mDAI earns DAPP rewards every second.",
    completedWhen: (state) =>
      (state.stakedBalance[DEMO_ADDRESSES.user] ?? 0n) > 0n,
    requiresRoute: "/app",
  },
  {
    id: "reward-counter",
    target: '[data-tour="earned"]',
    title: "Watch this number move",
    body: "Rewards accrue continuously. The chain clock runs 60× real time in demo mode, so one wall-second equals one chain-minute. The math is identical to the real contract.",
    completedWhen: (_, eventCount) => eventCount >= 2,
    requiresRoute: "/app",
  },
  {
    id: "claim-action",
    target: '[data-tour="claim-action"]',
    title: "Claim whenever you want",
    body: "Claiming moves earned DAPP into your wallet. The pull pattern means you decide when — rewards never expire.",
    completedWhen: (state) =>
      (state.dappBalances[DEMO_ADDRESSES.user] ?? 0n) > 0n,
    requiresRoute: "/app",
  },
  {
    id: "explore-loans",
    target: '[data-tour="nav-loans"]',
    title: "There's more to explore",
    body: "Two lenders have posted offers. Borrow against ETH, repay on time, or get liquidated. Open Loans when you're ready.",
    completedWhen: () => true,
  },
];

export const TOUR_STORAGE_KEY = "tour-staking-completed";
