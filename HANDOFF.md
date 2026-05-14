# Ship Playbook

> Concise. Read once. Execute.

The deliverable is a **working DeFi web app**. The case-study page is supporting framing, not the main event. Polish where users spend time — the Stake page, the walkthrough, the Concepts page widgets.

---

## What's in the box

- ✅ Smart contracts, modernized to Solidity 0.8.24, fully tested
- ✅ In-browser simulation engine mirroring the contracts (with unit tests)
- ✅ Mode routing (demo / sepolia), unified hooks across pages
- ✅ All five pages render and work: Landing, Concepts (new), About, Stake, Send, Loans
- ✅ Tour + Explainer + Term components scaffolded and mounted in `AppLayout`
- ✅ `tours.ts` step definitions, glossary inline in `Term.tsx`
- ✅ Editorial design system baseline (Fraunces + Plex + JetBrains, paper/navy/ochre)

---

## What's left, in priority order

| # | Surface | Why it matters | Tool |
| --- | --- | --- | --- |
| 1 | **Stake page polish** — especially the *Earned DAPP* live counter | The moment that justifies the whole simulation. Must feel revelatory. | Claude Design |
| 2 | **Tour + Explainer visual polish** | Currently scaffolds with a red ring marker. Needs proper editorial treatment. | Claude Code |
| 3 | **Concepts page polish** | Math is real; layout and motion need tuning. | Claude Code |
| 4 | **Landing page polish** | The doorway. Already in progress in Claude Design. | Claude Design |
| 5 | **Send + Loans page polish** | Functional. Style alignment with Stake. | Claude Code |
| 6 | **About page rewrite** | Current draft is in *my* voice. Rewrite in *yours*. | You |
| 7 | **Deploy + demo reel** | Vercel + a GIF embedded in README. | Claude Code |

---

## Phase 1 · Claude Design (one project, sequential targets)

**Setup once:**

1. `claude.ai/design` → new project, link the GitHub repo, attach `docs/COPY_VOICE.md`.
2. Refine + lock the design system. Prompt:

> Set up the design system for an editorial-financial DeFi portfolio app. Type stack is Fraunces / IBM Plex Sans / JetBrains Mono. Palette is paper (#faf7f2), navy (#0b1220), ochre (#c77a2a). Two themes: paper for narrative pages, navy for app pages.
>
> Audit the current tokens in `tailwind.config.js`. Tell me the three weakest moves with specific replacements. Lock the refined system to this project.

Export bundle → `./bundles/design-system/`.

**Then tackle targets in priority order** (start with whichever fits your budget):

**Target A · Stake page** (highest priority — see prompt at the bottom of this file)
**Target B · Landing page** (already in progress in your project — direction "Front Matter, No. 01")
**Target C · About / Case Study layout** (lowest priority; defer if budget tight)

Export each target's handoff bundle → `./bundles/<name>/`.

---

## Phase 2 · Claude Code

Open the project. CLAUDE.md auto-loads. Run `npm install && npm run dev` to verify boot. Then, **one fresh conversation per task**:

### Task 1 · Apply the design system bundle
> Attach `./bundles/design-system/`. Use `compound-engineering:frontend-design` to apply the updated tokens to `tailwind.config.js` and `index.css`. Walk through every route afterward to verify nothing breaks.

### Task 2 · Apply the Stake page bundle
> Attach `./bundles/stake/`. Use `compound-engineering:frontend-design`. Apply to `frontend/src/pages/Stake.tsx`. Preserve all `useStakingView`, `useStakingActions` calls verbatim. Preserve all `data-tour="..."` attributes — the Tour component anchors to them. The *Earned DAPP* number is the single most important polish target on this page.

### Task 3 · Apply the Landing page bundle (when ready)
> Attach `./bundles/landing/`. Use `compound-engineering:frontend-design`. Apply to `frontend/src/pages/Landing.tsx`. Preserve `useSetAppMode()` and the `launchDemo` handler verbatim.

### Task 4 · Polish the Tour and Explainer
> Use `compound-engineering:frontend-design`. The Tour component (`frontend/src/components/Tour.tsx`) and Explainer (`frontend/src/components/Explainer.tsx`) are scaffolds — they work mechanically but the visual treatment is rough. The Tour currently has a red ring scaffold marker; remove the `SCAFFOLD = true` flag and the rose-500 ring class. Match the editorial-financial design system. The coach mark should feel like a margin annotation in a finely-set book, not a SaaS onboarding popup.

### Task 5 · Polish the Concepts page
> Use `compound-engineering:frontend-design`. `frontend/src/pages/Concepts.tsx` has three working interactive widgets (reward accrual, pool splitting, liquidation timeline). The math is real — each widget calls the simulation engine directly. Don't change the math; tune the layout, typography, slider styling, and any motion on number changes. Match Landing's typographic rhythm.

### Task 6 · Polish Send and Loans pages
> Use `compound-engineering:frontend-design`. `Send.tsx` and `Loans.tsx` are functional but visually generic. Bring them into stylistic alignment with the refined Stake page.

### Task 7 · Verify
> Use `superpowers:verification-before-completion`. Run with output evidence:
> - `cd contracts && npm test`
> - `cd frontend && npm test`
> - `cd frontend && npm run typecheck`
> - `cd frontend && npm run build`
> - Manual demo flow: stake → wait → claim → send → offer loan → take Alice's loan → repay.

### Task 8 · Demo reel + deploy
> Use `compound-engineering:ce-demo-reel` to capture a 30-60s GIF of the staking → earning → claiming loop. Embed in README and Landing. Deploy `frontend/` to Vercel. Use `compound-engineering:git-commit-push-pr` to ship a PR titled "v3: Portfolio edition."

---

## You (the human, one focused hour)

Rewrite `frontend/src/content/caseStudy.ts` in your voice. The structure (problem, research, decisions, metrics, roadmap) is sound. The words are mine. Replace them with your specific experience of building the original 2021 project and what you'd actually change today. This is the hour that makes the case study read like a portfolio piece instead of a template.

Use `docs/COPY_VOICE.md` as the voice guide.

---

## The Stake page prompt for Claude Design

```
Continuing from the Front Matter, No. 01 direction. Now design the
Stake page (`frontend/src/pages/Stake.tsx`) — the first surface a visitor
sees after clicking "Launch demo." The visual language should feel like
the same publication, adapted to a functional instrument in the navy
app theme (`data-theme="app"`).

This is a polish pass, not a redesign. Structure stays: four stats
(Wallet mDAI / Staked / Earned DAPP / Wallet DAPP), one input field
with a Max shortcut, four action buttons (Stake / Unstake amount /
Claim rewards / Exit everything).

The single most important moment is the *Earned DAPP* stat. In demo
mode it ticks every second (chain clock runs at 60×). Right now it's
a number with a small dot. It needs gravity. Think odometer rolling,
stopwatch settling, ticker tape; not blinking, not pulsing, not
flashing. Whatever treatment you choose, the digit that's changing
should be the one that draws the eye.

Four states to design:
1. Empty — nothing staked. Input feels like an invitation.
2. Confirming — ~250ms between Stake pressed and balance updated.
3. Active — staked, rewards accruing. Earned DAPP is the centerpiece.
4. Exit — both balances animate to zero, settling not collapsing.

Non-negotiables:
- Navy theme stays.
- All four action buttons remain visible and labeled.
- The `data-tour="wallet-balance"`, `data-tour="earned"`, `data-tour="stake-input"`, and `data-tour="claim-action"` attributes on existing elements must be preserved — the Tour component anchors to them.
- The AppLayout header is shared with other app routes; don't redesign it.

One strong direction first. Then refine.
```

---

That's it. Ship.
