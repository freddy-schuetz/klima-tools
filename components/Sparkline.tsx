// 7-Tage-Mini-Verlauf (Pegel). Eine Serie, gedämpfte Einzel-Hue, 2px Linie,
// Endpunkt markiert — Identität steht im Zeilentext, nicht in der Farbe.
export default function Sparkline({
  points,
  width = 120,
  height = 32,
  label,
}: {
  points: [string, number][];
  width?: number;
  height?: number;
  label: string;
}) {
  const values = points.map((p) => p[1]).filter((v) => v != null && !Number.isNaN(v));
  if (values.length < 2) {
    return <span className="text-xs text-slate-400">–</span>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const xs = (i: number) => pad + (i / (values.length - 1)) * (width - 2 * pad);
  const ys = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(" ");
  const lastX = xs(values.length - 1);
  const lastY = ys(values[values.length - 1]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}: 7-Tage-Verlauf, min ${Math.round(min)} cm, max ${Math.round(max)} cm`}
      className="shrink-0"
    >
      <title>{`7 Tage: min ${Math.round(min)} cm · max ${Math.round(max)} cm`}</title>
      <path d={d} fill="none" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill="#334155" />
    </svg>
  );
}
