export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: PieSlice[];
  title?: string;
  centerLabel?: string;
  centerValue?: string;
  size?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  slices,
  title,
  centerLabel,
  centerValue,
  size = 180,
}: Props) {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const stroke = Math.max(18, Math.round(size * 0.14));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let angle = 0;
  const arcs =
    total <= 0
      ? []
      : slices
          .filter((s) => s.value > 0)
          .map((slice) => {
            const sweep = (slice.value / total) * 360;
            const start = angle;
            const end = angle + sweep;
            angle = end;
            // Full circle needs a special path; split near-full slices
            if (sweep >= 359.9) {
              return {
                ...slice,
                d: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`,
              };
            }
            return {
              ...slice,
              d: arcPath(cx, cy, r, start, end),
            };
          });

  return (
    <div className="donut-chart">
      {title ? <h3 className="donut-chart-title">{title}</h3> : null}
      <div className="donut-chart-body">
        <div className="donut-chart-svg-wrap" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#ececec"
              strokeWidth={stroke}
            />
            {arcs.map((arc) => (
              <path
                key={arc.label}
                d={arc.d}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="donut-chart-center">
            {centerValue ? <strong>{centerValue}</strong> : null}
            {centerLabel ? <span>{centerLabel}</span> : null}
          </div>
        </div>
        <ul className="donut-legend">
          {slices.map((slice) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <li key={slice.label}>
                <span className="donut-swatch" style={{ background: slice.color }} />
                <span className="donut-legend-label">{slice.label}</span>
                <strong>
                  {slice.value.toLocaleString("es-MX")}
                  {total > 0 ? ` · ${pct}%` : ""}
                </strong>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function aggregateCutFlow(cuts: Array<{
  deliveredByCut: number;
  shrinkageByCut: number;
  lineSurplusByCut: number;
  inRepairByCut: number;
  unassignedByCut: number;
  pendingByCut: number;
}>): PieSlice[] {
  const sum = (key: keyof (typeof cuts)[number]) =>
    cuts.reduce((acc, cut) => acc + (cut[key] ?? 0), 0);

  return [
    { label: "Entregado", value: sum("deliveredByCut"), color: "#2b6bff" },
    { label: "Merma", value: sum("shrinkageByCut"), color: "#b42318" },
    { label: "Sobrante línea", value: sum("lineSurplusByCut"), color: "#7a5af8" },
    { label: "En compostura", value: sum("inRepairByCut"), color: "#f79009" },
    { label: "Sin asignar", value: sum("unassignedByCut"), color: "#667085" },
    { label: "Pendiente de recibir", value: sum("pendingByCut"), color: "#98a2b3" },
  ].filter((s) => s.value > 0);
}

export function squaredSlices(cuts: Array<{ squared: boolean }>): PieSlice[] {
  const squared = cuts.filter((c) => c.squared).length;
  const pending = cuts.length - squared;
  return [
    { label: "Cuadrados", value: squared, color: "#12b76a" },
    { label: "Pendientes", value: pending, color: "#f79009" },
  ];
}
