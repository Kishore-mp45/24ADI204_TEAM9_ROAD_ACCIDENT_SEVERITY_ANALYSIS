import { useState, useEffect } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchFeatureHist, fetchTempBox, fetchDistributionStats, fetchDataSnapshot, fetchTempViolin } from "@/lib/api";
import { SEVERITY_COLORS, AXIS_STYLE, GRID_STYLE, useAsyncData } from "@/lib/charts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "rgba(11,17,32,0.92)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "0.75rem" },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};

const FEATURES = [
  { value: "Temperature(F)", label: "Temperature (°F)" },
  { value: "Wind_Speed(mph)", label: "Wind Speed (mph)" },
  { value: "Distance(mi)", label: "Distance (mi)" },
  { value: "Humidity(%)", label: "Humidity (%)" },
  { value: "Pressure(in)", label: "Pressure (in)" },
  { value: "Visibility(mi)", label: "Visibility (mi)" },
  { value: "Precipitation(in)", label: "Precipitation (in)" },
];

// ── Custom Box Plot ──
function BoxPlotChart({ data }: { data: { severity: string; min: number; q1: number; median: number; q3: number; max: number; mean: number }[] }) {
  return (
    <div className="w-full h-full flex items-end justify-around gap-4 px-8 pb-8 pt-4">
      {data.map((d, i) => {
        const range = d.max - d.min || 1;
        const scale = (v: number) => ((v - d.min) / range) * 100;
        return (
          <div key={d.severity} className="flex flex-col items-center flex-1 group relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 text-[10px] z-10 shadow-2xl whitespace-nowrap pointer-events-none">
              <p className="font-bold text-[var(--color-text-primary)] mb-1">{d.severity}</p>
              <p className="text-[var(--color-text-muted)]">Max: {d.max}°F | Q3: {d.q3}°F</p>
              <p className="text-[#6ea8fe]">Median: {d.median}°F | Mean: {d.mean}°F</p>
              <p className="text-[var(--color-text-muted)]">Q1: {d.q1}°F | Min: {d.min}°F</p>
            </div>
            <div className="relative w-12 h-[260px] flex flex-col items-center">
              <div className="absolute w-px bg-[var(--color-text-muted)]" style={{ bottom: `${scale(d.min)}%`, height: `${scale(d.max) - scale(d.min)}%` }} />
              <div className="absolute w-6 h-px bg-[var(--color-text-muted)]" style={{ bottom: `${scale(d.max)}%` }} />
              <div className="absolute w-6 h-px bg-[var(--color-text-muted)]" style={{ bottom: `${scale(d.min)}%` }} />
              <div className="absolute w-10 rounded-md transition-all duration-300 group-hover:w-12 group-hover:shadow-lg"
                style={{ bottom: `${scale(d.q1)}%`, height: `${scale(d.q3) - scale(d.q1)}%`, background: SEVERITY_COLORS[i], opacity: 0.7, boxShadow: `0 0 20px ${SEVERITY_COLORS[i]}33` }} />
              <div className="absolute w-10 h-0.5 bg-white z-10 rounded-full group-hover:w-12 transition-all" style={{ bottom: `${scale(d.median)}%` }} />
              <div className="absolute w-2 h-2 rounded-full bg-white z-10 border border-[var(--color-background)]" style={{ bottom: `${scale(d.mean)}%`, transform: "translateY(50%)" }} />
            </div>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] mt-3 uppercase tracking-wider">{d.severity.replace("Severity ", "Sev ")}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Violin Plot (density curves overlaid) ──
function ViolinPlot({ data }: { data: { severity: number; label: string; points: { temp: number; density: number }[]; stats: { mean: number; median: number; std: number; count: number } }[] }) {
  // Merge all severity density curves into one dataset keyed by temperature
  const tempMap: Record<number, Record<string, number>> = {};
  data.forEach((sev) => {
    sev.points.forEach((p) => {
      if (!tempMap[p.temp]) tempMap[p.temp] = { temp: p.temp };
      tempMap[p.temp][`sev${sev.severity}`] = p.density;
    });
  });
  const merged = Object.values(tempMap).sort((a, b) => a.temp - b.temp);

  return (
    <div className="w-full h-full flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={merged} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <defs>
            {data.map((sev, i) => (
              <linearGradient key={sev.severity} id={`violinGrad${sev.severity}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SEVERITY_COLORS[i]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={SEVERITY_COLORS[i]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="temp" {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}°F`} />
          <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(3)} />
          <Tooltip {...TOOLTIP_STYLE}
            labelFormatter={(label) => `Temperature: ${label}°F`}
            formatter={(value: number, name: string) => {
              const sevNum = name.replace("sev", "");
              return [value.toFixed(5), `Severity ${sevNum}`];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          {data.map((sev, i) => (
            <Area key={sev.severity} type="monotone" dataKey={`sev${sev.severity}`} name={`Severity ${sev.severity}`}
              stroke={SEVERITY_COLORS[i]} strokeWidth={2} fill={`url(#violinGrad${sev.severity})`}
              animationDuration={1500} dot={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      {/* Stats Row */}
      <div className="flex gap-3 mt-2 px-2">
        {data.map((sev, i) => (
          <div key={sev.severity} className="flex-1 rounded-xl p-3 text-center" style={{ background: `${SEVERITY_COLORS[i]}10`, border: `1px solid ${SEVERITY_COLORS[i]}22` }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: SEVERITY_COLORS[i] }}>Sev {sev.severity}</p>
            <p className="text-lg font-black text-[var(--color-text-primary)]">{sev.stats.mean}°F</p>
            <p className="text-[9px] text-[var(--color-text-muted)]">μ±{sev.stats.std} | n={sev.stats.count.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DistributionPage() {
  const [feature, setFeature] = useState(FEATURES[0].value);
  const [stats, setStats] = useState<{ skewness: number; kurtosis: number; skew_type: string; kurt_type: string } | null>(null);
  const [snapshot, setSnapshot] = useState<{ id: string; severity: number; city: string; state: string; status: string }[]>([]);

  const { data: histData, loading: histLoading } = useAsyncData(() => fetchFeatureHist(feature), [feature]);
  const { data: boxData, loading: boxLoading } = useAsyncData(fetchTempBox);
  const { data: violinData, loading: violinLoading } = useAsyncData(fetchTempViolin);

  useEffect(() => { fetchDistributionStats(feature).then(setStats).catch(console.error); }, [feature]);
  useEffect(() => { fetchDataSnapshot().then(setSnapshot).catch(console.error); }, []);

  const featureLabel = FEATURES.find((f) => f.value === feature)?.label || feature;

  return (
    <div>
      <div className="mb-8">
        <span className="text-[#6ea8fe] font-bold tracking-[0.2em] text-[10px] uppercase mb-2 block">Analytical Lens</span>
        <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-none mb-3">Distribution Analysis</h1>
        <p className="text-[var(--color-text-secondary)] text-base max-w-2xl">Deconstruct the spread, frequency, and central tendency of operational features.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Distribution Plot - Feature Histogram (Chart #3 / #5) */}
        <div className="col-span-12 lg:col-span-8">
          <ChartCard
            title={`Distribution Plot — ${featureLabel}`}
            subtitle="Density & spread analysis"
            height={380}
            loading={histLoading}
            action={
              <select value={feature} onChange={(e) => setFeature(e.target.value)}
                className="bg-[rgba(17,24,39,0.5)] border border-[rgba(148,163,184,0.1)] text-sm text-[var(--color-text-primary)] rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[rgba(110,168,254,0.3)] cursor-pointer">
                {FEATURES.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
              </select>
            }
          >
            {histData && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={histData}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ea8fe" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6ea8fe" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="bin" {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), "Count"]} labelFormatter={(label) => `${featureLabel}: ${label}`} />
                  <Area type="monotone" dataKey="count" stroke="#6ea8fe" strokeWidth={2} fill="url(#histGrad)" animationDuration={1500} dot={false}
                    activeDot={{ r: 4, fill: "#6ea8fe", stroke: "#060a10", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Stats Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center flex-1 text-center min-h-[160px]">
            <span className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-[0.2em] mb-2">Skewness Index</span>
            <span className="text-5xl font-black tracking-tighter text-[var(--color-text-primary)]">{stats?.skewness ?? "..."}</span>
            <span className="text-sm font-semibold text-[#22d3ee] mt-1">{stats?.skew_type ?? "Calculating"}</span>
          </div>
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center flex-1 text-center min-h-[160px]">
            <span className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-[0.2em] mb-2">Kurtosis Profile</span>
            <span className="text-5xl font-black tracking-tighter text-[var(--color-text-primary)]">{stats?.kurtosis ?? "..."}</span>
            <span className="text-sm font-semibold text-[#a78bfa] mt-1">{stats?.kurt_type ?? "Calculating"}</span>
          </div>
        </div>

        {/* Violin Plot (Chart #10) */}
        <div className="col-span-12">
          <ChartCard title="Violin Plot — Temperature Distribution Across Severity Levels" subtitle="Density curves overlaid per severity with summary statistics" loading={violinLoading} height={420}>
            {violinData && <ViolinPlot data={violinData} />}
          </ChartCard>
        </div>

        {/* Box Plot */}
        <div className="col-span-12">
          <ChartCard title="Temperature Distribution by Severity" subtitle="Box plot — hover for detailed statistics" loading={boxLoading} height={340}>
            {boxData && <BoxPlotChart data={boxData} />}
          </ChartCard>
        </div>

        {/* Data Snapshot Table */}
        <div className="col-span-12 glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Live Data Snapshot</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Random 5-row sample from dataset</p>
            </div>
            <button onClick={() => fetchDataSnapshot().then(setSnapshot)}
              className="text-xs bg-[rgba(17,24,39,0.5)] hover:bg-[rgba(17,24,39,0.8)] border border-[rgba(148,163,184,0.1)] px-4 py-2 rounded-xl text-[var(--color-text-secondary)] font-semibold transition-colors">
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[rgba(17,24,39,0.3)]">
                  {["Accident ID", "Severity", "City", "State", "Status"].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.15em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {snapshot.map((r, i) => (
                  <tr key={i} className="hover:bg-[rgba(59,130,246,0.05)] transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-[var(--color-text-primary)]">{r.id}</td>
                    <td className="px-6 py-3.5 text-sm font-bold">{r.severity} <span className="text-[var(--color-text-muted)] font-normal text-xs">pts</span></td>
                    <td className="px-6 py-3.5 text-sm text-[var(--color-text-secondary)]">{r.city}</td>
                    <td className="px-6 py-3.5 text-sm text-[var(--color-text-secondary)]">{r.state}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        r.status === "Critical" ? "bg-[rgba(251,113,133,0.1)] text-[#fb7185] border-[rgba(251,113,133,0.2)]"
                          : "bg-[rgba(52,211,153,0.1)] text-[#34d399] border-[rgba(52,211,153,0.2)]"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
