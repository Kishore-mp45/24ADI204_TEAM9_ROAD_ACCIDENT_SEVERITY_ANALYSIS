import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchTopCities, fetchSunburst } from "@/lib/api";
import { AXIS_STYLE, GRID_STYLE, useAsyncData } from "@/lib/charts";

const TT = {
  contentStyle: { background: "rgba(11,17,32,0.95)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "0.75rem" },
  itemStyle: { color: "#94a3b8", fontSize: 12 },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};

const SEV_COLOR: Record<number, string> = { 1: "#34d399", 2: "#6ea8fe", 3: "#fbbf24", 4: "#fb7185" };
const WEATHER_COLORS = ["#6ea8fe", "#22d3ee", "#a78bfa", "#fbbf24", "#fb7185"];

// ── Lollipop custom bar ──
const LollipopShape = (props: any) => {
  const { x, y, width, height, fill } = props;
  const cx = x + width / 2;
  return (
    <g>
      <line x1={10} y1={y + height / 2} x2={cx + width / 2 - 4} y2={y + height / 2}
        stroke={fill} strokeWidth={2} strokeOpacity={0.6} />
      <circle cx={cx + width / 2 - 4} cy={y + height / 2} r={7} fill={fill} stroke="#060a10" strokeWidth={1.5} />
    </g>
  );
};

// ── Sunburst: multi-ring PieChart ──
function SunburstChart({ data }: { data: any[] }) {
  const outerRing = useMemo(() => {
    const byWeather: Record<string, number> = {};
    data.forEach(d => { byWeather[d.weather] = (byWeather[d.weather] || 0) + d.count; });
    return Object.entries(byWeather).map(([name, value]) => ({ name, value }));
  }, [data]);

  const innerRing = useMemo(() => {
    const bySev: Record<string, number> = {};
    data.forEach(d => {
      const k = `Sev ${d.severity}`;
      bySev[k] = (bySev[k] || 0) + d.count;
    });
    return Object.entries(bySev).map(([name, value]) => ({ name, value, severity: parseInt(name.split(" ")[1]) }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={outerRing} cx="50%" cy="50%" innerRadius={110} outerRadius={150}
          dataKey="value" nameKey="name" paddingAngle={2} labelLine={false}>
          {outerRing.map((_, i) => <Cell key={i} fill={WEATHER_COLORS[i % WEATHER_COLORS.length]} fillOpacity={0.85} />)}
        </Pie>
        <Pie data={innerRing} cx="50%" cy="50%" innerRadius={60} outerRadius={105}
          dataKey="value" nameKey="name" paddingAngle={2}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: "#64748b", strokeWidth: 1 }}>
          {innerRing.map((d) => <Cell key={d.name} fill={SEV_COLOR[d.severity] || "#6ea8fe"} />)}
        </Pie>
        <Tooltip {...TT} formatter={(v: number) => [v.toLocaleString(), "Accidents"]} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function HierarchyPage() {
  const { data: citiesData, loading: citiesLoading } = useAsyncData(fetchTopCities);
  const { data: sunburstData, loading: sbLoading } = useAsyncData(fetchSunburst);

  const cityDataSorted = Array.isArray(citiesData)
    ? [...citiesData].sort((a: any, b: any) => a.count - b.count)
    : [];

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">
          Hierarchy &amp; Categories
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Categorical relationships and hierarchical breakdowns across weather conditions, cities, and severity levels.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Sunburst — Weather → Severity */}
        <div className="col-span-12 lg:col-span-6">
          <ChartCard
            title="Sunburst — Weather → Severity Drill-Down"
            subtitle="Outer ring: Weather type | Inner ring: Severity proportion"
            loading={sbLoading}
            height={440}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#a78bfa]">
                <li>Clear weather conditions dominate the outer ring, indicating that driver overconfidence in good conditions is a primary crash contributor.</li>
                <li>The inner severity rings remain structurally similar across weather types, revealing that weather affects crash frequency more than outcome severity.</li>
                <li>Cloudy and Light Rain categories produce a marginally elevated Severity 3 inner proportion compared to Clear conditions.</li>
              </ul>
            }
          >
            {Array.isArray(sunburstData) && sunburstData.length > 0 && (
              <SunburstChart data={sunburstData} />
            )}
          </ChartCard>
        </div>

        {/* Lollipop — Top 15 Cities */}
        <div className="col-span-12 lg:col-span-6">
          <ChartCard
            title="Lollipop Chart — Top 15 Most Accident-Prone Cities"
            subtitle="Cleaner alternative to a bar chart — circle marks the exact count"
            loading={citiesLoading}
            height={440}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#34d399]">
                <li>Miami leads all cities with the highest absolute accident count, reflecting its dense highway network and high tourist traffic volumes.</li>
                <li>The top 5 cities collectively account for a disproportionate share of total national incidents, emphasizing that urban density is the strongest single predictor of crash frequency.</li>
                <li>Several cities from the same state cluster together (e.g., multiple Texas metros), suggesting that state-level infrastructure policy may be a systemic risk factor.</li>
              </ul>
            }
          >
            {cityDataSorted.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityDataSorted} layout="vertical" barSize={14} margin={{ left: 120, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid {...GRID_STYLE} horizontal={false} />
                  <XAxis type="number" {...AXIS_STYLE} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <YAxis type="category" dataKey="city" width={115} {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip {...TT} formatter={(v: number) => [v.toLocaleString(), "Accidents"]} />
                  <Bar dataKey="count" shape={<LollipopShape />} animationDuration={1200}>
                    {cityDataSorted.map((_: any, i: number) => {
                      const frac = i / cityDataSorted.length;
                      const r = Math.round(110 + frac * 145);
                      const g = Math.round(168 - frac * 60);
                      const b = Math.round(254 - frac * 120);
                      return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
