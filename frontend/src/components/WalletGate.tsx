import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletGate({ message }: { message?: string }) {
  return (
    <div className="fin-card max-w-lg mx-auto text-center py-12">
      <p className="kicker mb-3">Sepolia mode</p>
      <h3 className="font-display text-2xl text-paper mb-3">Connect your wallet</h3>
      <p className="text-ink-300 mb-6">
        {message ?? "You'll need a wallet with Sepolia ETH to interact on-chain."}
      </p>
      <div className="flex justify-center">
        <ConnectButton />
      </div>
    </div>
  );
}
