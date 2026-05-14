import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat, sepolia } from "wagmi/chains";
import { http } from "wagmi";

/**
 * Chains the app supports.
 *
 * `hardhat` is the local dev chain exposed on :8545 by `npx hardhat node`.
 * `sepolia` is Ethereum's canonical testnet.
 *
 * To add another chain, import it from `wagmi/chains` and add it below.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "DeFi App v2",
  // Reown (formerly WalletConnect) project ID. Override per-environment via
  // VITE_WALLETCONNECT_PROJECT_ID in frontend/.env if you fork this.
  projectId:
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "6b76bdd413a7244d0ce71c6ff9c1efa6",
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(
      import.meta.env.VITE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org"
    ),
  },
  ssr: false,
});
