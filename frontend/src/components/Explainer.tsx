import { useEffect, useState } from "react";
import { getDemoStore } from "@/demo/store";
import { useAppMode } from "@/lib/mode";
import type { DemoEvent } from "@/demo/types";
import { formatAmount } from "@/lib/format";

/**
 * Explainer panel: subscribes to the demo store's event stream and shows
 * a brief "what just happened?" panel after every transaction. Auto-hides
 * after 6 seconds; can be dismissed earlier.
 *
 * Copy must match `docs/COPY_VOICE.md`. Each kind of event has its own
 * one-sentence explanation, written for a non-DeFi reader.
 */

const AUTO_HIDE_MS = 6000;

export default function Explainer() {
  const mode = useAppMode();
  const [event, setEvent] = useState<DemoEvent | null>(null);

  useEffect(() => {
    if (mode !== "demo") return; // Only show explainers in the demo flow.
    return getDemoStore().onEvent((e) => {
      setEvent(e);
    });
  }, [mode]);

  useEffect(() => {
    if (!event) return;
    const timer = setTimeout(() => setEvent(null), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [event]);

  if (!event) return null;

  const content = describeEvent(event);
  if (!content) return null;

  return (
    <div
      key={`${event.kind}-${event.at}`}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-30 w-[360px] p-5 bg-navy-soft border border-navy-rule rounded-sm animate-rise-in relative overflow-hidden"
      style={{ borderTop: "2px solid #c77a2a" }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="kicker font-mono">{content.kicker}</p>
        <button
          className="text-ink-400 hover:text-paper font-mono text-xs leading-none tracking-widest"
          onClick={() => setEvent(null)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <p className="text-sm text-paper leading-relaxed">{content.body}</p>
      {content.note && (
        <p className="mt-3 text-xs font-mono tabular text-ink-300">{content.note}</p>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-ochre/40 origin-left animate-drain-progress"
        style={{ animationDuration: `${AUTO_HIDE_MS}ms` }}
      />
    </div>
  );
}

function describeEvent(e: DemoEvent): { kicker: string; body: string; note?: string } | null {
  switch (e.kind) {
    case "Staked":
      return {
        kicker: "Staked",
        body: `You moved ${formatAmount(e.amount)} mDAI from your wallet into the farm contract. It starts earning DAPP immediately at a rate that depends on how much everyone else has staked.`,
        note: "Pull it back any time. The math is identical to the on-chain contract.",
      };
    case "Unstaked":
      return {
        kicker: "Unstaked",
        body: `${formatAmount(e.amount)} mDAI returned to your wallet. Your earned rewards are preserved — you can claim them whenever you want.`,
      };
    case "RewardClaimed":
      return {
        kicker: "Reward claimed",
        body: `${formatAmount(e.amount, 6)} DAPP minted to your wallet. The reward bucket on the farm contract resets; further rewards start accruing from now.`,
        note: "In demo mode, DAPP is minted by the simulation. On Sepolia, the farm contract calls .mint() on the DAPP token.",
      };
    case "Transfer":
      return {
        kicker: "Transferred",
        body: `${formatAmount(e.amount)} mDAI moved to ${e.to.slice(0, 6)}…${e.to.slice(-4)}.`,
      };
    case "LoanOffered":
      return {
        kicker: "Loan offered",
        body: `Your mDAI was escrowed in the LoanBook contract. It sits there until a borrower posts the matching ETH collateral.`,
        note: "You can cancel any time before someone takes the offer.",
      };
    case "LoanTaken":
      return {
        kicker: "Loan taken",
        body: `You posted ETH collateral and received the principal in mDAI. The lender's mDAI is now yours; your ETH is locked until you repay or get liquidated.`,
        note: `Deadline: ${new Date(Number(e.at) * 1000).toLocaleString()}`,
      };
    case "LoanRepaid":
      return {
        kicker: "Loan repaid",
        body: `Principal + fee went to the lender. Your ETH collateral is back in your wallet. The loan is now closed.`,
      };
    case "LoanLiquidated":
      return {
        kicker: "Loan liquidated",
        body: `The borrower missed the deadline. ETH collateral was transferred to the lender. The borrower keeps whatever they originally borrowed.`,
      };
    case "LoanCancelled":
      return {
        kicker: "Offer cancelled",
        body: `The mDAI you escrowed is back in your wallet. The offer no longer appears in the loan list.`,
      };
    default:
      return null;
  }
}
