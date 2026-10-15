# DeFi App v3: Portfolio Edition

A PM portfolio case study on product-led design for decentralized finance. A from-scratch rebuild of a 2021 blockchain-course project ([the 2021 code](https://github.com/vaishnav-16/defi-app/tree/v1-2021), tagged `v1-2021`), rethought for the audience it never had: people who don't already own crypto.

**Live demo:** https://defi-legible.vercel.app (demo mode needs no wallet; switch to Sepolia to use the real contracts, and grab test mDAI from the header faucet)

**Live contracts on Ethereum Sepolia** (source verified on Sourcify):

| Contract | Address |
| --- | --- |
| DaiToken (mock DAI stablecoin, public faucet) | [0xfc62088332c78516744eA92c493d1B3cFdCB39cF](https://sepolia.etherscan.io/address/0xfc62088332c78516744eA92c493d1B3cFdCB39cF) |
| DappToken (reward token) | [0x9641F1EEE808DBa86Aa1571b38645e619516CFc1](https://sepolia.etherscan.io/address/0x9641F1EEE808DBa86Aa1571b38645e619516CFc1) |
| TokenFarm (staking) | [0x983Cf8095b7018B57d41750EeBd4A6AE5eae0422](https://sepolia.etherscan.io/address/0x983Cf8095b7018B57d41750EeBd4A6AE5eae0422) |
| LoanBook (P2P lending) | [0x297aBd7036d37DCa41e1b25a93cdA15441884A19](https://sepolia.etherscan.io/address/0x297aBd7036d37DCa41e1b25a93cdA15441884A19) |

---

## What this repo is

Three things braided together:

1. **A working DeFi app.** Solidity contracts (staking farm with Synthetix-style continuous rewards, P2P over-collateralized lending), ready to deploy to Sepolia.
2. **A client-side simulation of those contracts**, so any first-time visitor can try the full flow without installing a wallet or finding test ETH.
3. **A PM case study:** the decisions, tradeoffs, and metrics framed as a portfolio narrative.

It's one codebase that serves two audiences (recruiters and engineers) at the same time. See `ARCHITECTURE.md` for how that works.

---

## Structure

```
defi-app-v2/
├── README.md                    — you are here
├── ARCHITECTURE.md              — how the four workstreams fit together
├── HANDOFF.md                   — two-phase playbook (Claude Design → Claude Code)
├── contracts/                   — Hardhat + Solidity 0.8.24
│   ├── contracts/               — DaiToken, DappToken, TokenFarm, LoanBook
│   ├── test/                    — Full Mocha suites for both main contracts
│   └── scripts/deploy.ts        — Deploy + wire + address-book writer
└── frontend/                    — Vite + React 18 + TS + wagmi + RainbowKit
    └── src/
        ├── demo/                — Pure-TS simulation engine
        │   ├── engine.ts        — Reward math + loan reducers (mirrors Solidity)
        │   ├── clock.ts         — Accelerated chain clock
        │   ├── store.ts         — Subscribable store + React bindings
        │   └── engine.test.ts   — Unit tests of the math
        ├── lib/
        │   ├── mode.tsx         — demo / sepolia context
        │   ├── staking.ts       — Unified staking hooks (both modes)
        │   └── loans.ts         — Unified loan + transfer hooks
        ├── content/caseStudy.ts — Typed content blocks for the /case-study page
        ├── pages/
        │   ├── Landing.tsx      — Editorial hero, no wallet wall
        │   ├── CaseStudy.tsx    — The PM narrative, rendered from typed blocks
        │   ├── Stake.tsx        — Staking UI (both modes)
        │   ├── Send.tsx         — ERC-20 transfer
        │   └── Loans.tsx        — Lending UI with full state machine
        └── components/
            ├── NarrativeLayout.tsx  — Paper-theme wrapper (landing + case study)
            └── AppLayout.tsx        — Navy-theme wrapper (app routes)
```

---

## Running locally

```bash
npm install
npm run dev           # frontend on :3000, demo mode works instantly

# For Sepolia / on-chain testing:
npm run node          # terminal 2: local Hardhat node
npm run deploy:local  # terminal 3: deploy contracts, seeds test accounts
```

Then at http://localhost:3000, use the mode toggle in the nav to switch between demo and Sepolia.

---

## Workstream status

| Workstream | Status |
| --- | --- |
| A · PM narrative (Landing, Case Study) | ✅ Written, rendering, content in `content/caseStudy.ts` |
| B · Simulation engine | ✅ Complete + unit-tested |
| C · Guided experience | 🟡 Architected, not yet implemented (Tour, Explainer, Glossary, Concepts page) |
| D · Visual design | 🟢 System in place (Fraunces + Plex + JetBrains Mono, ochre/navy/paper palette), polish iteration pending |

Remaining work is tracked in `HANDOFF.md`, a two-phase playbook: Claude Design for visual exploration on the narrative pages + concept prototypes, then Claude Code for implementation, testing, and deployment.

---

## Commands

From the repo root:

| Command | What it does |
| --- | --- |
| `npm install` | Install both workspaces |
| `npm test` | Run Solidity contract tests |
| `npm run dev` | Start the frontend dev server |
| `npm run build` | Production build of the frontend |
| `npm run node` | Start a local Hardhat node |
| `npm run deploy:local` | Deploy contracts to the local node |
| `npm run deploy:sepolia` | Deploy to Sepolia (requires .env setup) |

In `frontend/`:

| Command | What it does |
| --- | --- |
| `npm run test` | Run simulation engine unit tests (vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run typecheck` | TypeScript check without emit |
| `npm run preview` | Preview production build |

---

## Credits

- Original project (v1): Vaishnav Ajai, Rohit B.V., Akash N., for IT465 Blockchain Technologies at NITK Surathkal (2021). Vaishnav wrote the loan contract.
- Original advisor: Dr. Bhawana Rudra
- v3 rebuild: Vaishnav Ajai, 2026
