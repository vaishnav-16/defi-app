# Architecture — v3 (Portfolio Edition)

> Read this before making changes. It explains _why_ the code is shaped the way it is, so future edits reinforce the thesis instead of fighting it.

---

## The thesis

This is simultaneously a **working DeFi app** and a **PM portfolio case study**. Every architectural decision serves both audiences:

| Decision | What a PM sees | What an engineer sees |
| --- | --- | --- |
| Demo mode by default | "I removed the #1 user friction" | Elegant in-browser state machine mirroring contract logic |
| Sepolia mode as opt-in | "I know when to simulate vs. ship real" | Actual deployed contracts, Etherscan links |
| Guided tour on first visit | "I understand onboarding" | Context-aware state machine keyed to user actions |
| Explainer panels post-tx | "Information hierarchy & progressive disclosure" | Real ABI decoding, event parsing |
| Editorial design | "I have taste" | Distinctive from the Tailwind dashboard template pack |

**If a change doesn't serve both audiences, reject it.**

---

## The four workstreams

### A. PM narrative layer

The story-telling surface. Pages:

- `/` — **Landing.** Not a connect-wallet wall. A framed problem, a clear value prop, one big "Try the demo" button.
- `/case-study` — **About.** The PM writeup: problem, diagnosis, design decisions, tradeoffs, metrics, roadmap. Structured like Linear's "Method" articles.
- `/concepts` — **DeFi primer.** Interactive explainers of staking, collateral, liquidation. Not text — mini-demos.
- `/roadmap` — What's shipping next, what's explicitly out-of-scope, why.

**Copy is a first-class artifact.** Keep narrative writing in `frontend/src/content/` as typed TS modules so it can be imported and version-controlled, not buried in JSX.

### B. Simulation engine

Lives in `frontend/src/demo/`. A plain TypeScript module — no React — that mirrors the behavior of `TokenFarm.sol` and `LoanBook.sol` exactly, including the Synthetix reward math and the loan state machine.

Key pieces:

- `clock.ts` — Accelerated chain clock. `1 real second = N chain seconds`, configurable. Defaults to 60× so one minute of rewards accrues in one second of wall time.
- `engine.ts` — State + reducers. Pure functions mutating an immutable store.
- `store.ts` — Subscribable store. React components subscribe via `useSyncExternalStore`.
- `types.ts` — Shared types.
- `seed.ts` — Initial state: pre-funds the user with 1000 mDAI, plants two seed loan offers from "other users" so the borrow flow works out of the box.

**Invariant:** the engine never imports from React. It can be tested in isolation and — if we ever want to — swapped for the @ethereumjs/vm variant without touching UI code.

### C. Guided experience

A tour system keyed to user state, not linear step-through. The tour watches what the user has done (via the store's subscription) and surfaces the next relevant prompt. If the user clicks "stake" before the tour says to, the tour skips ahead rather than blocking.

Components:

- `Tour.tsx` — Floating prompt anchored to a DOM element, with "next" / "skip tour" controls.
- `Explainer.tsx` — Post-transaction panel: "What just happened?" with a 1-sentence summary, a mini-diagram, and a disclosure for the technical receipt.
- `Glossary.tsx` — Underlined terms throughout the UI with hover definitions from `data/glossary.ts`.

### D. Visual design

**Aesthetic direction: editorial–financial.** Not dashboard-y. Not Stripe-generic. Think Financial Times Weekend × Stripe Press × Linear's method series:

- Typography: a confident serif for display (Fraunces or IBM Plex Serif), a neutral sans for body (IBM Plex Sans), a mono for numbers (JetBrains Mono). **No Inter.**
- Palette: warm off-white (`#faf7f2`) for case study pages; deep editorial navy (`#0b1220`) for the app; high-contrast ochre and terracotta for accents rather than generic brand-blue.
- Numbers always tabular-mono. Financial apps that use proportional numerals for figures feel amateurish.
- Motion: restrained. One considered page-load choreography per route. No bounce. No confetti.
- Layout: grid-aware, asymmetric where it adds information, never for decoration.

---

## Mode routing

A single React context decides whether hooks hit the simulation engine or wagmi.

```ts
type AppMode = "demo" | "sepolia";

// frontend/src/lib/mode.ts exports:
useAppMode(): AppMode
useSetAppMode(): (m: AppMode) => void

// Pages call unified hooks that internally branch:
useStakingView(address)  // returns { balance, staked, earned, ... }
useStakingActions()      // returns { stake, unstake, claim, exit }
```

The mode switch persists in `localStorage`. Default is `demo`.

---

## Content structure for the case study

The About page is broken into typed sections so it's trivial to reorder or A/B test framing:

```
content/case-study/
├── hero.ts         // title, subtitle, TL;DR
├── problem.ts      // what was wrong with v1
├── diagnosis.ts    // what was wrong with v1
├── decisions.ts    // design decisions with tradeoff tables
├── metrics.ts      // what success looks like
├── roadmap.ts      // what's next
└── index.ts        // composes them
```

Each section exports `{ slug, title, blocks: Block[] }` where `Block` is a discriminated union (`"prose" | "quote" | "metric" | "tradeoff" | "figure"`). The page renders them with a typed renderer. Adding a new block type requires adding a renderer branch, enforced by the compiler.

---

## Handoff points for Claude Code

Where Claude Code (with the `frontend-design` skill) picks up better than I can:

1. **Visual iteration with live preview.** I can write the scaffolding and hand-pick a visual direction, but pixel-level refinement is faster with a running `npm run dev`.
2. **Motion polish.** Spring timings, stagger values, easing curves — best tuned against the running app.
3. **Responsive verification.** Testing every breakpoint requires a browser.
4. **A11y audit.** Contrast ratios, keyboard flow, focus rings.
5. **Deploy + preview URLs** (Vercel).

Where I can help better than Claude Code:

1. **Narrative writing.** The case study copy.
2. **Simulation engine correctness.** Math must match the on-chain contracts.
3. **Type-level design.** Making illegal states unrepresentable.

---

## What's explicitly out of scope

Writing this down so it doesn't scope-creep:

- Multi-chain support beyond Hardhat local + Sepolia.
- A real backend (no Node server, no database). Everything is static + client-side.
- Account abstraction / paymasters. Sepolia mode requires the user to have their own Sepolia ETH. The landing copy acknowledges this.
- Governance tokens, LP pools, yield-aggregation strategies. This is a case study, not a protocol launch.
