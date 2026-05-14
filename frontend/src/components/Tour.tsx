import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getDemoStore, useDemoState } from "@/demo/store";
import { stakingTour, TOUR_STORAGE_KEY } from "@/data/tours";

/**
 * Tour: a floating coach mark that walks first-time visitors through the
 * staking → earning → claiming loop. Reads from the demo store to advance
 * automatically when the user does the expected action; otherwise advances
 * on the user clicking "Next."
 *
 * Persists completion in localStorage so returning visitors aren't nagged.
 */

export default function Tour() {
  const { pathname } = useLocation();
  const state = useDemoState((s) => s);
  const [stepIndex, setStepIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    if (localStorage.getItem(TOUR_STORAGE_KEY) === "true") return -1;
    return 0;
  });
  const [eventCount, setEventCount] = useState(0);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to store events to count user actions for completion predicates.
  useEffect(() => {
    return getDemoStore().onEvent(() => setEventCount((c) => c + 1));
  }, []);

  const step = stepIndex >= 0 ? stakingTour[stepIndex] : null;

  // Auto-advance when the current step's predicate is satisfied.
  useEffect(() => {
    if (!step) return;
    if (step.completedWhen(state, eventCount)) {
      const timer = setTimeout(() => advance(), 800);
      return () => clearTimeout(timer);
    }
  }, [state, eventCount, step]);

  // Reposition the coach mark every frame while a step is active — handles
  // window resize, scroll, layout shifts after a transaction settles.
  useEffect(() => {
    if (!step) {
      setAnchorRect(null);
      return;
    }
    if (step.requiresRoute && pathname !== step.requiresRoute) {
      setAnchorRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(step.target);
      setAnchorRect(el?.getBoundingClientRect() ?? null);
    };
    update();
    tickRef.current = setInterval(update, 250);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [step, pathname]);

  const dismiss = () => {
    setStepIndex(-1);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      /* private mode — quiet failure */
    }
  };

  const advance = () => {
    if (stepIndex >= stakingTour.length - 1) {
      dismiss();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  if (!step || !anchorRect) return null;

  // Position the panel below the anchor by default; flip above if near bottom.
  const margin = 16;
  const panelHeight = 180;
  const showBelow = anchorRect.bottom + margin + panelHeight < window.innerHeight;
  const top = showBelow ? anchorRect.bottom + margin : anchorRect.top - panelHeight - margin;
  const left = Math.max(16, Math.min(anchorRect.left, window.innerWidth - 380));

  return (
    <>
      {/* Typesetter's bracket around the anchored element */}
      <div
        className="pointer-events-none fixed z-40 transition-all duration-150"
        style={{
          top: anchorRect.top - 8,
          left: anchorRect.left - 8,
          width: anchorRect.width + 16,
          height: anchorRect.height + 16,
        }}
      >
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ochre/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-ochre/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-ochre/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ochre/50" />
      </div>
      {/* Footnote connector thread */}
      {showBelow && (
        <div
          className="pointer-events-none fixed z-40 w-px bg-ochre/30"
          style={{
            top: anchorRect.bottom + 8,
            left: left + 24,
            height: margin - 8,
          }}
        />
      )}
      {/* Coach mark panel */}
      <div
        className="fixed z-50 w-[360px] p-5 bg-navy-soft border border-navy-rule rounded-sm animate-rise-in"
        style={{ top, left, borderTop: "2px solid #c77a2a" }}
        role="dialog"
        aria-labelledby="tour-title"
      >
        <p className="kicker font-mono mb-2">
          {String(stepIndex + 1).padStart(2, "0")} / {String(stakingTour.length).padStart(2, "0")}
        </p>
        <h3 id="tour-title" className="font-display text-lg text-paper mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-ink-300 leading-relaxed mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <button className="btn-ghost text-xs" onClick={dismiss}>
            Skip tour
          </button>
          <button className="btn-primary text-sm" onClick={advance}>
            {stepIndex === stakingTour.length - 1 ? "Done" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
