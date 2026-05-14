import { useAccount, useChainId, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAppMode } from "./mode";
import { getDemoStore, useDemoEarned, useDemoState, DemoError } from "@/demo/store";
import { DEMO_ADDRESSES } from "@/demo/types";
import { daiTokenAbi } from "@/abis/daiToken";
import { dappTokenAbi } from "@/abis/dappToken";
import { tokenFarmAbi } from "@/abis/tokenFarm";
import { getAddresses } from "@/config/contracts";

/** Read-side snapshot for the Stake page. Works identically in both modes. */
export type StakingView = {
  daiBalance: bigint;
  dappBalance: bigint;
  staked: bigint;
  earned: bigint;
  allowance: bigint;
  totalStaked: bigint;
  isLoading: boolean;
};

export function useStakingView(): StakingView {
  const mode = useAppMode();
  const { address: walletAddress } = useAccount();
  const chainId = useChainId();
  const addrs = getAddresses(chainId);

  // ---- Sepolia path ----
  const { data: wagmiData, isLoading: wagmiLoading } = useReadContracts({
    allowFailure: false,
    query: { enabled: mode === "sepolia" && !!walletAddress },
    contracts:
      mode === "sepolia" && walletAddress
        ? [
            { address: addrs.dai, abi: daiTokenAbi, functionName: "balanceOf", args: [walletAddress] },
            { address: addrs.dapp, abi: dappTokenAbi, functionName: "balanceOf", args: [walletAddress] },
            { address: addrs.farm, abi: tokenFarmAbi, functionName: "stakedBalance", args: [walletAddress] },
            { address: addrs.farm, abi: tokenFarmAbi, functionName: "earned", args: [walletAddress] },
            { address: addrs.dai, abi: daiTokenAbi, functionName: "allowance", args: [walletAddress, addrs.farm] },
            { address: addrs.farm, abi: tokenFarmAbi, functionName: "totalStaked" },
          ]
        : [],
  });

  // ---- Demo path ----
  const demo = useDemoState((s) => ({
    daiBalance: s.daiBalances[DEMO_ADDRESSES.user] ?? 0n,
    dappBalance: s.dappBalances[DEMO_ADDRESSES.user] ?? 0n,
    staked: s.stakedBalance[DEMO_ADDRESSES.user] ?? 0n,
    totalStaked: s.totalStaked,
  }));
  const demoEarned = useDemoEarned();

  if (mode === "demo") {
    return {
      daiBalance: demo.daiBalance,
      dappBalance: demo.dappBalance,
      staked: demo.staked,
      earned: demoEarned,
      // In demo mode there's no allowance concept — always "approved".
      allowance: 2n ** 256n - 1n,
      totalStaked: demo.totalStaked,
      isLoading: false,
    };
  }

  const [daiBalance, dappBalance, staked, earned, allowance, totalStaked] =
    (wagmiData as [bigint, bigint, bigint, bigint, bigint, bigint] | undefined) ??
    [0n, 0n, 0n, 0n, 0n, 0n];

  return {
    daiBalance,
    dappBalance,
    staked,
    earned,
    allowance,
    totalStaked,
    isLoading: wagmiLoading,
  };
}

/** Write-side actions. Demo mode resolves instantly, sepolia waits for receipt. */
export type StakingActions = {
  stake: (amount: bigint) => Promise<void>;
  unstake: (amount: bigint) => Promise<void>;
  claim: () => Promise<void>;
  exit: () => Promise<void>;
  approve: (amount: bigint) => Promise<void>;
  pending: string | null; // human-readable label of current pending action, or null
};

export function useStakingActions(): StakingActions {
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
      // Small artificial latency so the UI "feels" like a transaction.
      await new Promise((r) => setTimeout(r, 250));
      fn();
      toast.success(`${label} confirmed`);
    } catch (err) {
      const msg = err instanceof DemoError ? err.message : "Transaction failed";
      toast.error(msg);
    } finally {
      setPending(null);
    }
  };

  const runWagmi = async (
    label: string,
    params: Parameters<typeof writeContractAsync>[0]
  ) => {
    setPending(label);
    try {
      const h = await writeContractAsync(params);
      setHash(h);
      toast(`${label} submitted — waiting for confirmation`);
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : "Transaction failed";
      toast.error(msg);
      setPending(null);
    }
  };

  const stake = async (amount: bigint) => {
    if (mode === "demo") return runDemo("Stake", () => getDemoStore().stake(amount));
    return runWagmi("Stake", {
      address: addrs.farm,
      abi: tokenFarmAbi,
      functionName: "stake",
      args: [amount],
    });
  };

  const unstake = async (amount: bigint) => {
    if (mode === "demo") return runDemo("Unstake", () => getDemoStore().unstake(amount));
    return runWagmi("Unstake", {
      address: addrs.farm,
      abi: tokenFarmAbi,
      functionName: "unstake",
      args: [amount],
    });
  };

  const claim = async () => {
    if (mode === "demo") return runDemo("Claim", () => getDemoStore().claim());
    return runWagmi("Claim", {
      address: addrs.farm,
      abi: tokenFarmAbi,
      functionName: "claimReward",
    });
  };

  const exit = async () => {
    if (mode === "demo") return runDemo("Exit", () => getDemoStore().exit());
    return runWagmi("Exit", {
      address: addrs.farm,
      abi: tokenFarmAbi,
      functionName: "exit",
    });
  };

  const approve = async (amount: bigint) => {
    if (mode === "demo") return; // No-op in demo mode.
    return runWagmi("Approve", {
      address: addrs.dai,
      abi: daiTokenAbi,
      functionName: "approve",
      args: [addrs.farm, amount],
    });
  };

  return { stake, unstake, claim, exit, approve, pending: pending ?? (isMining ? "Confirming" : null) };
}
