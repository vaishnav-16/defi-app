import { useState } from "react";
import { formatEther, parseEther, type Address } from "viem";
import Loader from "@/components/Loader";
import WalletGate from "@/components/WalletGate";
import { useAppMode } from "@/lib/mode";
import { useLoansView, useLoanActions, type UnifiedLoan } from "@/lib/loans";
import { formatAmount, formatDuration, parseAmount, shortAddress } from "@/lib/format";
import { getDemoClock } from "@/demo/clock";

const LOAN_STATES = ["Offered", "Taken", "Repaid", "Liquidated", "Cancelled"] as const;

export default function Loans() {
  const mode = useAppMode();
  const view = useLoansView();
  const [showCreate, setShowCreate] = useState(false);

  if (mode === "sepolia" && !view.userAddress)
    return <WalletGate message="Connect a wallet to lend or borrow on Sepolia." />;

  const active = view.loans.filter((l) => l.state === 0 || l.state === 1);
  const history = view.loans.filter((l) => l.state > 1).reverse();

  return (
    <div className="space-y-10 animate-rise-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker mb-2">Loans</p>
          <h1 className="font-display text-display-sm text-paper">
            Lend mDAI. Borrow against ETH.
          </h1>
          <p className="mt-3 text-ink-300 max-w-xl">
            Over-collateralized peer-to-peer loans. Lenders post an offer and escrow their
            mDAI. Borrowers take it by locking ETH. Repay on time, get the ETH back. Miss the
            deadline, the lender keeps the collateral.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Close" : "+ New offer"}
        </button>
      </header>

      <div className="rule-ink" />

      {showCreate && <CreateOffer onDone={() => setShowCreate(false)} />}

      <Section title="Active" items={active} userAddress={view.userAddress} />
      {history.length > 0 && (
        <Section title="History" items={history} userAddress={view.userAddress} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Create offer form
// ──────────────────────────────────────────────────────────────────────────────

function CreateOffer({ onDone }: { onDone: () => void }) {
  const actions = useLoanActions();
  const [loan, setLoan] = useState("100");
  const [fee, setFee] = useState("5");
  const [collateral, setCollateral] = useState("0.5");
  const [days, setDays] = useState("7");

  const loanAmount = parseAmount(loan);
  const feeAmount = parseAmount(fee) ?? 0n;
  const collateralAmount = (() => {
    try {
      return parseEther(collateral || "0");
    } catch {
      return undefined;
    }
  })();
  const duration = BigInt(Math.max(1, Number(days || "1") * 24 * 60 * 60));
  const valid = loanAmount && loanAmount > 0n && collateralAmount && collateralAmount > 0n;

  const submit = async () => {
    if (!valid) return;
    await actions.offer({
      loanAmount: loanAmount!,
      feeAmount,
      collateralAmount: collateralAmount!,
      duration,
    });
    onDone();
  };

  return (
    <div className="fin-card space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="kicker mb-1">New offer</p>
          <p className="text-sm text-ink-300">
            You supply mDAI. A borrower locks ETH. Set your terms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Loan (mDAI)" value={loan} onChange={setLoan} />
        <Field label="Fee (mDAI)" value={fee} onChange={setFee} />
        <Field label="Collateral (ETH)" value={collateral} onChange={setCollateral} />
        <Field label="Duration (days)" value={days} onChange={setDays} />
      </div>

      <div className="flex gap-3 pt-2">
        <button className="btn-primary" onClick={submit} disabled={!valid || !!actions.pending}>
          {actions.pending ? <Loader size={16} /> : "Post offer"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="kicker mb-2">{label}</p>
      <input
        className="input-field text-xl"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Loan list section
// ──────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  items,
  userAddress,
}: {
  title: string;
  items: UnifiedLoan[];
  userAddress: Address | undefined;
}) {
  return (
    <section>
      <p className="kicker mb-4">{title}</p>
      {items.length === 0 ? (
        <div className="fin-card text-center py-10 text-ink-300">No loans here yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((loan) => (
            <LoanRow key={String(loan.id)} loan={loan} userAddress={userAddress} />
          ))}
        </div>
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Loan row
// ──────────────────────────────────────────────────────────────────────────────

function LoanRow({
  loan,
  userAddress,
}: {
  loan: UnifiedLoan;
  userAddress: Address | undefined;
}) {
  const actions = useLoanActions();
  const state = LOAN_STATES[loan.state];
  const isLender = userAddress?.toLowerCase() === loan.lender.toLowerCase();
  const isBorrower = userAddress?.toLowerCase() === loan.borrower.toLowerCase();

  const deadline = loan.takenAt > 0n ? loan.takenAt + loan.duration : 0n;
  const mode = useAppMode();
  const now =
    mode === "demo" ? getDemoClock().now() : BigInt(Math.floor(Date.now() / 1000));
  const pastDue = deadline > 0n && now >= deadline;

  return (
    <div className="fin-card">
      <div className="flex items-start justify-between gap-6 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-display text-xl text-paper">#{String(loan.id)}</span>
            <StateBadge state={state} />
            {pastDue && state === "Taken" && (
              <span className="text-terracotta text-xs font-mono uppercase tracking-widest">
                Past due
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-ink-300 mt-1">
            Lender {shortAddress(loan.lender)}
            {loan.borrower !== "0x0000000000000000000000000000000000000000" && (
              <> · Borrower {shortAddress(loan.borrower)}</>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular text-2xl text-paper">{formatAmount(loan.loanAmount)}</p>
          <p className="text-xs text-ink-300 font-mono">+ {formatAmount(loan.feeAmount)} fee</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 py-3 border-t border-navy-rule text-sm">
        <div>
          <p className="kicker mb-1">Collateral</p>
          <p className="tabular text-paper">{formatEther(loan.collateralAmount)} ETH</p>
        </div>
        <div>
          <p className="kicker mb-1">Term</p>
          <p className="tabular text-paper">{formatDuration(loan.duration)}</p>
        </div>
        <div>
          <p className="kicker mb-1">Deadline</p>
          <p className="tabular text-paper">
            {deadline > 0n
              ? new Date(Number(deadline) * 1000).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-navy-rule mt-3">
        {state === "Offered" && isLender && (
          <button
            className="btn-ghost"
            onClick={() => actions.cancel(loan.id)}
            disabled={!!actions.pending}
          >
            Cancel offer
          </button>
        )}
        {state === "Offered" && !isLender && (
          <button
            className="btn-primary"
            onClick={() => actions.take(loan.id, loan.collateralAmount)}
            disabled={!!actions.pending}
          >
            Take loan · lock {formatEther(loan.collateralAmount)} ETH
          </button>
        )}
        {state === "Taken" && isBorrower && (
          <button
            className="btn-primary"
            onClick={async () => {
              const total = loan.loanAmount + loan.feeAmount;
              if (mode === "sepolia") await actions.approve(total);
              await actions.repay(loan.id);
            }}
            disabled={!!actions.pending}
          >
            Repay {formatAmount(loan.loanAmount + loan.feeAmount)} mDAI
          </button>
        )}
        {state === "Taken" && isLender && pastDue && (
          <button
            className="btn-primary"
            onClick={() => actions.liquidate(loan.id)}
            disabled={!!actions.pending}
          >
            Liquidate · claim collateral
          </button>
        )}
        {state === "Taken" && isLender && !pastDue && (
          <p className="text-xs text-ink-300">
            Waiting for borrower to repay · liquidation unlocks at deadline
          </p>
        )}
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    Offered: "bg-ochre/20 text-ochre",
    Taken: "bg-sage/20 text-sage",
    Repaid: "bg-paper/10 text-paper",
    Liquidated: "bg-terracotta/20 text-terracotta",
    Cancelled: "bg-ink-500/20 text-ink-300",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded-sm ${styles[state] ?? ""}`}
    >
      {state}
    </span>
  );
}
