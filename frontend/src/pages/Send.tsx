import { useState } from "react";
import { isAddress, type Address } from "viem";
import Loader from "@/components/Loader";
import WalletGate from "@/components/WalletGate";
import { useAppMode } from "@/lib/mode";
import { useTransferActions, useTransferView } from "@/lib/loans";
import { formatAmount, parseAmount } from "@/lib/format";

export default function Send() {
  const mode = useAppMode();
  const view = useTransferView();
  const actions = useTransferActions();

  const [to, setTo] = useState("");
  const [amountStr, setAmountStr] = useState("");

  if (mode === "sepolia" && !view.userAddress)
    return <WalletGate message="Connect a wallet to send mDAI on Sepolia." />;

  const amount = parseAmount(amountStr);
  const validTo = isAddress(to);
  const insufficient = amount !== undefined && amount > view.balance;
  const canSend = validTo && amount && amount > 0n && !insufficient && !actions.pending;

  const onSend = async () => {
    if (!amount || !validTo) return;
    await actions.send(to as Address, amount);
    setTo("");
    setAmountStr("");
  };

  return (
    <div className="space-y-10 animate-rise-in">
      <header>
        <p className="kicker mb-2">Send</p>
        <h1 className="font-display text-display-sm text-paper">
          Transfer mDAI to another address.
        </h1>
        <p className="mt-3 text-ink-300 max-w-xl">
          Standard ERC-20 transfer. In demo mode, you can send to any valid address — it won't
          crash the state. On Sepolia, make sure the recipient exists.
        </p>
      </header>

      <div className="rule-ink" />

      <div className="flex items-baseline justify-between">
        <p className="kicker">Your balance</p>
        <p className="tabular text-3xl text-paper">{formatAmount(view.balance)}</p>
      </div>

      <div className="rule-ink" />

      <section className="space-y-8">
        <div>
          <p className="kicker mb-2">To address</p>
          <input
            className="input-field font-mono text-base"
            placeholder="0x…"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          {to && !validTo && <p className="text-xs text-terracotta mt-2">Not a valid address.</p>}
          {mode === "demo" && (
            <button
              className="text-xs text-ochre hover:text-ochre-soft mt-2 font-mono"
              onClick={() => setTo(actions.demoRecipient)}
            >
              Use demo recipient →
            </button>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="kicker">Amount</p>
            <button
              className="text-xs font-mono text-ochre hover:text-ochre-soft"
              onClick={() => setAmountStr(formatAmount(view.balance, 18))}
            >
              Max
            </button>
          </div>
          <input
            className="input-field text-3xl md:text-4xl"
            placeholder="0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            inputMode="decimal"
          />
          {insufficient && (
            <p className="text-xs text-terracotta mt-2">Amount exceeds your balance.</p>
          )}
        </div>

        <button className="btn-primary" disabled={!canSend} onClick={onSend}>
          {actions.pending ? <Loader size={16} /> : "Send"}
        </button>
      </section>
    </div>
  );
}
