import { ChartCard } from "@/components/ui/ChartCard";
import { fetchRidgeline } from "@/lib/api";
import { useAsyncData } from "@/lib/charts";

const SEV_COLOR: Record<number, string> = { 1: "#34d399", 2: "#6ea8fe", 3: "#fbbf24", 4: "#fb7185" };

function RidgePlot({ data }: { data: Record<string, { wind: number; normalized: number }[]> }) {
  const sevs = [4, 3, 2, 1];
  const HEIGHT = 70;
  const GAP = 55;
  const total = sevs.length * (HEIGHT + GAP);
  const maxWind = 60;
  const W = 620;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={total + 30} viewBox={`0 0 ${W} ${total + 30}`} className="mx-auto">
        {[0, 15, 30, 45, 60].map((v) => (
          <g key={v}>
            <line x1={40 + (v / maxWind) * (W - 60)} y1={total} x2={40 + (v / maxWind) * (W - 60)} y2={total + 5} stroke="#475569" />
            <text x={40 + (v / maxWind) * (W - 60)} y={total + 18} textAnchor="middle" fill="#94a3b8" fontSize={10}>{v} mph</text>
          </g>
        ))}

        {sevs.map((sev, idx) => {
          const key = `sev${sev}`;
          const points = data[key] || [];
          const baseY = idx * (HEIGHT + GAP) + HEIGHT;
          const color = SEV_COLOR[sev];
          if (points.length === 0) return null;
          const pathPoints = points.map((p) => {
            const px = 40 + (p.wind / maxWind) * (W - 60);
            const py = baseY - p.normalized * HEIGHT;
            return `${px},${py}`;
          });
          const firstX = 40 + (points[0].wind / maxWind) * (W - 60);
          const lastX = 40 + (points[points.length - 1].wind / maxWind) * (W - 60);
          const d = `M${firstX},${baseY} L${pathPoints.join(" L")} L${lastX},${baseY} Z`;
          return (
            <g key={sev}>
              <line x1={40} y1={baseY} x2={W - 20} y2={baseY} stroke="rgba(148,163,184,0.1)" />
              <path d={d} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={1.5} />
              <text x={32} y={baseY - HEIGHT / 2 + 4} textAnchor="end" fill={color} fontSize={11} fontWeight={700}>Sev {sev}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MultiVariatePage() {
  const { data: ridgeData, loading: ridgeLoading } = useAsyncData(fetchRidgeline);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">
          Multi-Variable Analysis
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Advanced density-based distribution analysis showing how Wind Speed varies across each severity class.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ChartCard
            title="Ridgeline Plot — Wind Speed Distribution per Severity"
            subtitle="Stacked density curves showing wind speed profile for each severity class"
            loading={ridgeLoading}
            height={520}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#a78bfa]">
                <li>All four severity classes share a nearly identical right-skewed wind speed distribution peaking at 0–9 mph, confirming that wind speed alone is not a severity discriminator.</li>
                <li>Due to the stratified balancing of the dataset, all four ridges now exhibit deep, dense statistical curves, providing a highly reliable visual comparison across all severity levels.</li>
                <li>The overlapping ridge shapes validate that no single wind threshold meaningfully separates mild from severe accident outcomes.</li>
              </ul>
            }
          >
            {ridgeData && typeof ridgeData === "object" && Object.keys(ridgeData).length > 0 && (
              <RidgePlot data={ridgeData} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
