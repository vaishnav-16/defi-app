import { useSyncExternalStore, useRef } from "react";
import type { Address } from "viem";

import {
  DemoError,
  doCancelOffer,
  doClaim,
  doExit,
  doLiquidate,
  doOfferLoan,
  doRepay,
  doStake,
  doTakeLoan,
  doTransfer,
  doUnstake,
  earned,
  rewardPerToken,
} from "./engine";
import { getDemoClock } from "./clock";
import { seedState } from "./seed";
import type { DemoEvent, DemoState } from "./types";
import { DEMO_ADDRESSES } from "./types";

/**
 * Observable store for the demo engine. React components subscribe via
 * `useDemoStore(selector)` — similar to Zustand but hand-rolled to keep the
 * dependency footprint small and the behavior fully transparent.
 */

type Listener = () => void;

const LOCAL_KEY = "demo-state-v2";
const MAX_EVENTS = 50;

class Store {
  private state: DemoState;
  private events: DemoEvent[] = [];
  private stateListeners = new Set<Listener>();
  private eventListeners = new Set<(e: DemoEvent) => void>();

  constructor() {
    this.state = this.load() ?? seedState();
  }

  getState = (): DemoState => this.state;
  getEvents = (): readonly DemoEvent[] => this.events;

  subscribe = (fn: Listener): (() => void) => {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  };

  onEvent = (fn: (e: DemoEvent) => void): (() => void) => {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  };

  /** Reset to the clean seed state and wipe local storage. */
  reset = (): void => {
    this.state = seedState();
    this.events = [];
    this.persist();
    this.emit();
  };

  // ---- actions ----

  stake = (amount: bigint): void =>
    this.apply(({ state, events }) => {
      const r = doStake(state, DEMO_ADDRESSES.user, amount, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  unstake = (amount: bigint): void =>
    this.apply(({ state, events }) => {
      const r = doUnstake(state, DEMO_ADDRESSES.user, amount, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  claim = (): void =>
    this.apply(({ state, events }) => {
      const r = doClaim(state, DEMO_ADDRESSES.user, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  exit = (): void =>
    this.apply(({ state, events }) => {
      const r = doExit(state, DEMO_ADDRESSES.user, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  transfer = (to: Address, amount: bigint): void =>
    this.apply(({ state, events }) => {
      const r = doTransfer(state, DEMO_ADDRESSES.user, to, amount, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  offerLoan = (
    loanAmount: bigint,
    feeAmount: bigint,
    collateralAmount: bigint,
    duration: bigint
  ): void =>
    this.apply(({ state, events }) => {
      const r = doOfferLoan(
        state,
        DEMO_ADDRESSES.user,
        loanAmount,
        feeAmount,
        collateralAmount,
        duration,
        getDemoClock().now()
      );
      return { state: r.state, events: [...events, ...r.events] };
    });

  cancelOffer = (loanId: bigint): void =>
    this.apply(({ state, events }) => {
      const r = doCancelOffer(state, DEMO_ADDRESSES.user, loanId, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  takeLoan = (loanId: bigint, collateral: bigint): void =>
    this.apply(({ state, events }) => {
      const r = doTakeLoan(
        state,
        DEMO_ADDRESSES.user,
        loanId,
        collateral,
        getDemoClock().now()
      );
      return { state: r.state, events: [...events, ...r.events] };
    });

  repay = (loanId: bigint): void =>
    this.apply(({ state, events }) => {
      const r = doRepay(state, DEMO_ADDRESSES.user, loanId, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  liquidate = (loanId: bigint): void =>
    this.apply(({ state, events }) => {
      const r = doLiquidate(state, DEMO_ADDRESSES.user, loanId, getDemoClock().now());
      return { state: r.state, events: [...events, ...r.events] };
    });

  // ---- derived views ----

  getEarned = (account: Address = DEMO_ADDRESSES.user): bigint =>
    earned(this.state, account, getDemoClock().now());

  getRewardPerToken = (): bigint => rewardPerToken(this.state, getDemoClock().now());

  // ---- internals ----

  private apply = (
    reducer: (input: { state: DemoState; events: DemoEvent[] }) => {
      state: DemoState;
      events: DemoEvent[];
    }
  ): void => {
    try {
      const { state, events } = reducer({ state: this.state, events: this.events });
      const newEvents = events.slice(this.events.length);
      this.state = state;
      this.events = [...events].slice(-MAX_EVENTS);
      for (const e of newEvents) for (const fn of this.eventListeners) fn(e);
      this.persist();
      this.emit();
    } catch (err) {
      if (err instanceof DemoError) throw err;
      console.error("[demo] unexpected reducer error", err);
      throw err;
    }
  };

  private emit = (): void => {
    for (const fn of this.stateListeners) fn();
  };

  private persist = (): void => {
    try {
      const serialized = JSON.stringify(this.state, (_, value) =>
        typeof value === "bigint" ? { __bigint: value.toString() } : value
      );
      localStorage.setItem(LOCAL_KEY, serialized);
    } catch {
      /* private mode / full storage — fail silently */
    }
  };

  private load = (): DemoState | null => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      return JSON.parse(raw, (_, value) =>
        value && typeof value === "object" && "__bigint" in value
          ? BigInt(value.__bigint as string)
          : value
      ) as DemoState;
    } catch {
      return null;
    }
  };
}

// Singleton
let store: Store | null = null;
export function getDemoStore(): Store {
  if (!store) store = new Store();
  return store;
}

// ──────────────────────────────────────────────────────────────────────────────
// React adapters
// ──────────────────────────────────────────────────────────────────────────────

/** Subscribe a React component to a derived slice of the demo state. */
export function useDemoState<T>(selector: (s: DemoState) => T): T {
  const store = getDemoStore();
  // Cache by state identity so object-returning selectors don't cause infinite re-render loops.
  const cacheRef = useRef<{ state: DemoState; value: T } | null>(null);

  const getSnapshot = () => {
    const s = store.getState();
    if (cacheRef.current !== null && cacheRef.current.state === s) {
      return cacheRef.current.value;
    }
    const value = selector(s);
    cacheRef.current = { state: s, value };
    return value;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** Subscribe to the live accrual of rewards. Re-renders every clock tick. */
export function useDemoEarned(account?: Address): bigint {
  const store = getDemoStore();
  const clock = getDemoClock();
  return useSyncExternalStore(
    (listener) => {
      const a = store.subscribe(listener);
      const b = clock.subscribe(listener);
      return () => {
        a();
        b();
      };
    },
    () => store.getEarned(account ?? DEMO_ADDRESSES.user),
    () => store.getEarned(account ?? DEMO_ADDRESSES.user)
  );
}

export { DemoError };
