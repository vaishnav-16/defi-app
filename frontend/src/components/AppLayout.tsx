import { NavLink, Link, Outlet } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSyncExternalStore } from "react";
import { useAppMode, useSetAppMode } from "@/lib/mode";
import { getDemoClock } from "@/demo/clock";
import Tour from "./Tour";
import Explainer from "./Explainer";

const navItems = [
  { to: "/app", label: "Stake", end: true },
  { to: "/app/send", label: "Send" },
  { to: "/app/loans", label: "Loans" },
];

/**
 * App layout — navy "app" theme. Includes:
 *   - Logo linking back to the narrative
 *   - Nav tabs
 *   - Mode toggle (demo / sepolia)
 *   - Clock badge showing chain time and multiplier (demo only)
 *   - Wallet connect (sepolia only)
 */
export default function AppLayout() {
  const mode = useAppMode();
  const setMode = useSetAppMode();

  return (
    <div data-theme="app" className="min-h-screen bg-navy text-ink-50">
      <header className="sticky top-0 z-20 bg-navy/80 backdrop-blur-md border-b border-navy-rule">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="inline-block h-2 w-2 rounded-full bg-ochre" aria-hidden />
              <span className="font-display text-lg tracking-tight text-paper">
                DeFi, legible.
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  data-tour={item.to === "/app/loans" ? "nav-loans" : undefined}
                  className={({ isActive }) =>
                    [
                      "px-3 py-2 rounded-sm text-sm transition",
                      isActive
                        ? "text-paper border-b-2 border-ochre"
                        : "text-ink-300 hover:text-paper border-b-2 border-transparent",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {mode === "demo" && <DemoClockBadge />}
            <ModeToggle mode={mode} setMode={setMode} />
            {mode === "sepolia" && (
              <ConnectButton
                accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                chainStatus="icon"
              />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Outlet />
      </main>

      {/* Guided experience layer — only active in demo mode (Tour + Explainer handle this themselves) */}
      <Tour />
      <Explainer />

      <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-ink-300 font-mono flex flex-wrap gap-x-6 gap-y-2 border-t border-navy-rule mt-16">
        <span>You are in {mode} mode.</span>
        <Link to="/" className="link">
          ← Back to case study
        </Link>
      </footer>
    </div>
  );
}

function ModeToggle({
  mode,
  setMode,
}: {
  mode: "demo" | "sepolia";
  setMode: (m: "demo" | "sepolia") => void;
}) {
  return (
    <div
      className="inline-flex text-xs font-mono border border-navy-rule rounded-sm overflow-hidden"
      role="tablist"
      aria-label="App mode"
    >
      {(["demo", "sepolia"] as const).map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          onClick={() => setMode(m)}
          className={`px-3 py-1.5 transition-colors ${
            mode === m
              ? "bg-ochre text-navy"
              : "text-ink-300 hover:text-paper hover:bg-navy-soft"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function DemoClockBadge() {
  const clock = getDemoClock();
  const chainTime = useSyncExternalStore(
    (fn) => clock.subscribe(fn),
    () => clock.now().toString()
  );
  const date = new Date(Number(chainTime) * 1000);
  return (
    <div
      className="hidden md:flex items-center gap-2 text-xs font-mono text-ink-300"
      title={`Accelerated chain time at ${clock.multiplier}×`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-ochre animate-pulse-soft" />
      <span>chain · {date.toISOString().split("T")[1].slice(0, 8)}</span>
      <span className="text-ink-500">· {clock.multiplier}× speed</span>
    </div>
  );
}
