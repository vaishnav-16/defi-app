import { Link, useNavigate } from "react-router-dom";
import { useSetAppMode } from "@/lib/mode";

/**
 * Landing — Front Matter (sparser direction).
 *
 * Editorial-financial, Stripe-Press confidence. Single column, generous top
 * margin, no masthead chrome. The italic ochre "legible" is the only accent
 * in the hero. The hover moment lives on the stats strip: each cell reveals
 * a JetBrains-Mono footnote with the measurement context.
 *
 * Surrounding chrome (wordmark + nav) lives in NarrativeLayout, not here.
 */
export default function Landing() {
  const setMode = useSetAppMode();
  const navigate = useNavigate();

  const launchDemo = () => {
    setMode("demo");
    navigate("/app");
  };

  return (
    <div className="paper-bg">
      {/* ───────────── Hero ───────────── */}
      <section className="max-w-[1080px] mx-auto px-16 pt-40 pb-44">
        <div className="max-w-[880px]">
          <p className="kicker mb-9 animate-fade-in">Case study · 2026</p>

          <h1 className="font-display font-medium text-[clamp(56px,7.6vw,108px)] leading-[0.98] tracking-[-0.028em] text-ink-900 text-pretty mb-14 animate-rise-in [animation-delay:120ms]">
            Making&nbsp;DeFi <span className="italic font-medium text-ochre-deep">legible</span>
            <br />
            to people who don't
            <br />
            own crypto.
          </h1>

          <p className="font-display text-[22px] md:text-[24px] leading-[1.4] text-ink-700 max-w-[36rem] mb-16 animate-rise-in [animation-delay:240ms]">
            A rebuild of a 2021 blockchain-course project. The original was a functional
            dApp that almost nobody could try — six install steps before the first click.
            This version reduces that to one.
          </p>

          <div className="flex flex-wrap items-center gap-8 mb-6 animate-rise-in [animation-delay:360ms]">
            <button
              onClick={launchDemo}
              className="group inline-flex items-center gap-3.5 bg-ink-900 text-paper px-7 py-[18px] rounded-sm text-base font-medium hover:bg-ochre-deep transition-colors"
            >
              <span>Launch interactive demo</span>
              <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
            <Link to="/case-study" className="link text-[17px]">
              Read the case study
            </Link>
          </div>

          <p className="font-mono text-xs text-ink-500 animate-fade-in [animation-delay:480ms]">
            No wallet required &nbsp;·&nbsp; No install &nbsp;·&nbsp; Runs in the browser
          </p>
        </div>
      </section>

      {/* ───────────── Three columns ───────────── */}
      <section className="max-w-[1080px] mx-auto px-16 pt-16 pb-44">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-12">
          <article>
            <p className="kicker mb-6">The v1</p>
            <h3 className="font-display font-medium text-[26px] leading-[1.2] tracking-[-0.012em] text-balance max-w-[18ch] mb-5">
              A course project that worked — for graders.
            </h3>
            <p className="text-ink-500 text-base leading-[1.65] max-w-[32ch]">
              Solidity, React, Truffle. Token staking, ERC-20 transfers, over-collateralized
              P2P loans. Correct, tested, and{" "}
              <span className="italic text-ink-700">completely inaccessible to a non-developer</span>.
            </p>
          </article>
          <article>
            <p className="kicker mb-6">The problem</p>
            <h3 className="font-display font-medium text-[26px] leading-[1.2] tracking-[-0.012em] text-balance max-w-[18ch] mb-5">
              Every step before first interaction costs 60% of visitors.
            </h3>
            <p className="text-ink-500 text-base leading-[1.65] max-w-[32ch]">
              Install MetaMask. Find a faucet. Decipher jargon. Wait for blocks. By the time
              most people stake their first token, they have already left.
            </p>
          </article>
          <article>
            <p className="kicker mb-6">The v2</p>
            <h3 className="font-display font-medium text-[26px] leading-[1.2] tracking-[-0.012em] text-balance max-w-[18ch] mb-5">
              An in-browser simulation of the real contract logic.
            </h3>
            <p className="text-ink-500 text-base leading-[1.65] max-w-[32ch]">
              Same staking math, same lending state machine — running entirely client-side,
              with an accelerated chain clock so rewards tick visibly. The real Sepolia
              version is one click away.
            </p>
          </article>
        </div>
      </section>

      {/* ───────────── By the numbers ───────────── */}
      <section className="max-w-[1080px] mx-auto px-16 pb-44">
        <p className="kicker mb-14">By the numbers · v1 → v2</p>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-paper-rule">
          <Stat n="01" label="Steps to stake" before="6" after="1" note="v1 → v2"
                footnote="From cold-start landing to first staking transaction confirmed. v1 required MetaMask, a faucet, and a network switch." />
          <Stat n="02" label="Stack migration" before="0.5" after="0.8" note="Solidity version"
                footnote="Custom errors replace require-strings; safer arithmetic by default; immutables for gas." />
          <Stat n="03" label="Reward model" before="Manual" after="Continuous" note="Time-weighted accrual" text
                footnote="Per-block claim becomes per-second accrual. Rewards advance visibly while anything is staked." />
          <Stat n="04" label="Test coverage" before="1" after="40+" note="Unit tests added"
                footnote="Hardhat plus vitest. Covers staking math, lending state machine, deadline boundaries." />
        </div>
      </section>

      {/* ───────────── Footer CTA ───────────── */}
      <section className="max-w-[1080px] mx-auto px-16 pb-52">
        <div className="max-w-[880px]">
          <p className="kicker mb-6">Try it</p>
          <h2 className="font-display font-medium text-[clamp(40px,5.6vw,84px)] leading-none tracking-[-0.024em] text-balance mb-9">
            Ninety seconds. <span className="italic text-ochre-deep">Zero setup.</span>
          </h2>
          <p className="font-display text-[20px] leading-[1.5] text-ink-500 max-w-[36rem] mb-12">
            You'll land with 1,000&nbsp;mDAI and two pending loan offers. Stake, watch rewards
            tick up, borrow against ETH collateral, repay, or let it lapse and get liquidated.
            Every flow in the time it takes to pour a coffee.
          </p>
          <button
            onClick={launchDemo}
            className="group inline-flex items-center gap-3.5 bg-ink-900 text-paper px-7 py-[18px] rounded-sm text-base font-medium hover:bg-ochre-deep transition-colors"
          >
            <span>Launch interactive demo</span>
            <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Stat cell. The hover moment: ochre baseline draws under the cell, the v1
 * value strikes through and fades, the connector extends, the v2 nudges up,
 * and a JetBrains-Mono footnote slides in below.
 */
function Stat({
  n,
  label,
  before,
  after,
  note,
  footnote,
  text,
}: {
  n: string;
  label: string;
  before: string;
  after: string;
  note: string;
  footnote: string;
  text?: boolean;
}) {
  return (
    <div className="group relative px-8 py-10 first:pl-0 last:pr-0 border-b border-paper-rule transition-colors cursor-default">
      {/* ochre baseline draws on hover */}
      <span
        aria-hidden
        className="absolute left-0 right-0 bottom-[-1px] h-px bg-ochre origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[360ms] ease-[cubic-bezier(.2,.8,.2,1)]"
      />

      <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-500 mb-8">
        <span className="text-ochre-deep mr-2">{n}</span>
        {label}
      </p>

      <div className="flex items-baseline gap-3.5 mb-3.5">
        <span
          className={`relative font-display font-normal leading-none tabular-nums text-ink-300 group-hover:text-ink-100 transition-colors duration-300 ${
            text ? "text-[22px] italic" : "text-[40px]"
          }`}
        >
          {before}
          <span
            aria-hidden
            className="absolute left-[-4%] right-[-4%] top-[56%] h-[1.5px] bg-ink-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[360ms] ease-[cubic-bezier(.2,.8,.2,1)] opacity-70"
          />
        </span>
        <span className="font-mono text-ochre text-lg text-center w-[22px] group-hover:w-[34px] group-hover:text-ochre-deep transition-all duration-[320ms] ease-[cubic-bezier(.2,.8,.2,1)]">
          →
        </span>
        <span
          className={`font-display font-medium leading-none tabular-nums tracking-[-0.012em] text-ink-900 origin-left group-hover:scale-[1.02] transition-transform duration-[320ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
            text ? "text-[26px] italic font-normal" : "text-[48px]"
          }`}
        >
          {after}
        </span>
      </div>

      <p className="font-mono text-[11px] text-ink-500 tracking-[0.04em]">{note}</p>

      {/* footnote — the hover reward */}
      <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-[90px] group-hover:opacity-100 group-hover:mt-5 transition-[max-height,opacity,margin] duration-[360ms] ease-[cubic-bezier(.2,.8,.2,1)]">
        <p className="font-mono text-[11px] leading-[1.6] text-ink-700 max-w-[28ch]">{footnote}</p>
      </div>
    </div>
  );
}
