import { Link, Outlet, useLocation } from "react-router-dom";

/**
 * Narrative layout — cream paper, editorial type, minimal chrome.
 * Wraps the Landing, Concepts, and About routes. No app nav, no wallet button.
 */
export default function NarrativeLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-paper text-ink-900">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-block h-2 w-2 rounded-full bg-ochre" aria-hidden />
          <span className="font-display text-lg tracking-tight">DeFi, legible.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {pathname !== "/concepts" && (
            <Link to="/concepts" className="text-ink-500 hover:text-ink-900 transition">
              Concepts
            </Link>
          )}
          {pathname !== "/about" && pathname !== "/case-study" && (
            <Link to="/about" className="text-ink-500 hover:text-ink-900 transition">
              About
            </Link>
          )}
          <Link to="/app" className="text-ochre-deep underline underline-offset-4">
            Launch demo →
          </Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-paper-rule">
        <div className="flex flex-wrap gap-x-8 gap-y-3 items-baseline text-sm text-ink-500">
          <span className="font-mono">v3 · Portfolio Edition</span>
          <span>
            Original project · IT465 at NITK Surathkal · 2021 · Vaishnav Ajai, Rohit B.V., Akash N.
          </span>
          <span className="ml-auto font-mono text-xs">
            Built with Hardhat · viem · React · love for the craft
          </span>
        </div>
      </footer>
    </div>
  );
}
