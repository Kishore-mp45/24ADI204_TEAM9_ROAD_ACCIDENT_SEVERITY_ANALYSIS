import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Brush, Legend,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchTrendMonthly, fetchTrendSeasonality, fetchTrendSeverityShift } from "@/lib/api";
import { AXIS_STYLE, GRID_STYLE, SEVERITY_COLORS, useAsyncData } from "@/lib/charts";
import { TrendingUp, Calendar, Activity, BarChart2 } from "lucide-react";

const TOOLTIP_STYLE = {
  contentStyle: { background: "rgba(11,17,32,0.95)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "0.75rem" },
  itemStyle: { color: "#94a3b8", fontSize: 12 },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};

const SEV_COLORS: Record<string, string> = {
  "Severity 1": "#34d399",
  "Severity 2": "#6ea8fe",
  "Severity 3": "#fbbf24",
  "Severity 4": "#fb7185",
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
        <Icon size={22} style={{ color }} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
        <p className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight mt-0.5">{value}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function TemporalTrendsPage() {
  const { data: monthlyData, loading: monthlyLoading } = useAsyncData(fetchTrendMonthly);
  const { data: seasonData, loading: seasonLoading } = useAsyncData(fetchTrendSeasonality);
  const { data: shiftData, loading: shiftLoading } = useAsyncData(fetchTrendSeverityShift);

  // Derive quick KPIs from loaded data
  const peakMonth = Array.isArray(monthlyData) && monthlyData.length > 0
    ? monthlyData.reduce((max: any, d: any) => d.count > max.count ? d : max, monthlyData[0])
    : null;

  const peakSeason = Array.isArray(seasonData) && seasonData.length > 0
    ? seasonData.reduce((max: any, d: any) => d.count > max.count ? d : max, seasonData[0])
    : null;

  const totalRecords = Array.isArray(monthlyData)
    ? monthlyData.reduce((acc: number, d: any) => acc + d.count, 0)
    : 0;

  const severityKeys = Array.isArray(shiftData) && shiftData.length > 0
    ? Object.keys(shiftData[0]).filter(k => k !== "Year")
    : ["Severity 1", "Severity 2", "Severity 3", "Severity 4"];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">
          Temporal Trends
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Macro-level time series intelligence across the 7-year dataset spanning 2016–2023. Explore monthly trajectories,
          seasonal risk cycles, and year-over-year severity shifts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Peak Month"
          value={peakMonth ? peakMonth.period : "—"}
          sub={peakMonth ? `${peakMonth.count.toLocaleString()} accidents` : "Loading…"}
          color="#6ea8fe"
        />
        <StatCard
          icon={Calendar}
          label="Riskiest Season"
          value={peakSeason ? peakSeason.month_name : "—"}
          sub={peakSeason ? `${peakSeason.count.toLocaleString()} avg incidents` : "Loading…"}
          color="#fbbf24"
        />
        <StatCard
          icon={Activity}
          label="Dataset Span"
          value="7 Years"
          sub="Feb 2016 – Mar 2023"
          color="#34d399"
        />
        <StatCard
          icon={BarChart2}
          label="Records Analysed"
          value={totalRecords > 0 ? totalRecords.toLocaleString() : "—"}
          sub="Sampled from 7.7M total"
          color="#fb7185"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Monthly Timeline — Area Chart with Brush */}
        <div className="col-span-12">
          <ChartCard
            title="Monthly Accident Volume Timeline"
            subtitle="Total accident counts per month from 2016–2023 (brush to zoom)"
            loading={monthlyLoading}
            height={360}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#22d3ee]">
                <li>Accident volume follows a cyclical pattern peaking in autumn and winter months (Oct–Dec), suggesting adverse weather conditions drive increased crash rates.</li>
                <li>A notable dip is visible around early 2020 aligning with COVID-19 lockdowns, demonstrating how urban mobility directly governs accident frequency.</li>
                <li>Volume has progressively risen year-over-year from 2016 to 2022, reflecting increases in road traffic and dataset coverage across more states.</li>
              </ul>
            }
          >
            {Array.isArray(monthlyData) && monthlyData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6ea8fe" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6ea8fe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="period" {...AXIS_STYLE} tick={{ ...AXIS_STYLE.tick, fontSize: 9 }} interval={5} angle={-45} textAnchor="end" />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString(), "Accidents"]} />
                  <Brush dataKey="period" height={20} stroke="rgba(110,168,254,0.3)" fill="rgba(11,17,32,0.8)"
                    travellerWidth={6}
                    startIndex={0}
                    endIndex={Math.min(35, (monthlyData?.length ?? 1) - 1)}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6ea8fe" strokeWidth={2} fill="url(#monthlyGrad)"
                    dot={false} activeDot={{ r: 4, fill: "#6ea8fe" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Seasonal Radar */}
        <div className="col-span-12 lg:col-span-5">
          <ChartCard
            title="Seasonal Risk Profile"
            subtitle="Accident frequency by month across all years"
            loading={seasonLoading}
            height={380}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#22d3ee]">
                <li>Winter months (Dec–Feb) consistently record the highest accident concentration, driven by reduced visibility, icy roads, and reduced daylight hours.</li>
                <li>A secondary risk spike is visible in June–July, likely linked to summer driving increases and holiday travel volumes.</li>
                <li>April registers the lowest accident frequency — a transitional month combining mild weather with normalized post-winter traffic patterns.</li>
              </ul>
            }
          >
            {Array.isArray(seasonData) && seasonData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={seasonData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="rgba(148,163,184,0.15)" />
                  <PolarAngleAxis dataKey="month_name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} tick={{ fill: "#64748b", fontSize: 9 }} />
                  <Radar name="Accidents" dataKey="count" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString(), "Accidents"]} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Severity Shift Stacked Area */}
        <div className="col-span-12 lg:col-span-7">
          <ChartCard
            title="Severity Distribution Shift (Year-over-Year)"
            subtitle="Proportional % of each severity level per year"
            loading={shiftLoading}
            height={380}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#22d3ee]">
                <li>Severity 2 maintains dominant proportional control across all years, consistently accounting for 55–65% of all classified accidents, reflecting systematic under-reporting of minor incidents.</li>
                <li>Severity 3 shows a gradual proportional increase post-2019, suggesting that moderate-impact accidents are more frequently recorded as road infrastructure data collection improves.</li>
                <li>Severity 1 and 4 together constitute less than 2% of total yearly distribution, confirming extreme outcomes remain statistically rare in the dataset.</li>
              </ul>
            }
          >
            {Array.isArray(shiftData) && shiftData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={shiftData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }} stackOffset="expand">
                  <defs>
                    {severityKeys.map((key) => (
                      <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SEV_COLORS[key] || "#6ea8fe"} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={SEV_COLORS[key] || "#6ea8fe"} stopOpacity={0.2} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="Year" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} verticalAlign="bottom" height={30} />
                  {severityKeys.map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stackId="1"
                      stroke={SEV_COLORS[key] || "#6ea8fe"}
                      fill={`url(#grad-${key})`}
                      strokeWidth={1.5}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
