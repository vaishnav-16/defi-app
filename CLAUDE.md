# Project context for Claude Code

> Auto-loaded by Claude Code as standing context. Read before responding to any task.

---

## What this project is

**A working DeFi web app** that doubles as a PM portfolio piece. A visitor can stake mDAI, earn DAPP rewards continuously, send tokens, and take/repay/liquidate over-collateralized loans — all in their browser, with no wallet, no install, no setup.

The product IS the portfolio piece. The case-study page is *supporting* framing; the app is the deliverable. If a refactor improves the case-study page at the expense of the app's polish, reject it.

---

## What's important, in order

1. **The Stake page experience.** The moment a visitor watches their *Earned DAPP* number tick up is the moment the project justifies itself. Spend disproportionate care here.
2. **The walkthrough.** The `Tour` component guides first-time visitors through staking → earning → claiming. Without it, the app is a maze. The `Explainer` component pops a "what just happened?" panel after every transaction.
3. **The Concepts page.** Three interactive widgets (reward accrual, pool splitting, liquidation timeline) that teach the underlying mechanics by being playable. Lives at `/concepts`.
4. **The Send and Loans pages.** Functional, coherent. Polish secondary to Stake.
5. **The Landing page.** A doorway. Earns the click, then gets out of the way.
6. **The About page** (`/about` and `/case-study`). The PM narrative — problem, decisions, tradeoffs. Read by maybe 30% of visitors; the ones who read it are the ones considering hiring you.

---

## Tech stack

- **Contracts:** Solidity 0.8.24, OpenZeppelin 5.x, Hardhat
- **Frontend:** Vite, React 18, TypeScript, Tailwind, wagmi 2.x, viem, RainbowKit, React Router v6, vitest
- **Simulation engine** (the "demo mode" backend): hand-rolled TS state machine, no dependencies, lives in `frontend/src/demo/`

---

## File map

| Working on… | Look in… |
| --- | --- |
| Smart contracts | `contracts/contracts/*.sol` |
| Contract tests | `contracts/test/*.test.ts` |
| In-browser simulation logic | `frontend/src/demo/engine.ts` |
| Mode routing (demo / sepolia) | `frontend/src/lib/mode.tsx` |
| Unified hooks (work in both modes) | `frontend/src/lib/staking.ts` and `loans.ts` |
| App pages | `frontend/src/pages/Stake.tsx`, `Send.tsx`, `Loans.tsx` |
| Narrative pages | `frontend/src/pages/Landing.tsx`, `Concepts.tsx`, `CaseStudy.tsx` |
| Guided experience | `frontend/src/components/Tour.tsx`, `Explainer.tsx`, `Term.tsx` |
| Tour step definitions | `frontend/src/data/tours.ts` |
| Glossary terms | `frontend/src/components/Term.tsx` (definitions inline) |
| Layouts | `frontend/src/components/NarrativeLayout.tsx` and `AppLayout.tsx` |
| Design tokens | `frontend/tailwind.config.js` and `frontend/src/index.css` |
| Case study content (typed blocks) | `frontend/src/content/caseStudy.ts` |
| Copy voice rules | `docs/COPY_VOICE.md` |
| Workflow + prompts | `HANDOFF.md` |

---

## Common commands

```bash
# Repo root
npm install
npm run dev                  # frontend on :3000
npm test                     # contract tests
npm run deploy:local         # deploy contracts

# frontend/
npm test                     # simulation engine unit tests (vitest)
npm run typecheck
npm run build
```

---

## Non-negotiable conventions

### Architecture
- **Demo mode is the default.** First-time visitors must NEVER hit a wallet wall.
- **Pages use unified hooks** (`useStakingView`, `useStakingActions`, `useLoansView`, `useLoanActions`, `useTransferView`, `useTransferActions`). Pages don't import `useReadContract` or call the demo store directly.
- **The simulation engine is React-free.** Test reducers by calling them directly.
- **Concepts widgets must call real engine functions** (`earned()`, `rewardPerToken()`). Don't invent parallel math.

### Tour + Explainer
- The Tour anchors to `data-tour="..."` attributes on real elements. When refactoring a page, preserve these attributes.
- Tour completion is keyed to user actions watched via the demo store's `onEvent` subscription. Don't add fake "completed" flags.
- The Explainer subscribes to the same event stream — if you add a new domain event, add a case to `describeEvent()` in `Explainer.tsx`.

### Design
- **Fonts: Fraunces (display serif), IBM Plex Sans (body), JetBrains Mono (data).** Don't introduce others.
- **No purple gradients, glassmorphism, or shadcn defaults.** Aesthetic is editorial-financial.
- **Two themes:** paper (cream `#faf7f2`) for narrative routes (`/`, `/concepts`, `/about`); navy (`#0b1220`) for app routes (`/app/*`). Don't homogenize.
- **Numbers are always tabular-mono.** `className="tabular"`.

### Copy
Match `docs/COPY_VOICE.md`. Banned-words list is strict.

### Tests
- Verification before completion. Don't claim "fixed" or "done" without running the verifying command.
- Simulation engine changes require updating `frontend/src/demo/engine.test.ts`.

---

## What's a scaffold vs. what's polished

The components below were built as **scaffolds** — functional but visually unpolished. Polish them with `compound-engineering:frontend-design` against the running dev server:

- `Tour.tsx` — works mechanically; visual treatment needs care (the coach mark currently has a red ring marker as a scaffold flag — remove `SCAFFOLD = true` and the ring class)
- `Explainer.tsx` — works mechanically; the panel design needs refinement
- `Concepts.tsx` — math is real; layout/typography needs tuning
- The Stake page — functional; the *Earned DAPP* moment is the highest-value polish target on the whole project

---

## When in doubt

Re-read the priorities list. If a change improves the case-study page at the expense of the app's polish, you're optimizing the wrong surface.
