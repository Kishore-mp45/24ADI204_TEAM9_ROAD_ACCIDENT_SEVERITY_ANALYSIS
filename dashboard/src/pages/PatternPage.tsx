import { ChartCard } from "@/components/ui/ChartCard";
import { fetchPolarHour } from "@/lib/api";
import { useAsyncData } from "@/lib/charts";

function PolarHourChart({ data }: { data: { hour: number; count: number }[] }) {
  if (!data.length) return null;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const CX = 230, CY = 230, R_INNER = 45, R_OUTER = 180;
  const W = 460, H = 460;

  const slices = data.map(d => {
    const startAngle = (d.hour / 24) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((d.hour + 1) / 24) * 2 * Math.PI - Math.PI / 2;
    const r = R_INNER + (d.count / maxCount) * (R_OUTER - R_INNER);
    const x1 = CX + R_INNER * Math.cos(startAngle), y1 = CY + R_INNER * Math.sin(startAngle);
    const x2 = CX + r * Math.cos(startAngle), y2 = CY + r * Math.sin(startAngle);
    const x3 = CX + r * Math.cos(endAngle), y3 = CY + r * Math.sin(endAngle);
    const x4 = CX + R_INNER * Math.cos(endAngle), y4 = CY + R_INNER * Math.sin(endAngle);
    const intense = d.count / maxCount;
    const fillR = Math.round(34 + intense * 76), fillG = Math.round(211 - intense * 50), fillB = 238;
    return {
      path: `M${x1},${y1} L${x2},${y2} A${r},${r} 0 0,1 ${x3},${y3} L${x4},${y4} A${R_INNER},${R_INNER} 0 0,0 ${x1},${y1} Z`,
      fill: `rgb(${fillR},${fillG},${fillB})`,
      hour: d.hour,
      count: d.count,
      midAngle: (startAngle + endAngle) / 2,
    };
  });

  return (
    <div className="w-full flex justify-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Radial guide rings */}
        {[0.25, 0.5, 0.75, 1.0].map(frac => (
          <circle key={frac} cx={CX} cy={CY}
            r={R_INNER + frac * (R_OUTER - R_INNER)}
            fill="none" stroke="rgba(148,163,184,0.07)" />
        ))}
        {/* Spokes */}
        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => {
          const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
          return (
            <line key={h}
              x1={CX + R_INNER * Math.cos(angle)} y1={CY + R_INNER * Math.sin(angle)}
              x2={CX + R_OUTER * Math.cos(angle)} y2={CY + R_OUTER * Math.sin(angle)}
              stroke="rgba(148,163,184,0.08)" />
          );
        })}
        {/* Slices */}
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.fill} fillOpacity={0.82} stroke="#060a10" strokeWidth={0.5}>
            <title>Hour {s.hour}:00 — {s.count.toLocaleString()} accidents</title>
          </path>
        ))}
        {/* Hour labels */}
        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => {
          const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
          const lx = CX + (R_OUTER + 22) * Math.cos(angle);
          const ly = CY + (R_OUTER + 22) * Math.sin(angle);
          return (
            <text key={h} x={lx} y={ly + 4} textAnchor="middle"
              fill="#94a3b8" fontSize={11} fontWeight={700}>{h}:00</text>
          );
        })}
        {/* Center */}
        <circle cx={CX} cy={CY} r={R_INNER} fill="var(--color-surface)" />
        <text x={CX} y={CY - 7} textAnchor="middle" fill="#f1f5f9" fontSize={11} fontWeight={700}>Hour</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#94a3b8" fontSize={10}>of Day</text>
      </svg>
    </div>
  );
}

export default function PatternPage() {
  const { data: polarData, loading: polarLoading } = useAsyncData(fetchPolarHour);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">
          Pattern Discovery
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Circular temporal analysis revealing the 24-hour accident risk cycle across the full US dataset.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ChartCard
            title="Polar Chart — Accident Distribution by Hour of Day"
            subtitle="Circular radial chart — bar length = accident count per hour (hover for exact value)"
            loading={polarLoading}
            height={540}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#a78bfa]">
                <li>The polar chart visually confirms the dual-peak structure of accident risk: morning commute (7–9 AM) and afternoon commute (3–6 PM) produce the longest radial bars in the chart.</li>
                <li>The early morning hours (1–5 AM) show the shortest bars, representing the safest time window on US roads — low traffic volume and minimal commuter activity.</li>
                <li>The circular layout reveals the continuous 24-hour risk cycle, making the mid-day lull (11 AM–1 PM) visible as a clear valley between the two rush-hour peaks.</li>
              </ul>
            }
          >
            {Array.isArray(polarData) && polarData.length > 0 && (
              <PolarHourChart data={polarData} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
