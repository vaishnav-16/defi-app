import { useEffect, useRef, useState } from "react";

/**
 * Odometer — the Earned-DAPP rolling-digit display.
 *
 * Renders the integer part as static text, then `decimals` rolling digit slots.
 * Each slot is a clipped window over a vertical strip of 0–9; the wheel
 * position for slot p (counting from the decimal point, 1 = tenths) is:
 *
 *     wheelValue = (value × 10^p) mod 10
 *
 * The fractional component of that wheel position drives continuous translateY,
 * so the rightmost digit appears to glide and carries propagate up naturally.
 * Slot height is locked to the font-size in pixels so the clip is exact.
 *
 * NOTE: `value` is a plain JS Number. Convert bigint to Number at the boundary
 * (e.g. Number(view.earned) / 1e18). Display-sized DAPP earnings stay well
 * inside Number.MAX_SAFE_INTEGER, so this is safe for the UI; on-chain math
 * stays in bigint.
 */
type Props = {
  value: number;
  decimals?: number;
  /** Slot height in px. MUST match the rendered font-size for the clip to work. */
  slotPx?: number;
  /** When true: render dim placeholder zeros, no motion. (Empty / Exit states.) */
  idle?: boolean;
  /** Optional smoothing: interpolate between updates at the supplied rate (units/sec).
   *  Pass when the upstream `value` ticks coarsely and you want visible motion between updates. */
  rate?: number;
  className?: string;
};

export default function Odometer({
  value,
  decimals = 6,
  slotPx = 44,
  idle = false,
  rate,
  className = "",
}: Props) {
  // ── optional interpolation between source updates ──
  const [display, setDisplay] = useState(value);
  const targetRef = useRef(value);
  const targetAtRef = useRef(Date.now());

  useEffect(() => {
    targetRef.current = value;
    targetAtRef.current = Date.now();
    if (!rate) setDisplay(value);
  }, [value, rate]);

  useEffect(() => {
    if (!rate || idle) return;
    let raf = 0;
    const tick = () => {
      const dt = (Date.now() - targetAtRef.current) / 1000;
      // Never roll backwards; never roll past the next update by more than ~1s of accrual.
      const interp = targetRef.current + Math.min(rate * dt, rate);
      setDisplay(interp);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rate, idle]);

  const v = idle ? 0 : display;
  const intPart = Math.floor(v);
  const intStr = intPart.toLocaleString("en-US");

  const wheels: number[] = [];
  for (let p = 1; p <= decimals; p++) {
    wheels.push((v * Math.pow(10, p)) % 10);
  }

  return (
    <span
      className={`tabular inline-flex items-center font-mono ${className}`}
      style={{ height: slotPx, lineHeight: `${slotPx}px` }}
    >
      <span>{intStr}</span>
      <span className={idle ? "text-ink-500" : ""}>.</span>
      {wheels.map((w, i) =>
        idle ? (
          <span key={i} className="text-ink-500 inline-block text-center" style={{ width: "0.62em" }}>0</span>
        ) : (
          <Digit key={i} wheelValue={w} slotPx={slotPx} />
        )
      )}
    </span>
  );
}

function Digit({ wheelValue, slotPx }: { wheelValue: number; slotPx: number }) {
  const safe = ((wheelValue % 10) + 10) % 10;
  return (
    <span
      className="inline-block relative overflow-hidden align-middle"
      style={{ width: "0.62em", height: slotPx }}
    >
      <span
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
        style={{ transform: `translateY(${-safe * slotPx}px)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1].map((d, i) => (
          <span
            key={i}
            className="block text-center"
            style={{ height: slotPx, lineHeight: `${slotPx}px` }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}
