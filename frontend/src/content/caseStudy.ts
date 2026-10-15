/**
 * The case study, broken into typed sections. Each section exports a set of
 * blocks that the `/case-study` page renders with a small block-renderer.
 *
 * Writing lives here rather than in JSX because:
 *   1. It's version-controlled as prose, not markup.
 *   2. Sections can be reordered without touching the page.
 *   3. A/B testing the hero or the problem framing is trivial.
 */

export type Block =
  | { kind: "prose"; text: string }
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "pull"; text: string; attribution?: string }
  | { kind: "metric"; label: string; value: string; context?: string }
  | { kind: "tradeoff"; chose: string; over: string; because: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "spacer" };

export type Section = {
  slug: string;
  kicker: string;
  title: string;
  blocks: Block[];
};

// ──────────────────────────────────────────────────────────────────────────────

export const hero: Section = {
  slug: "hero",
  kicker: "Case study",
  title: "Making DeFi legible to people who don't own crypto.",
  blocks: [
    {
      kind: "prose",
      text: "A PM's rebuild of a 2021 blockchain-course project. The goal: turn a demo only its builders could run into something a first-time visitor can understand and use without installing anything.",
    },
  ],
};

export const problem: Section = {
  slug: "problem",
  kicker: "Problem",
  title: "The original app worked. Almost nobody could try it.",
  blocks: [
    {
      kind: "prose",
      text: "The v1 was a working token-farming, payments and lending dApp that three of us built for IT465 Blockchain Technologies at NITK Surathkal in 2021 (I wrote the loan contract). The Solidity was correct, the React frontend worked, the tests passed. But the path from 'I want to see this' to 'I have interacted with it' looked like this:",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "Install MetaMask.",
        "Install Node.js and Ganache.",
        "Clone the repo, run `npm install`, run `truffle migrate`.",
        "Import a Ganache test account into MetaMask.",
        "Start the React dev server.",
        "Finally stake tokens, with rewards that only arrive when the project owner manually runs a script.",
      ],
    },
    {
      kind: "prose",
      text: "For a blockchain course, that was fine. For anything that wanted an audience (hiring managers, potential users, collaborators), the funnel dropped to zero at step one.",
    },
    {
      kind: "pull",
      text: "The original project was designed to be graded. I wanted to redesign it to be used.",
    },
  ],
};

export const diagnosis: Section = {
  slug: "whats-wrong",
  kicker: "Diagnosis",
  title: "What was wrong with v1.",
  blocks: [
    {
      kind: "prose",
      text: "Going back through v1 as someone who had never seen it, three problems stood out. This is my read of the old app, not a user study.",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "Friction to first interaction. Wallet install, a local chain, test tokens and gas, all before seeing anything.",
        "Vocabulary gap. Stake, collateral, liquidation, gas and approval are never explained to someone new to DeFi.",
        "Invisible feedback. Actions succeeded but nothing on screen acknowledged them, and rewards only showed up when the owner ran a payout script.",
      ],
    },
  ],
};

export const decisions: Section = {
  slug: "decisions",
  kicker: "Decisions",
  title: "Three decisions that shaped everything else.",
  blocks: [
    { kind: "heading", level: 2, text: "1. Default to a demo, not to a wallet." },
    {
      kind: "prose",
      text: "The homepage doesn't ask for a wallet. It offers a guided demo backed by a client-side simulation of the exact same contract math. One click: no install, no funding, no gas. The 'Connect wallet' path still exists for anyone who wants to verify on-chain. It is opt-in, and it never stands in the way.",
    },
    {
      kind: "tradeoff",
      chose: "In-browser simulation as the default surface",
      over: "Real testnet with a burner-wallet faucet",
      because:
        "A real testnet still needs an RPC, still has block times, still fails when faucets run dry. Removing the network entirely removes every failure mode that isn't part of the story I'm telling.",
    },
    { kind: "spacer" },

    { kind: "heading", level: 2, text: "2. Compress time, don't fake it." },
    {
      kind: "prose",
      text: "Rewards accrue continuously, every second, with the same math as the real contract. But in demo mode, the 'chain clock' runs 60× wall time, so the reward counter ticks visibly. The user sees the mechanism, just sped up. Tooltips explain what's happening: \u201cIn the real contract, 1 second here = 1 minute on-chain.\u201d",
    },
    {
      kind: "tradeoff",
      chose: "60× accelerated chain clock",
      over: "Fake rewards that increment on a timer",
      because:
        "The math is real. When a user later inspects the contract source or connects to Sepolia, the numbers add up. The demo was a sped-up version of the real thing.",
    },
    { kind: "spacer" },

    { kind: "heading", level: 2, text: "3. Explain during the action, not after." },
    {
      kind: "prose",
      text: "Instead of an upfront tutorial, every interactive surface carries inline explanations. Stake input: \u201cYou're depositing mDAI into the farm contract.\u201d Post-transaction: \u201cWhat just happened?\u201d panel with a mini token-flow diagram. Underlined terms open a glossary on hover. Users who already know DeFi ignore all of it. Newcomers get exactly the context they need, right when they need it.",
    },
    {
      kind: "tradeoff",
      chose: "Contextual inline education",
      over: "A dedicated tutorial / walkthrough video",
      because:
        "Tutorials get skipped. In-context explanation is the only kind people actually read.",
    },
  ],
};

export const metrics: Section = {
  slug: "metrics",
  kicker: "Success",
  title: "How I would measure if this worked.",
  blocks: [
    {
      kind: "prose",
      text: "If this were a real product with analytics, these are the metrics I would instrument and watch. The numbers below are targets I would set before launch. None of them are results.",
    },
    {
      kind: "metric",
      label: "Landing → first stake",
      value: "> 40%",
      context: "The headline funnel. Measured from unique visit to first staking transaction in demo mode.",
    },
    {
      kind: "metric",
      label: "Demo → wallet connection",
      value: "> 8%",
      context: "How many demo users felt compelled enough to try it on Sepolia. Signals depth of engagement.",
    },
    {
      kind: "metric",
      label: "First-action time",
      value: "< 90 s",
      context: "Time from landing to first successful stake. If this creeps up, the onboarding is getting in the way.",
    },
    {
      kind: "metric",
      label: "Glossary open rate",
      value: "Diagnostic",
      context: "A signal to watch, with no target. If more than 30% of users open a given term, it needs to be explained inline instead of behind a hover.",
    },
  ],
};

export const roadmap: Section = {
  slug: "roadmap",
  kicker: "Roadmap",
  title: "What I would ship next, and what I would leave out on purpose.",
  blocks: [
    { kind: "heading", level: 2, text: "Shipping next" },
    {
      kind: "list",
      items: [
        "A Chainlink price oracle on the LoanBook so collateral ratios are enforced dynamically, not fixed at loan creation.",
        "A subgraph to power a 'historical yield' chart, showing actual reward accrual across real users instead of the single-user demo.",
        "Gasless 'sign-in with Ethereum' so the Sepolia path doesn't require users to source testnet ETH.",
      ],
    },
    { kind: "heading", level: 2, text: "Explicitly out of scope" },
    {
      kind: "list",
      items: [
        "Multi-chain support. Ethereum + testnet is enough for the case study. Bridging is someone else's product.",
        "Governance tokens and on-chain voting. Nice demo, wrong project.",
        "A mobile app. Web covers the audience, and a wrapper adds scope without adding audience.",
      ],
    },
    {
      kind: "pull",
      text: "Saying no to features is the PM move I reach for most often. Everything I didn't ship here is a small note: what it was, why I cut it, what would bring it back.",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────

export const sections: Section[] = [hero, problem, diagnosis, decisions, metrics, roadmap];
