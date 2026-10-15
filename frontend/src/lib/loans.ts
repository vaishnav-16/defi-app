import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import toast from "react-hot-toast";

import { useAppMode } from "./mode";
import { useDemoState, getDemoStore, DemoError } from "@/demo/store";
import { DEMO_ADDRESSES, type DemoLoan } from "@/demo/types";
import { loanBookAbi } from "@/abis/loanBook";
import { daiTokenAbi } from "@/abis/daiToken";
import { getAddresses } from "@/config/contracts";

/** Unified loan type — same shape regardless of data source. */
export type UnifiedLoan = {
  id: bigint;
  lender: Address;
  borrower: Address;
  loanAmount: bigint;
  feeAmount: bigint;
  collateralAmount: bigint;
  duration: bigint;
  takenAt: bigint;
  state: number; // matches DemoLoanState / Solidity enum ordinal
};

export type LoansView = {
  loans: UnifiedLoan[];
  userAddress: Address | undefined;
  isLoading: boolean;
};

export function useLoansView(): LoansView {
  const mode = useAppMode();
  const { address } = useAccount();
  const chainId = useChainId();
  const addrs = getAddresses(chainId);

  // ---- Demo ----
  const demoLoans = useDemoState((s) => s.loans);

  // ---- Sepolia ----
  const { data: nextId } = useReadContract({
    address: addrs.loan,
    abi: loanBookAbi,
    functionName: "nextLoanId",
    query: { enabled: mode === "sepolia", refetchInterval: 10_000 },
  });

  const ids = useMemo(() => {
    if (mode !== "sepolia") return [];
    const n = Number(nextId ?? 0n);
    return Array.from({ length: n }, (_, i) => BigInt(i));
  }, [mode, nextId]);

  const { data: wagmiLoans, isLoading } = useReadContracts({
    allowFailure: false,
    contracts: ids.map((id) => ({
      address: addrs.loan,
      abi: loanBookAbi,
      functionName: "loans" as const,
      args: [id],
    })),
    query: { enabled: mode === "sepolia" && ids.length > 0 },
  });

  if (mode === "demo") {
    return {
      loans: (demoLoans as DemoLoan[]).map((l) => ({ ...l, state: Number(l.state) })),
      userAddress: DEMO_ADDRESSES.user,
      isLoading: false,
    };
  }

  const loans: UnifiedLoan[] = (wagmiLoans ?? []).map((raw, i) => {
    const arr = raw as unknown as readonly [
      Address,
      Address,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      number
    ];
    return {
      id: ids[i],
      lender: arr[0],
      borrower: arr[1],
      loanAmount: arr[2],
      feeAmount: arr[3],
      collateralAmount: arr[4],
      duration: arr[5],
      takenAt: arr[6],
      state: arr[7],
    };
  });

  return { loans, userAddress: address, isLoading };
}

// ──────────────────────────────────────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────────────────────────────────────

export type LoanActions = {
  offer: (args: {
    loanAmount: bigint;
    feeAmount: bigint;
    collateralAmount: bigint;
    duration: bigint;
  }) => Promise<void>;
  cancel: (loanId: bigint) => Promise<void>;
  take: (loanId: bigint, collateral: bigint) => Promise<void>;
  repay: (loanId: bigint) => Promise<void>;
  liquidate: (loanId: bigint) => Promise<void>;
  approve: (amount: bigint) => Promise<void>;
  pending: string | null;
};

export function useLoanActions(): LoanActions {
  const mode = useAppMode();
  const chainId = useChainId();
  const addrs = getAddresses(chainId);

  const [pending, setPending] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      toast.success(`${pending ?? "Transaction"} confirmed`);
      setHash(undefined);
      setPending(null);
    }
  }, [isSuccess, pending]);

  const runDemo = async (label: string, fn: () => void) => {
    setPending(label);
    try {
      await new Promise((r) => setTimeout(r, 250));
      fn();
      toast.success(`${label} confirmed`);
    } catch (err) {
      toast.error(err instanceof DemoError ? err.message : "Transaction failed");
    } finally {
      setPending(null);
    }
  };

  // Takes a thunk so each call site infers its own ABI function (takeLoan is payable).
  const runWagmi = async (label: string, send: () => Promise<`0x${string}`>) => {
    setPending(label);
    try {
      const h = await send();
      setHash(h);
      toast(`${label} submitted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
      setPending(null);
    }
  };

  return {
    offer: async ({ loanAmount, feeAmount, collateralAmount, duration }) => {
      if (mode === "demo")
        return runDemo("Offer loan", () =>
          getDemoStore().offerLoan(loanAmount, feeAmount, collateralAmount, duration)
        );
      return runWagmi("Offer loan", () =>
        writeContractAsync({
          address: addrs.loan,
          abi: loanBookAbi,
          functionName: "offerLoan",
          args: [loanAmount, feeAmount, collateralAmount, duration],
        })
      );
    },
    cancel: async (loanId) => {
      if (mode === "demo") return runDemo("Cancel offer", () => getDemoStore().cancelOffer(loanId));
      return runWagmi("Cancel offer", () =>
        writeContractAsync({
          address: addrs.loan,
          abi: loanBookAbi,
          functionName: "cancelOffer",
          args: [loanId],
        })
      );
    },
    take: async (loanId, collateral) => {
      if (mode === "demo")
        return runDemo("Take loan", () => getDemoStore().takeLoan(loanId, collateral));
      return runWagmi("Take loan", () =>
        writeContractAsync({
          address: addrs.loan,
          abi: loanBookAbi,
          functionName: "takeLoan",
          args: [loanId],
          value: collateral,
        })
      );
    },
    repay: async (loanId) => {
      if (mode === "demo") return runDemo("Repay", () => getDemoStore().repay(loanId));
      return runWagmi("Repay", () =>
        writeContractAsync({
          address: addrs.loan,
          abi: loanBookAbi,
          functionName: "repay",
          args: [loanId],
        })
      );
    },
    liquidate: async (loanId) => {
      if (mode === "demo") return runDemo("Liquidate", () => getDemoStore().liquidate(loanId));
      return runWagmi("Liquidate", () =>
        writeContractAsync({
          address: addrs.loan,
          abi: loanBookAbi,
          functionName: "liquidate",
          args: [loanId],
        })
      );
    },
    approve: async (amount) => {
      if (mode === "demo") return;
      return runWagmi("Approve", () =>
        writeContractAsync({
          address: addrs.dai,
          abi: daiTokenAbi,
          functionName: "approve",
          args: [addrs.loan, amount],
        })
      );
    },
    pending: pending ?? (isMining ? "Confirming" : null),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Transfer (Send page)
// ──────────────────────────────────────────────────────────────────────────────

export function useTransferView() {
  const mode = useAppMode();
  const { address: wallet } = useAccount();
  const chainId = useChainId();
  const addrs = getAddresses(chainId);

  const demoBalance = useDemoState((s) => s.daiBalances[DEMO_ADDRESSES.user] ?? 0n);

  const { data: wagmiBalance } = useReadContract({
    address: addrs.dai,
    abi: daiTokenAbi,
    functionName: "balanceOf",
    args: wallet ? [wallet] : undefined,
    query: { enabled: mode === "sepolia" && !!wallet },
  });

  return {
    balance: mode === "demo" ? demoBalance : (wagmiBalance as bigint | undefined) ?? 0n,
    userAddress: mode === "demo" ? DEMO_ADDRESSES.user : wallet,
  };
}

export function useTransferActions() {
  const mode = useAppMode();
  const chainId = useChainId();
  const addrs = getAddresses(chainId);

  const [pending, setPending] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Transfer confirmed");
      setHash(undefined);
      setPending(null);
    }
  }, [isSuccess]);

  const send = async (to: Address, amount: bigint) => {
    if (mode === "demo") {
      setPending("Send");
      try {
        await new Promise((r) => setTimeout(r, 250));
        getDemoStore().transfer(to, amount);
        toast.success("Transfer confirmed");
      } catch (err) {
        toast.error(err instanceof DemoError ? err.message : "Transfer failed");
      } finally {
        setPending(null);
      }
      return;
    }
    setPending("Send");
    try {
      const h = await writeContractAsync({
        address: addrs.dai,
        abi: daiTokenAbi,
        functionName: "transfer",
        args: [to, amount],
      });
      setHash(h);
      toast("Transfer submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transfer failed");
      setPending(null);
    }
  };

  // Random demo address for "send to Alice" shortcut.
  const demoRecipient = "0x00000000000000000000000000000000000000Ca" as Address;

  return { send, pending: pending ?? (isMining ? "Confirming" : null), demoRecipient };
}
