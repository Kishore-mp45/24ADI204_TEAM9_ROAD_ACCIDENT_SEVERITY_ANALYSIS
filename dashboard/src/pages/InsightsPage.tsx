import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
  LineChart, Line,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchWeatherStacked, fetchWindHist, fetchWindSeverityTrend } from "@/lib/api";
import { SEVERITY_COLORS, AXIS_STYLE, GRID_STYLE, useAsyncData } from "@/lib/charts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "rgba(11,17,32,0.92)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "0.75rem" },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};

const GEO_COLOR_MAP: Record<number, string> = { 1: "#34d399", 2: "#6ea8fe", 3: "#fbbf24", 4: "#fb7185" };

export default function InsightsPage() {
  const { data: weatherData, loading: weatherLoading } = useAsyncData(fetchWeatherStacked);
  const { data: windData, loading: windLoading } = useAsyncData(fetchWindHist);
  const { data: windTrendData, loading: windTrendLoading } = useAsyncData(fetchWindSeverityTrend);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">Advanced Insights</h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Geospatial breakdowns, weather impact analysis, and severity trend correlations.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Weather Stacked Bar (Chart #13) */}
        <div className="col-span-12">
          <ChartCard 
            title="Weather Condition vs. Accident Severity" 
            subtitle="100% Stacked Bar Chart — percentage breakdown" 
            loading={weatherLoading} 
            height={400}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#fbbf24]">
                <li>Debunks the assumption that extreme weather creates universally extreme severity: normalized proportions remain relatively stable across weather types.</li>
                <li>Demonstrates that localized clear-weather accidents often result in unexpectedly high severity proportions due to higher ambient driving speeds.</li>
              </ul>
            }  
          >
            {weatherData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherData} barCategoryGap="20%">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="weather" {...AXIS_STYLE} tickLine={false} axisLine={false} tick={{ fill: "#f8fafc", fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number, name: string) => [`${value}%`, name]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  {["sev1", "sev2", "sev3", "sev4"].map((key, i) => (
                    <Bar key={key} dataKey={key} stackId="weather" fill={SEVERITY_COLORS[i]} name={`Severity ${i + 1}`}
                      radius={i === 3 ? [4, 4, 0, 0] : [0, 0, 0, 0]} animationDuration={1200} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Line Plot — Severity Trend Across Wind Speed (Chart #6) */}
        <div className="col-span-12 lg:col-span-6">
          <ChartCard 
            title="Line Plot — Severity Trend Across Wind Speed" 
            subtitle="Average severity index plotted against wind speed bins" 
            loading={windTrendLoading} 
            height={380}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#22d3ee]">
                <li>Traces the subtle progression of accident impact severity as atmospheric turbulence (wind speed mapping) increases.</li>
                <li>Displays localized statistical variation at extreme edge cases representing sparse, unstable high-wind anomalies.</li>
              </ul>
            }  
          >
            {windTrendData && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={windTrendData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <defs>
                    <linearGradient id="trendLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#6ea8fe" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="windSpeed" {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v} mph`} />
                  <YAxis domain={[2, 3]} {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(1)} />
                  <Tooltip {...TOOLTIP_STYLE}
                    labelFormatter={(label) => `Wind Speed: ${label} mph`}
                    formatter={(value: number, name: string) => {
                      if (name === "avgSeverity") return [value.toFixed(3), "Avg Severity"];
                      return [value.toLocaleString(), "Sample Size"];
                    }}
                  />
                  <Line type="monotone" dataKey="avgSeverity" stroke="url(#trendLineGrad)" strokeWidth={3}
                    dot={{ r: 5, fill: "#6ea8fe", stroke: "#060a10", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#22d3ee", stroke: "#060a10", strokeWidth: 2 }}
                    animationDuration={2000} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Wind Speed Distribution */}
        <div className="col-span-12 lg:col-span-6">
          <ChartCard 
            title="Distribution Plot — Wind Speed Density" 
            subtitle="Frequency distribution of wind speed readings" 
            loading={windLoading} 
            height={380}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#6ea8fe]">
                <li>Proves that the vast majority of incidents occur well within standard, safe wind limits (0–15 mph), exhibiting a severe right-skew.</li>
                <li>Verifies the necessity of advanced skewness normalization (log scaling) for continuous weather distributions before model processing.</li>
              </ul>
            }  
          >
            {windData && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={windData}>
                  <defs>
                    <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#6ea8fe" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#6ea8fe" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="speed" {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v} mph`} />
                  <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), "Count"]} labelFormatter={(label) => `Wind Speed: ${label} mph`} />
                  <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2.5} fill="url(#windGrad)" animationDuration={1800} dot={false}
                    activeDot={{ r: 5, fill: "#22d3ee", stroke: "#060a10", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Severity Legend */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Severity 1", color: "#34d399", desc: "Minor / Low Impact" },
            { label: "Severity 2", color: "#6ea8fe", desc: "Moderate Disruption" },
            { label: "Severity 3", color: "#fbbf24", desc: "Significant Impact" },
            { label: "Severity 4", color: "#fb7185", desc: "Critical / Major" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }} />
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">{s.label}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
