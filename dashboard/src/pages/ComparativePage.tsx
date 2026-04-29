import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchDualAxisMonthly, fetchWeatherStacked } from "@/lib/api";
import { AXIS_STYLE, GRID_STYLE, SEVERITY_COLORS, useAsyncData } from "@/lib/charts";

const TT = {
  contentStyle: { background: "rgba(11,17,32,0.95)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "0.75rem" },
  itemStyle: { color: "#94a3b8", fontSize: 12 },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};

export default function ComparativePage() {
  const { data: dualData, loading: dualLoading } = useAsyncData(fetchDualAxisMonthly);
  const { data: weatherData, loading: weatherLoading } = useAsyncData(fetchWeatherStacked);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">Comparative Analysis</h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Compare conditions, severity shifts, and time periods using stacked proportions and dual-axis storytelling.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Stacked % Bar */}
        <div className="col-span-12">
          <ChartCard title="Stacked % Bar — Weather Condition vs Severity (Normalized)"
            subtitle="Proportional severity breakdown per weather — removes volume bias"
            loading={weatherLoading} height={380}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#fbbf24]">
                <li>After normalizing to 100%, all weather conditions show relatively stable proportional severity distributions, debunking the assumption that bad weather universally produces worse accidents.</li>
                <li>The newly stratified dataset (S1: 22%, S2: 30%, S3: 20%, S4: 28%) is preserved across weather conditions, indicating environmental factors do not radically skew the severity classification.</li>
                <li>Light Rain shows a marginal increase in Severity 4 proportion compared to Clear conditions, suggesting a small but real contribution of reduced traction to higher-impact crashes.</li>
              </ul>
            }
          >
            {Array.isArray(weatherData) && weatherData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherData} barCategoryGap="20%">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="weather" {...AXIS_STYLE} tick={{ fill: "#f8fafc", fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} tickLine={false} axisLine={false} />
                  <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip {...TT} formatter={(v: number, name: string) => [`${v}%`, name]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  {["sev1", "sev2", "sev3", "sev4"].map((key, i) => (
                    <Bar key={key} dataKey={key} stackId="s" fill={SEVERITY_COLORS[i]} name={`Severity ${i + 1}`}
                      radius={i === 3 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Dual Axis — full width now */}
        <div className="col-span-12">
          <ChartCard title="Dual-Axis Chart — Monthly Count + Average Severity"
            subtitle="Bars = accident volume (left axis) | Line = avg severity (right axis)"
            loading={dualLoading} height={440}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#a78bfa]">
                <li>High-count months do NOT always correspond to high average severity — winter months have elevated crash volumes yet the severity line remains flat, suggesting mass low-severity incidents dominate.</li>
                <li>Certain low-volume months show unexpected severity spikes, indicating that sparse but serious incidents can skew severity metrics when sample sizes are small.</li>
                <li>The divergence between the two axes in 2020 (lockdown period) is particularly revealing — low counts combined with elevated severity suggest only higher-risk trips were made.</li>
              </ul>
            }
          >
            {Array.isArray(dualData) && dualData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dualData} margin={{ top: 10, right: 40, bottom: 30, left: 10 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="period" {...AXIS_STYLE} tick={{ ...AXIS_STYLE.tick, fontSize: 8 }} interval={Math.floor(dualData.length / 8)} angle={-30} textAnchor="end" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <YAxis yAxisId="right" orientation="right" domain={[1.8, 2.6]} {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(1)} />
                  <Tooltip {...TT} formatter={(v: number, n: string) => [n === "avgSeverity" ? v.toFixed(3) : v.toLocaleString(), n === "avgSeverity" ? "Avg Severity" : "Accident Count"]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  <Bar yAxisId="left" dataKey="count" fill="rgba(110,168,254,0.5)" stroke="#6ea8fe" strokeWidth={0.5} radius={[3, 3, 0, 0]} name="Accident Count" />
                  <Line yAxisId="right" type="monotone" dataKey="avgSeverity" stroke="#fb7185" strokeWidth={2.5} dot={false} name="Avg Severity" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
