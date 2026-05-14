/**
 * Demo clock.
 *
 * Tracks "chain time" as a bigint of seconds, advancing at a configurable
 * multiple of real wall time. With the default 60× multiplier, one minute
 * of reward accrual happens per one second of browsing — fast enough to
 * show rewards visibly ticking, slow enough to not feel fake.
 *
 * The clock is externally subscribable so React components can re-render
 * reward values on a fixed cadence without busy-polling.
 */

const DEFAULT_MULTIPLIER = 60;

export class DemoClock {
  private _chainTimeAtSync: bigint;
  private _wallTimeAtSync: number;
  private _multiplier: number;
  private listeners = new Set<() => void>();
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  constructor(initialChainTime?: bigint, multiplier = DEFAULT_MULTIPLIER) {
    this._chainTimeAtSync = initialChainTime ?? BigInt(Math.floor(Date.now() / 1000));
    this._wallTimeAtSync = Date.now();
    this._multiplier = multiplier;
  }

  /** Current chain timestamp, extrapolated from the last sync point. */
  now(): bigint {
    const wallElapsedMs = Date.now() - this._wallTimeAtSync;
    const chainElapsedSec = Math.floor((wallElapsedMs * this._multiplier) / 1000);
    return this._chainTimeAtSync + BigInt(chainElapsedSec);
  }

  get multiplier(): number {
    return this._multiplier;
  }

  /** Change speed without skipping time. */
  setMultiplier(m: number): void {
    this._chainTimeAtSync = this.now();
    this._wallTimeAtSync = Date.now();
    this._multiplier = m;
    this.emit();
  }

  /** Jump forward by `seconds` of chain time. Used by "fast forward" buttons in the UI. */
  fastForward(seconds: bigint): void {
    this._chainTimeAtSync = this.now() + seconds;
    this._wallTimeAtSync = Date.now();
    this.emit();
  }

  /** Start a ticker that pokes subscribers at the given interval. */
  start(intervalMs = 1000): void {
    if (this.tickHandle) return;
    this.tickHandle = setInterval(() => this.emit(), intervalMs);
  }

  stop(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }
}

/** Singleton. Constructed lazily so tests can pre-seed a different instance. */
let singleton: DemoClock | null = null;

export function getDemoClock(): DemoClock {
  if (!singleton) {
    singleton = new DemoClock();
    singleton.start(1000);
  }
  return singleton;
}
