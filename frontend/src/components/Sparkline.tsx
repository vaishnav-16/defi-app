/**
 * Sparkline — a thin ochre line of the last N samples of any monotonic series.
 *
 * No tooltip, no axes, no legend. The point is peripheral vision: "this is
 * moving, and roughly like this." The dot at the head marks the latest value.
 */
type Props = {
  samples: number[];
  width?: number;
  height?: number;
  className?: string;
};

export default function Sparkline({
  samples,
  width = 160,
  height = 28,
  className = "",
}: Props) {
  if (samples.length < 2) {
    return <svg className={className} width={width} height={height + 6} aria-hidden />;
  }
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;
  const pts = samples
    .map((v, i) => {
      const x = (i / (samples.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const headY = height - ((samples[samples.length - 1] - min) / range) * (height - 2) - 1;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height + 6}`}
      width={width}
      height={height + 6}
      preserveAspectRatio="none"
      aria-hidden
    >
      <line x1="0" y1={height + 0.5} x2={width} y2={height + 0.5} className="stroke-navy-rule" strokeWidth="1" />
      <polyline
        points={pts}
        fill="none"
        className="stroke-ochre"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={width} cy={headY} r="2.2" className="fill-ochre" />
    </svg>
  );
}
