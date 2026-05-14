import { useEffect, useRef, useState } from "react";
import { useAppMode } from "@/lib/mode";
import { useStakingView, useStakingActions } from "@/lib/staking";
import Loader from "@/components/Loader";
import WalletGate from "@/components/WalletGate";
import Odometer from "@/components/Odometer";
import Sparkline from "@/components/Sparkline";
import { formatAmount, parseAmount } from "@/lib/format";
import { getDemoClock } from "@/demo/clock";

/**
 * Stake — navy app theme.
 *
 * The Earned-DAPP cell is the centerpiece: a rolling odometer driven by
 * view.earned, with a thin ochre gutter and a mono rate annotation
 * (+x.xxxxxx DAPP / sec) computed by sampling deltas. A 60-sample sparkline
 * builds in real time. No flashing, no pulsing — the value just moves.
 *
 * Hook contract preserved verbatim:
 *   const view    = useStakingView();
 *   const actions = useStakingActions();
 * Disabled / pending predicates are unchanged from the original file.
 */
export default function Stake() {
  const mode = useAppMode();
  const view = useStakingView();
  const actions = useStakingActions();
  const [input, setInput] = useState("");

  // ── derive a Number representation of earned for the Odometer / rate / sparkline ──
  const earnedNum = Number(view.earned) / 1e18;
  const stakedZero = view.staked === 0n;
  const earnedZero = view.earned === 0n;

  // ── live rate (DAPP/sec) — sampled delta of view.earned ──
  const [rate, setRate] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);
  const lastEarned = useRef(earnedNum);
  const lastAt = useRef(Date.now());

  useEffect(() => {
    if (stakedZero) {
      setRate(0);
      setSamples([]);
      lastEarned.current = earnedNum;
      lastAt.current = Date.now();
      return;
    }
    const now = Date.now();
    const dt = (now - lastAt.current) / 1000;
    if (dt > 0.05) {
      const delta = earnedNum - lastEarned.current;
      if (delta > 0) {
        const r = delta / dt;
        setRate((prev) => (prev === 0 ? r : prev * 0.7 + r * 0.3));
      }
      lastEarned.current = earnedNum;
      lastAt.current = now;
      setSamples((s) => {
        const next = [...s, earnedNum];
        return next.length > 60 ? next.slice(-60) : next;
      });
    }
  }, [earnedNum, stakedZero]);

  // ── gate (sepolia only, unchanged behaviour) ──
  if (mode === "sepolia") {
    const gated = <WalletGate message="Connect a wallet to stake on Sepolia." />;
    if (gated && view.daiBalance === 0n && view.staked === 0n && !view.isLoading) return gated;
  }

  const amount = parseAmount(input);
  const needsApproval = mode === "sepolia" && amount !== undefined && view.allowance < amount;

  const onStake = async () => {
    if (!amount) return;
    if (needsApproval) await actions.approve(amount);
    else await actions.stake(amount);
    setInput("");
  };

  const onUnstake = async () => {
    if (!amount) return;
    await actions.unstake(amount);
    setInput("");
  };

  const isAccruing = !stakedZero && mode === "demo";

  return (
    <div>
      {/* ─── page header ─── */}
      <header className="mb-14">
        <p className="kicker mb-3.5">Stake</p>
        <h1 className="font-display font-medium text-[clamp(32px,4.4vw,56px)] leading-[1.1] tracking-[-0.022em] text-paper text-pretty max-w-[22ch] mb-4">
          Lock mDAI. Earn <span className="italic text-ochre-soft">DAPP</span> every second.
        </h1>
        <p className="font-body text-[17px] leading-relaxed text-ink-300 max-w-[38rem]">
          Your deposit earns continuous rewards while it sits in the farm contract.
          Pull it back any time.{" "}
          {mode === "demo" && (
            <span className="font-mono text-[12px] text-ink-400">
              Demo mode runs the chain clock at {getDemoClock().multiplier}× so rewards tick visibly.
            </span>
          )}
        </p>
      </header>

      {/* ─── stat row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1.8fr_1fr] pt-9 border-t border-navy-rule">
        <Stat label="Wallet mDAI" value={formatAmount(view.daiBalance)} pending={!!actions.pending} tourId="wallet-balance" />
        <Stat label="Staked" value={formatAmount(view.staked)} pending={!!actions.pending} emphasis />

        {/* ─── Earned DAPP — the moment ─── */}
        <div
          data-tour="earned"
          className="px-7 pb-7 border-r border-navy-rule first:pl-0 last:border-r-0 last:pr-0 md:col-span-1 col-span-2 border-t md:border-t-0 border-navy-rule"
        >
          <div className="flex items-baseline justify-between mb-3.5">
            <p className="text-[11px] tracking-[0.16em] uppercase text-ink-300 font-medium">Earned DAPP</p>
            {isAccruing ? (
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ochre-soft inline-flex items-center gap-2">
                <span className="inline-block w-[5px] h-[5px] bg-ochre animate-pulse-soft" />
                Accruing
              </span>
            ) : earnedZero ? (
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500">—</span>
            ) : (
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500">Settled</span>
            )}
          </div>

          <div className="flex items-end gap-3.5">
            <span
              aria-hidden
              className={`w-px h-[38px] mb-0.5 ${
                isAccruing
                  ? "bg-gradient-to-b from-transparent via-ochre-deep to-ochre"
                  : "bg-navy-rule"
              }`}
            />
            <Odometer value={earnedNum} decimals={6} slotPx={44} idle={!isAccruing} />
            <span className="font-mono text-sm text-ink-300 tracking-[0.04em] mb-1.5">DAPP</span>
          </div>

          {isAccruing && (
            <div className="flex items-center gap-4 mt-3.5 font-mono text-[11px] text-ink-300 tracking-[0.04em]">
              <span>
                rate · <span className="text-ochre-soft">+{rate.toFixed(6)}</span> DAPP / sec
              </span>
              <span className="text-ink-500">·</span>
              <Sparkline samples={samples} />
            </div>
          )}
          {!isAccruing && stakedZero && earnedZero && (
            <div className="mt-3.5 font-mono text-[11px] text-ink-500 tracking-[0.04em]">
              stake mDAI to start accruing
            </div>
          )}
        </div>

        <Stat label="Wallet DAPP" value={formatAmount(view.dappBalance, view.dappBalance > 0n ? 6 : 2)} pending={false} />
      </div>

      {/* ─── amount input ─── */}
      <section className="pt-12 mt-10 border-t border-navy-rule">
        <div className="flex items-baseline justify-between mb-4.5">
          <span className="kicker">Amount</span>
          <button
            className="font-mono text-xs text-ochre hover:text-ochre-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setInput(formatAmount(view.daiBalance, 18))}
            disabled={!!actions.pending}
          >
            Max <span className="text-ink-300 ml-1.5">({formatAmount(view.daiBalance)} mDAI)</span>
          </button>
        </div>

        <div className="relative pb-3 border-b-2 border-navy-rule focus-within:border-ochre transition-colors">
          <input
            className="w-full bg-transparent border-0 outline-none font-mono tabular-nums text-paper text-[56px] font-medium leading-none tracking-[-0.005em] placeholder:text-ink-500 placeholder:font-normal disabled:text-ink-300"
            placeholder="0.00"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!actions.pending}
            inputMode="decimal"
            data-tour="stake-input"
          />
          <span className="absolute right-0 bottom-[22px] font-mono text-sm text-ink-300 tracking-[0.04em]">mDAI</span>
        </div>

        <p className="mt-4 font-body text-sm text-ink-300 leading-relaxed max-w-[56ch]">
          {actions.pending ? (
            <>
              <span className="text-ochre-soft">Confirming.</span> The farm contract is receiving
              your transaction. The new balance appears once the simulated block lands.
            </>
          ) : stakedZero && earnedZero ? (
            <>
              <span className="text-ochre-soft">Locking</span> moves mDAI from your wallet into the
              farm contract. It begins earning DAPP immediately, at a rate that depends on how much
              everyone else has staked.
            </>
          ) : (
            <>
              <span className="text-ochre-soft">Active.</span> {formatAmount(view.staked)} mDAI is
              in the farm and earning. Unstake any amount, claim what's accrued without unstaking,
              or exit everything at once.
            </>
          )}
        </p>

        <div className="flex flex-wrap gap-3.5 mt-9">
          <button
            className="btn-primary"
            onClick={onStake}
            disabled={!amount || amount === 0n || !!actions.pending}
          >
            {actions.pending === "Stake" || actions.pending === "Approve" ? (
              <Loader size={16} />
            ) : needsApproval ? (
              "Approve then stake"
            ) : (
              "Stake"
            )}
          </button>
          <button
            className="btn-secondary"
            onClick={onUnstake}
            disabled={!amount || view.staked === 0n || !!actions.pending}
          >
            {actions.pending === "Unstake" ? <Loader size={16} /> : "Unstake amount"}
          </button>
          <button
            className="btn-ghost"
            onClick={() => actions.claim()}
            disabled={view.earned === 0n || !!actions.pending}
            data-tour="claim-action"
          >
            {actions.pending === "Claim" ? <Loader size={16} /> : "Claim rewards"}
          </button>
          <button
            className="btn-ghost hover:text-terracotta"
            onClick={() => actions.exit()}
            disabled={(view.staked === 0n && view.earned === 0n) || !!actions.pending}
          >
            {actions.pending === "Exit" ? <Loader size={16} /> : "Exit everything"}
          </button>
        </div>

        {actions.pending && (
          <div className="mt-5 inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] uppercase text-ochre-soft">
            <span className="relative inline-block w-14 h-px bg-navy-rule overflow-hidden">
              <span className="absolute top-0 bottom-0 -left-[30%] w-[30%] bg-ochre animate-[meterSweep_1.1s_cubic-bezier(.4,0,.6,1)_infinite]" />
            </span>
            <span>{actions.pending} · waiting for simulated block</span>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
  pending,
  tourId,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  pending?: boolean;
  tourId?: string;
}) {
  return (
    <div className="px-7 pb-7 border-r border-navy-rule first:pl-0 last:border-r-0 last:pr-0" data-tour={tourId}>
      <p className="text-[11px] tracking-[0.16em] uppercase text-ink-300 font-medium mb-3.5">{label}</p>
      <p
        className={`tabular ${
          emphasis ? "text-[32px] text-paper font-medium" : "text-[28px] text-ink-300"
        } leading-none ${pending ? "text-ink-500" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
