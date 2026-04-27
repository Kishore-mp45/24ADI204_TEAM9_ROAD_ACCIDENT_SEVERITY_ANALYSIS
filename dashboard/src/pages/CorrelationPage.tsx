import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, AreaChart, Area, Line, Cell,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchCorrHeat, fetchMissingBar, fetchPcaLine } from "@/lib/api";
import { CHART_COLORS, AXIS_STYLE, GRID_STYLE, useAsyncData } from "@/lib/charts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "rgba(11,17,32,0.92)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "0.75rem" },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};


function CorrelationHeatmap({ data }: { data: { columns: string[]; cells: { x: string; y: string; value: number }[] } }) {
  const { columns, cells } = data;
  const size = Math.min(44, Math.floor(500 / columns.length));

  function getColor(v: number) {
    const intensity = Math.abs(v) > 0.1 ? 0.2 + Math.abs(v) * 0.8 : Math.abs(v);
    if (v > 0) return `rgba(34, 211, 238, ${intensity})`; // High Contrast Vibrant Cyan
    if (v < 0) return `rgba(249, 115, 22, ${intensity})`; // High Contrast Vibrant Orange
    return "rgba(255,255,255,0.02)";
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="inline-block">
        <div className="flex ml-24">
          {columns.map((c) => (
            <div key={c} className="text-[8px] text-[var(--color-text-muted)] font-medium truncate transform -rotate-45 origin-bottom-left" style={{ width: size, height: 60 }}>
              {c.length > 12 ? c.slice(0, 10) + "…" : c}
            </div>
          ))}
        </div>
        {columns.map((row) => (
          <div key={row} className="flex items-center">
            <div className="w-24 text-[9px] text-[var(--color-text-secondary)] font-medium text-right pr-2 truncate">
              {row.length > 14 ? row.slice(0, 12) + "…" : row}
            </div>
            {columns.map((col) => {
              const cell = cells.find((c) => c.x === col && c.y === row);
              const val = cell?.value || 0;
              return (
                <div key={`${row}-${col}`} className="border border-[rgba(6,10,16,0.5)] transition-all duration-150 cursor-pointer hover:scale-110 hover:z-10 group relative"
                  style={{ width: size, height: size, background: getColor(val) }}>
                  {size >= 28 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {val.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div className="flex items-center justify-center gap-3 mt-4 ml-24">
          <span className="text-[9px] text-[#f97316] uppercase font-bold">−1 (Negative)</span>
          <div className="flex gap-0.5">
            {[-1.0, -0.8, -0.5, -0.2, 0, 0.2, 0.5, 0.8, 1.0].map((v) => (
              <div key={v} className="w-5 h-3 rounded-sm" style={{ background: getColor(v) }} />
            ))}
          </div>
          <span className="text-[9px] text-[#22d3ee] uppercase font-bold">+1 (Positive)</span>
        </div>
      </div>
    </div>
  );
}

export default function CorrelationPage() {
  const { data: corrData, loading: corrLoading } = useAsyncData(fetchCorrHeat);
  const { data: missingData, loading: missingLoading } = useAsyncData(fetchMissingBar);
  const { data: pcaLineData, loading: pcaLineLoading } = useAsyncData(fetchPcaLine);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">Correlation Matrix</h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Identify latent relationships and statistical dependencies within the observational dataset.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <ChartCard 
            title="Feature Heatmap" 
            subtitle="Pearson correlation coefficients" 
            loading={corrLoading} 
            height={500}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#22d3ee]">
                <li>Exposes severe multicollinearity directly between wind chill variables and standard ambient temperature.</li>
                <li>Identifies mathematically distinct, isolated vectors (like precipitation scale) which remain independent from standard climate readings.</li>
              </ul>
            }  
          >
            {corrData && <CorrelationHeatmap data={corrData} />}
          </ChartCard>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <ChartCard 
            title="Missing Values Mapping" 
            loading={missingLoading} 
            height={240}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#fb7185]">
                <li>Demonstrates critical data dropout rates primarily affecting complex meteorological variables.</li>
                <li>Validates the data cleaning necessity for systematically dropping highly sparse vectors prior to modeling.</li>
              </ul>
            }  
          >
            {missingData && missingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingData.slice(0, 10)} layout="vertical" barCategoryGap="16%">
                  <CartesianGrid {...GRID_STYLE} horizontal={false} />
                  <XAxis type="number" {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <YAxis type="category" dataKey="feature" width={90} {...AXIS_STYLE} tickLine={false} axisLine={false} tick={{ fill: "#f8fafc", fontSize: 9 }} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), "Null Count"]} />
                  <Bar dataKey="nullCount" radius={[0, 6, 6, 0]} animationDuration={1000}>
                    {missingData.slice(0, 10).map((_: unknown, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[#34d399] text-sm font-semibold">✓ No missing values in sample</p>
              </div>
            )}
          </ChartCard>

          <ChartCard 
            title="PCA Explained Variance" 
            subtitle="Cumulative variance ratio" 
            loading={pcaLineLoading} 
            height={240}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#34d399]">
                <li>Maps PCA effectiveness in condensing physical array dimensionality.</li>
                <li>Confirms exactly 95% of total mathematical variance is retained within a reduced component layout.</li>
              </ul>
            }  
          >
            {pcaLineData && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pcaLineData}>
                  <defs>
                    <linearGradient id="pcaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="component" {...AXIS_STYLE} tickLine={false} axisLine={false} tick={{ fill: "#f8fafc", fontSize: 9 }} />
                  <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number, name: string) => [`${value}%`, name === "cumulative" ? "Cumulative" : "Variance"]} />
                  <Area type="monotone" dataKey="cumulative" stroke="#a78bfa" strokeWidth={2} fill="url(#pcaGrad)" dot={{ r: 3, fill: "#a78bfa" }} animationDuration={1500} />
                  <Line type="monotone" dataKey="variance" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="5 3" dot={{ r: 2, fill: "#22d3ee" }} animationDuration={1500} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
