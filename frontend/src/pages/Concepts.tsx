import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { Link } from "react-router-dom";
import { rewardPerToken, earned } from "@/demo/engine";
import { Term } from "@/components/Term";
import type { DemoState } from "@/demo/types";
import { DEMO_ADDRESSES } from "@/demo/types";

export default function Concepts() {
  return (
    <article className="paper-bg">
      <header className="max-w-[1080px] mx-auto px-6 md:px-16 pt-40 pb-44">
        <p className="kicker mb-9 animate-fade-in">Reference</p>
        <h1 className="font-display font-medium text-[clamp(40px,5.6vw,84px)] leading-[0.98] tracking-[-0.028em] text-ink-900 text-balance mb-14 animate-rise-in [animation-delay:120ms]">
          Three concepts,{" "}
          <span className="italic text-ochre-deep">three small</span>{" "}
          experiments.
        </h1>
        <p className="font-display text-[20px] leading-[1.5] text-ink-500 max-w-[36rem] animate-rise-in [animation-delay:240ms]">
          The DeFi app uses three ideas that are easier to feel than to read
          about. Drag the sliders. Watch what happens. Each widget is the same
          math the live app runs — just paused, controllable, and unhurried.
        </p>
      </header>

      <div className="rule max-w-[1080px] mx-auto" />

      <RewardAccrualWidget />
      <div className="rule max-w-[1080px] mx-auto" />
      <PoolSplitWidget />
      <div className="rule max-w-[1080px] mx-auto" />
      <LiquidationWidget />

      <section className="max-w-[1080px] mx-auto px-6 md:px-16 pb-52">
        <div className="max-w-[880px]">
          <p className="kicker mb-6">Try it</p>
          <h2 className="font-display font-medium text-[clamp(36px,4.5vw,64px)] leading-none tracking-[-0.024em] text-balance mb-9">
            Same math.{" "}
            <span className="italic text-ochre-deep">Live contract.</span>
          </h2>
          <p className="font-display text-[18px] leading-[1.5] text-ink-500 max-w-[36rem] mb-12">
            Everything you just dragged runs identically on Sepolia. One click
            to switch from demo to testnet — no install, no faucet required.
          </p>
          <Link
            to="/app"
            className="group inline-flex items-center gap-3.5 bg-ink-900 text-paper px-7 py-[18px] rounded-sm text-base font-medium hover:bg-ochre-deep transition-colors"
          >
            <span>Try it in the app</span>
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </section>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Widget 1 · Reward accrual
// Calls engine.earned() directly. Drag time, watch DAPP accumulate.
// ──────────────────────────────────────────────────────────────────────────────

function RewardAccrualWidget() {
  const [stake, setStake] = useState(100); // mDAI
  const [elapsed, setElapsed] = useState(60); // seconds

  // Build a one-staker simulation state and ask the real engine what they've earned.
  const state: DemoState = {
    user: DEMO_ADDRESSES.user,
    daiBalances: {},
    dappBalances: {},
    ethBalances: {},
    stakedBalance: { [DEMO_ADDRESSES.user]: parseEther(stake.toString()) },
    totalStaked: parseEther(stake.toString()),
    rewardRate: 10n ** 16n, // 0.01 DAPP/sec — same as live demo
    rewardPerTokenStored: 0n,
    lastUpdateTime: 0n,
    rewardAccounts: {},
    loans: [],
    nextLoanId: 0n,
    chainTime: 0n,
    txCount: 0,
  };
  const reward = earned(state, DEMO_ADDRESSES.user, BigInt(elapsed));

  return (
    <section className="max-w-[1080px] mx-auto px-6 md:px-16 py-20 grid grid-cols-12 gap-8">
      <header className="col-span-12 md:col-span-4">
        <p className="kicker mb-6">§ 01 · Accrual</p>
        <h2 className="font-display font-medium text-[26px] leading-[1.2] tracking-[-0.012em] text-balance max-w-[18ch] mb-5">
          Rewards grow with{" "}
          <span className="italic text-ochre-deep">time</span>, not with effort.
        </h2>
        <p className="text-ink-500 text-base leading-[1.65] max-w-[32ch]">
          Once tokens are <Term>staked</Term>, the contract pays out
          continuously. You don't have to do anything. The bigger the stake, the
          bigger your share of the per-second flow.
        </p>
      </header>
      <div className="col-span-12 md:col-span-8 fin-card !bg-paper-soft p-8">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="kicker block mb-4">Stake (mDAI)</label>
            <div className="relative py-3">
              <input
                type="range"
                min="10"
                max="500"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                className="concepts-slider"
                style={
                  {
                    "--track-fill": `${((stake - 10) / (500 - 10)) * 100}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <p className="tabular text-2xl text-ink-900 mt-1">{stake}</p>
          </div>
          <div>
            <label className="kicker block mb-4">Time elapsed (seconds)</label>
            <div className="relative py-3">
              <input
                type="range"
                min="0"
                max="3600"
                value={elapsed}
                onChange={(e) => setElapsed(Number(e.target.value))}
                className="concepts-slider"
                style={
                  {
                    "--track-fill": `${(elapsed / 3600) * 100}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <p className="tabular text-2xl text-ink-900 mt-1">
              {elapsed >= 60
                ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
                : `${elapsed}s`}
            </p>
          </div>
        </div>
        <div className="border-t border-paper-rule pt-6">
          <p className="kicker mb-2">Earned</p>
          <p
            key={Math.round(Number(reward) / 1e15)}
            className="tabular text-display-sm text-ochre-deep animate-rise-in"
          >
            {formatEther(reward).slice(0, 8)} DAPP
          </p>
          <p className="text-xs text-ink-500 mt-2 font-mono">
            Computed by calling <code>engine.earned()</code> — the same
            function the live app uses.
          </p>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Widget 2 · Pool splitting
// Two stakers. Shared per-second pool. Slide either amount, watch the split.
// ──────────────────────────────────────────────────────────────────────────────

function PoolSplitWidget() {
  const [aliceStake, setAliceStake] = useState(100);
  const [bobStake, setBobStake] = useState(300);
  const total = aliceStake + bobStake;
  const alicePct = total > 0 ? (aliceStake / total) * 100 : 0;
  const bobPct = total > 0 ? (bobStake / total) * 100 : 0;

  // Per-second reward for each, using the real rewardPerToken formula.
  const rewardRate = 10n ** 16n;
  const state: DemoState = {
    user: DEMO_ADDRESSES.user,
    daiBalances: {},
    dappBalances: {},
    ethBalances: {},
    stakedBalance: {},
    totalStaked: parseEther(total.toString()),
    rewardRate,
    rewardPerTokenStored: 0n,
    lastUpdateTime: 0n,
    rewardAccounts: {},
    loans: [],
    nextLoanId: 0n,
    chainTime: 0n,
    txCount: 0,
  };
  const rpt = rewardPerToken(state, 1n); // per-second
  const aliceFlow = (parseEther(aliceStake.toString()) * rpt) / 10n ** 18n;
  const bobFlow = (parseEther(bobStake.toString()) * rpt) / 10n ** 18n;

  return (
    <section className="max-w-[1080px] mx-auto px-6 md:px-16 py-20 grid grid-cols-12 gap-8">
      <header className="col-span-12 md:col-span-4">
        <p className="kicker mb-6">§ 02 · Pool</p>
        <h2 className="font-display font-medium text-[26px] leading-[1.2] tracking-[-0.012em] text-balance max-w-[18ch] mb-5">
          The rewards are a{" "}
          <span className="italic text-ochre-deep">shared</span> pool, not a
          per-user bonus.
        </h2>
        <p className="text-ink-500 text-base leading-[1.65] max-w-[32ch]">
          Each second, the contract releases a fixed amount of DAPP. Stakers
          split it by share of the total. Two stakers, equal shares: equal
          rewards. Add more stakers: everyone's slice gets thinner.
        </p>
      </header>
      <div className="col-span-12 md:col-span-8 fin-card !bg-paper-soft p-8">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="kicker block mb-4">Alice's stake</label>
            <div className="relative py-3">
              <input
                type="range"
                min="0"
                max="500"
                value={aliceStake}
                onChange={(e) => setAliceStake(Number(e.target.value))}
                className="concepts-slider"
                style={
                  {
                    "--track-fill": `${(aliceStake / 500) * 100}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <p className="tabular text-xl text-ink-900 mt-1">
              {aliceStake} mDAI
            </p>
          </div>
          <div>
            <label className="kicker block mb-4">Bob's stake</label>
            <div className="relative py-3">
              <input
                type="range"
                min="0"
                max="500"
                value={bobStake}
                onChange={(e) => setBobStake(Number(e.target.value))}
                className="concepts-slider"
                style={
                  {
                    "--track-fill": `${(bobStake / 500) * 100}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <p className="tabular text-xl text-ink-900 mt-1">{bobStake} mDAI</p>
          </div>
        </div>

        {/* Stacked bar showing the split */}
        <div className="mb-6">
          <p className="kicker mb-3">Reward share</p>
          <div className="flex h-10 rounded-sm overflow-hidden border border-paper-rule">
            <div
              className="bg-ochre transition-all duration-300"
              style={{ width: `${alicePct}%` }}
              title={`Alice: ${alicePct.toFixed(1)}%`}
            />
            <div
              className="bg-sage transition-all duration-300"
              style={{ width: `${bobPct}%` }}
              title={`Bob: ${bobPct.toFixed(1)}%`}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-ink-500 mt-2">
            <span key={Math.round(alicePct)} className="animate-rise-in inline-block">
              Alice{" "}
              <span className="text-ochre-deep">{alicePct.toFixed(1)}%</span> ·{" "}
              {formatEther(aliceFlow).slice(0, 7)} DAPP/sec
            </span>
            <span key={Math.round(bobPct)} className="animate-rise-in inline-block">
              Bob{" "}
              <span className="text-sage">{bobPct.toFixed(1)}%</span> ·{" "}
              {formatEther(bobFlow).slice(0, 7)} DAPP/sec
            </span>
          </div>
        </div>

        <p className="text-xs text-ink-500 font-mono">
          Computed by calling <code>engine.rewardPerToken()</code> — same
          function the live app uses.
        </p>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Widget 3 · Liquidation timeline
// Time slider crosses the deadline. Borrower's option / Lender's option switch.
// ──────────────────────────────────────────────────────────────────────────────

function LiquidationWidget() {
  const duration = 7 * 24 * 60 * 60; // 7 days
  const [t, setT] = useState(duration / 2); // current time within the loan
  const pastDue = t >= duration;

  const daysIn = Math.floor(t / 86400);
  const hoursIn = Math.floor((t % 86400) / 3600);

  return (
    <section className="max-w-[1080px] mx-auto px-6 md:px-16 py-20 grid grid-cols-12 gap-8">
      <header className="col-span-12 md:col-span-4">
        <p className="kicker mb-6">§ 03 · Deadline</p>
        <h2 className="font-display font-medium text-[26px] leading-[1.2] tracking-[-0.012em] text-balance max-w-[18ch] mb-5">
          Before the{" "}
          <span className="italic text-ochre-deep">deadline</span>, only the
          borrower can act. After, only the lender.
        </h2>
        <p className="text-ink-500 text-base leading-[1.65] max-w-[32ch]">
          That's the whole over-collateralization mechanism. The borrower has
          an incentive to repay because the <Term>collateral</Term> is worth
          more than the loan. The lender has an incentive to wait because they
          earn a fee on repayment — and a backstop if the borrower vanishes:{" "}
          <Term>liquidation</Term>.
        </p>
      </header>
      <div className="col-span-12 md:col-span-8 fin-card !bg-paper-soft p-8">
        <div className="mb-8">
          <label className="kicker block mb-4">Time since loan taken</label>
          <div className="relative py-3">
            <input
              type="range"
              min="0"
              max={duration}
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
              className="concepts-slider"
              style={
                {
                  "--track-fill": `${(t / duration) * 100}%`,
                } as React.CSSProperties
              }
            />
            {/* Deadline tick mark at day 7 */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none flex flex-col items-center">
              <div
                className={`w-px h-5 transition-colors duration-300 ${
                  pastDue ? "bg-terracotta" : "bg-ink-300"
                }`}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs font-mono text-ink-500 mt-2">
            <span>Day 0 · taken</span>
            <span
              className={`transition-colors duration-300 ${
                pastDue ? "text-terracotta font-medium" : "text-ochre-deep"
              }`}
            >
              Day 7 · deadline{pastDue ? " ⟵ crossed" : ""}
            </span>
          </div>
          <p
            key={Math.floor(t / 3600)}
            className="tabular text-2xl text-ink-900 mt-3 animate-rise-in"
          >
            Day {daysIn}, hour {hoursIn}
          </p>
        </div>

        <div className="border-t border-paper-rule pt-6 grid grid-cols-2 gap-6">
          <div
            className={`transition-all duration-500 rounded-sm p-3 -m-3 ${
              pastDue ? "opacity-30" : "opacity-100"
            }`}
          >
            <p className="kicker mb-2">Borrower can:</p>
            <p className="font-display text-lg text-ink-900">Repay</p>
            <p className="text-xs text-ink-500 mt-1">
              Pay principal + fee, get collateral back.
            </p>
          </div>
          <div
            className={`transition-all duration-500 rounded-sm p-3 -m-3 ${
              pastDue
                ? "opacity-100 bg-terracotta/[0.06] ring-1 ring-terracotta/20"
                : "opacity-30"
            }`}
          >
            <p className="kicker mb-2">Lender can:</p>
            <p
              className={`font-display text-lg transition-colors duration-300 ${
                pastDue ? "text-terracotta" : "text-ink-900"
              }`}
            >
              Liquidate
            </p>
            <p className="text-xs text-ink-500 mt-1">
              Take the collateral ETH. The loan ends.
            </p>
          </div>
        </div>

        <p className="text-xs text-ink-500 font-mono mt-6">
          Loan state machine from <code>LoanBook.sol</code>: Offered → Taken →
          (Repaid | Liquidated). Current phase:{" "}
          <span
            className={`transition-colors duration-300 ${
              pastDue ? "text-terracotta" : "text-ochre-deep"
            }`}
          >
            {pastDue ? "lender controls" : "borrower controls"}
          </span>
        </p>
      </div>
    </section>
  );
}
