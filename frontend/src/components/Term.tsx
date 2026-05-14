import { useState, useRef, type ReactNode } from "react";

/**
 * Glossary of DeFi terms for non-crypto readers. Each entry is a short
 * plain-English definition that matches `docs/COPY_VOICE.md` — no jargon
 * defined with more jargon.
 *
 * Usage: wrap any term in <Term>stake</Term> in JSX. The word gets a quiet
 * dotted underline; hovering reveals the definition.
 */

export const glossary: Record<string, string> = {
  stake:
    "Locking your tokens into a contract that pays you rewards while they're there. You can take them back any time.",
  unstake: "Withdrawing tokens that were previously staked. Your reward balance is preserved.",
  claim: "Moving earned rewards from the contract's bucket into your wallet.",
  collateral:
    "Something valuable you lock up to guarantee you'll repay a loan. If you don't repay, the lender keeps it.",
  liquidation:
    "When a borrower misses the deadline, the lender takes the collateral. The loan ends.",
  apy:
    "Annualized percentage yield — the return on a stake if conditions stayed constant for a year.",
  erc20:
    "The Ethereum standard for fungible tokens. Anything that follows it can be sent, approved, and held by any wallet.",
  gas: "The fee paid to the network to execute a transaction. Demo mode has no gas; Sepolia mode does.",
  allowance:
    "Permission you grant a contract to move a specific amount of your tokens. Required once before each new spend limit.",
  contract:
    "A program deployed to the blockchain. Calls and state are public; you don't need to trust the developer, only verify the code.",
  approval:
    "The transaction that grants an allowance. You sign it once, and the contract can then move tokens up to the approved amount.",
  wallet: "Software that holds your private key and signs transactions on your behalf.",
  dapp:
    "Decentralized application — a frontend that talks directly to smart contracts instead of a backend server.",
  rewardrate:
    "How fast a staking contract pays out rewards, expressed as wei per second across the whole pool.",
};

export function Term({
  children,
  k,
}: {
  children: ReactNode;
  /** Override the lookup key if the displayed text differs from the term. */
  k?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const key = (k ?? String(children)).toLowerCase().replace(/[^a-z]/g, "");
  const definition = glossary[key];

  if (!definition) return <>{children}</>;

  return (
    <span className="relative inline-block" ref={ref}>
      <span
        className="border-b border-dotted border-ochre cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3
                     bg-ink-900 text-paper text-sm font-body leading-relaxed
                     border border-navy-rule rounded-sm
                     animate-fade-in pointer-events-none"
          style={{ borderTop: "2px solid #c77a2a" }}
        >
          <span className="kicker font-mono block mb-1.5" style={{ color: "#e9a961" }}>Term</span>
          {definition}
        </span>
      )}
    </span>
  );
}
