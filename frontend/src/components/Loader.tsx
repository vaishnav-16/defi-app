export default function Loader({ size = 24 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-slate-600 border-t-brand-500"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
