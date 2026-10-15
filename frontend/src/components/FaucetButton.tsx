import { useEffect } from "react";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { daiTokenAbi } from "@/abis/daiToken";
import { getAddresses } from "@/config/contracts";

/**
 * Sepolia only: claims 1,000 test mDAI from the mock DAI faucet so a new
 * wallet can try staking, sending and lending. The contract allows one claim
 * per wallet per day; a second claim reverts with FaucetCooldown.
 */
export default function FaucetButton() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      toast.success("1,000 test mDAI added to your wallet");
      queryClient.invalidateQueries();
    }
  }, [isSuccess, queryClient]);

  if (!isConnected) return null;

  const claim = async () => {
    try {
      await writeContractAsync({
        address: getAddresses(chainId).dai,
        abi: daiTokenAbi,
        functionName: "faucet",
      });
      toast("Faucet claim submitted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg.includes("FaucetCooldown")
          ? "This wallet already claimed today. Try again tomorrow."
          : msg.split("\n")[0] || "Faucet claim failed"
      );
    }
  };

  const busy = isPending || isMining;
  return (
    <button
      onClick={claim}
      disabled={busy}
      className="text-xs font-mono px-3 py-1.5 border border-ochre text-ochre rounded-sm hover:bg-ochre hover:text-navy transition-colors disabled:opacity-50"
      title="Mint 1,000 mock DAI to your wallet (once a day)"
    >
      {busy ? "Claiming..." : "Get test mDAI"}
    </button>
  );
}
