import { type Address } from "viem";

/**
 * Contract addresses per chain. For local development, addresses are stable
 * because Hardhat deploys from the same deterministic account with the same
 * nonce sequence on every fresh node — these defaults match `scripts/deploy.ts`
 * against a freshly-started `hardhat node`.
 *
 * Sepolia defaults are the live deployment (contracts/deployments/sepolia.json,
 * verified on Sourcify). Override per environment after a redeploy:
 *   VITE_SEPOLIA_DAI=0x...
 *   VITE_SEPOLIA_DAPP=0x...
 *   VITE_SEPOLIA_FARM=0x...
 *   VITE_SEPOLIA_LOAN=0x...
 */

type ContractSet = {
  dai: Address;
  dapp: Address;
  farm: Address;
  loan: Address;
};

// Deterministic Hardhat local addresses (account 0 nonces 0–3).
const LOCAL: ContractSet = {
  dai: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  dapp: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  farm: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  loan: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
};

const SEPOLIA: ContractSet = {
  dai: (import.meta.env.VITE_SEPOLIA_DAI ?? "0xfc62088332c78516744eA92c493d1B3cFdCB39cF") as Address,
  dapp: (import.meta.env.VITE_SEPOLIA_DAPP ?? "0x9641F1EEE808DBa86Aa1571b38645e619516CFc1") as Address,
  farm: (import.meta.env.VITE_SEPOLIA_FARM ?? "0x983Cf8095b7018B57d41750EeBd4A6AE5eae0422") as Address,
  loan: (import.meta.env.VITE_SEPOLIA_LOAN ?? "0x297aBd7036d37DCa41e1b25a93cdA15441884A19") as Address,
};

export const ADDRESSES: Record<number, ContractSet> = {
  31337: LOCAL, // Hardhat
  11155111: SEPOLIA, // Sepolia
};

export function getAddresses(chainId: number | undefined): ContractSet {
  if (chainId && ADDRESSES[chainId]) return ADDRESSES[chainId];
  return LOCAL;
}
