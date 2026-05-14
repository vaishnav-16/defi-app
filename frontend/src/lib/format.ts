import { formatUnits, parseUnits } from "viem";

/** Formats a bigint wei-units value as a human string, trimmed to `dp` decimals. */
export function formatAmount(value: bigint | undefined, dp = 4, decimals = 18): string {
  if (value === undefined) return "—";
  const full = formatUnits(value, decimals);
  const [whole, frac = ""] = full.split(".");
  if (dp === 0) return whole;
  const trimmed = frac.slice(0, dp).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

/** Parses a string like "1.5" into a bigint with 18-decimal precision. Returns `undefined` on invalid input. */
export function parseAmount(value: string, decimals = 18): bigint | undefined {
  if (!value || !/^\d*\.?\d+$/.test(value)) return undefined;
  try {
    return parseUnits(value, decimals);
  } catch {
    return undefined;
  }
}

/** `0x1234…abcd` style shortener for long addresses. */
export function shortAddress(addr: string | undefined): string {
  if (!addr || addr.length < 10) return addr ?? "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Human-readable duration from seconds (e.g. "2d 4h"). */
export function formatDuration(seconds: bigint | number): string {
  const s = Number(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  return hours ? `${days}d ${hours}h` : `${days}d`;
}
