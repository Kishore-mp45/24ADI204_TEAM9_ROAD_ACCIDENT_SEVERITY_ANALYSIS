import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Database, Target, AlertTriangle, Cloud } from "lucide-react";
import { ChartCard, KPISkeleton } from "@/components/ui/ChartCard";
import { fetchKPIs, fetchSeverityPie, fetchSeverityCount, fetchDayNight, fetchTemporalHeatmap, fetchTopStates, fetchInfraBar } from "@/lib/api";
import { SEVERITY_COLORS, CHART_COLORS, AXIS_STYLE, GRID_STYLE, STATE_MAP, useAsyncData } from "@/lib/charts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "rgba(11,17,32,0.92)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "0.75rem" },
  itemStyle: { color: "#94a3b8", fontSize: 12 },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};

function KPICard({ label, value, icon: Icon, color, delay }: { label: string; value: string; icon: React.ElementType; color: string; delay: string }) {
  return (
    <div className={`glass-card kpi-glow rounded-2xl p-6 animate-fade-in ${delay}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">{label}</span>
        <Icon size={20} style={{ color }} strokeWidth={2} />
      </div>
      <span className="text-3xl font-extrabold tracking-tighter text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

const CustomPieLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, fill } = props;
  const RADIAN = Math.PI / 180;
  const isTiny = percent < 0.05;
  
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + (outerRadius) * cos;
  const sy = cy + (outerRadius) * sin;
  
  let yOffset = 0;
  if (isTiny) {
    if (name.includes("1")) yOffset = -20;
    if (name.includes("4")) yOffset = 20;
  }
  
  const mx = cx + (outerRadius + 10) * cos;
  const my = cy + (outerRadius + 10) * sin + yOffset;
  
  const ex = mx + (cos >= 0 ? 1 : -1) * 10;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} strokeWidth={1} fill="none" opacity={0.8}/>
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill={fill} fontSize={11} fontWeight={600} dominantBaseline="central">
        {name}: {(percent * 100).toFixed(percent < 0.01 ? 2 : 0)}%
      </text>
    </g>
  );
};

function HeatmapChart({ data }: { data: { day: string; hour: number; accidents: number }[] }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const maxVal = Math.max(...data.map((d) => d.accidents));
  return (
    <div className="w-full h-full overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex mb-1 pl-20">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-[var(--color-text-muted)] font-mono">{i}</div>
          ))}
        </div>
        {days.map((day) => (
          <div key={day} className="flex items-center mb-0.5">
            <div className="w-20 text-[10px] text-[var(--color-text-secondary)] font-medium truncate pr-2 text-right">{day.slice(0, 3)}</div>
            <div className="flex flex-1 gap-0.5">
              {Array.from({ length: 24 }, (_, h) => {
                const cell = data.find((d) => d.day === day && d.hour === h);
                const val = cell?.accidents || 0;
                const intensity = maxVal > 0 ? val / maxVal : 0;
                return (
                  <div key={h} className="flex-1 aspect-square rounded-sm transition-all duration-200 cursor-pointer hover:scale-125 hover:z-10 relative group"
                    style={{ background: intensity > 0 ? `rgba(59, 130, 246, ${0.1 + intensity * 0.85})` : "rgba(148,163,184,0.03)" }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-[9px] text-[var(--color-text-primary)] whitespace-nowrap z-20 shadow-xl">
                      {day} {h}:00 — {val.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-end gap-2 mt-3 pr-2">
          <span className="text-[9px] text-[var(--color-text-muted)]">Less</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(59,130,246,${i})` }} />
          ))}
          <span className="text-[9px] text-[var(--color-text-muted)]">More</span>
        </div>
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const [kpis, setKpis] = useState<{ total_sample: number; avg_severity: number; top_state: string; top_weather: string } | null>(null);
  const { data: pieData, loading: pieLoading } = useAsyncData(fetchSeverityPie);
  const { data: sevCountData, loading: sevCountLoading } = useAsyncData(fetchSeverityCount);
  const { data: dnData, loading: dnLoading } = useAsyncData(fetchDayNight);
  const { data: heatData, loading: heatLoading } = useAsyncData(fetchTemporalHeatmap);
  const { data: statesData, loading: statesLoading } = useAsyncData(fetchTopStates);
  const { data: infraData, loading: infraLoading } = useAsyncData(fetchInfraBar);

  useEffect(() => { fetchKPIs().then(setKpis).catch(console.error); }, []);

  const pieChartData = pieData?.map((d: { severity: number; count: number }) => ({
    name: `Severity ${d.severity}`, value: d.count,
  })) || [];
  
  const pieTotal = pieChartData.reduce((acc: number, cur: any) => acc + cur.value, 0);

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">Intelligence Overview</h2>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">System health and predictive performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* KPIs */}
        <div className="col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {!kpis ? (
              <><KPISkeleton /><KPISkeleton /><KPISkeleton /><KPISkeleton /></>
            ) : (
              <>
                <KPICard label="Total Records" value={kpis.total_sample.toLocaleString()} icon={Database} color="#6ea8fe" delay="animate-delay-1" />
                <KPICard label="Avg Severity" value={String(kpis.avg_severity)} icon={Target} color="#22d3ee" delay="animate-delay-2" />
                <KPICard label="Highest Danger State" value={kpis.top_state} icon={AlertTriangle} color="#fbbf24" delay="animate-delay-3" />
                <KPICard label="Most Common Weather" value={kpis.top_weather} icon={Cloud} color="#a78bfa" delay="animate-delay-4" />
              </>
            )}
          </div>
        </div>

        {/* Row 1: Temporal Heatmap (Chart #9) */}
        <div className="col-span-12 lg:col-span-8">
          <ChartCard 
            title="Temporal Heatmap — Accidents by Hour vs Day" 
            subtitle="Rush hour distribution across the week" 
            loading={heatLoading} 
            height={300}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[var(--color-accent)]">
                <li>Peak accident frequencies strongly correlate with standard commuter rush hours (7:00–9:00 AM and 3:00–6:00 PM).</li>
                <li>Weekends display significantly lower overall density with a shift toward late-night occurrences rather than distinct peak hour clusters.</li>
              </ul>
            }
          >
            {heatData && <HeatmapChart data={heatData} />}
          </ChartCard>
        </div>

        {/* Sidebar: Severity Donut */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <ChartCard 
            title="Accident Demographics" 
            subtitle="Proportion of severity" 
            loading={pieLoading} 
            height={280}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#6ea8fe]">
                <li>The dataset has been stratified to provide a balanced view across all four severity classes (S1: 22%, S2: 30%, S3: 20%, S4: 28%).</li>
                <li>This intentional balancing ensures visualizations and machine learning models are not overwhelmingly skewed by minor incidents.</li>
              </ul>
            }
          >
            {pieChartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
                  <Pie data={pieChartData} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none"
                    animationBegin={0} animationDuration={1200}
                    labelLine={false} label={CustomPieLabel}>
                    {pieChartData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number, name: string) => [`${value.toLocaleString()} (${((value / pieTotal) * 100).toFixed(2)}%)`, name]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} verticalAlign="bottom" height={30} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Day vs Night (existing) */}
          <ChartCard 
            title="Day vs Night Severity" 
            subtitle="Impact distribution by time of day" 
            loading={dnLoading} 
            height={220}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#a78bfa]">
                <li>Total accident volume naturally peaks during daytime operational hours given increased transit usage.</li>
                <li>Despite the lower total volume at night, the relative proportion of critical Severity 3 and 4 events sees noticeable scaling.</li>
              </ul>
            }
          >
            {dnData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dnData} barGap={4}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="period" {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  {["sev1", "sev2", "sev3", "sev4"].map((key, i) => (
                    <Bar key={key} dataKey={key} fill={SEVERITY_COLORS[i]} radius={[4, 4, 0, 0]} name={`Severity ${i + 1}`} animationDuration={1000} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Row 2: Severity Count Plot (Chart #2) + Infrastructure (Chart #11) */}
        <div className="col-span-12 lg:col-span-6">
          <ChartCard 
            title="Count Plot — Severity Level Distribution" 
            subtitle="Total accidents per severity class" 
            loading={sevCountLoading} 
            height={320}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#34d399]">
                <li>Demonstrates the results of our stratified sampling technique, producing a relatively balanced class distribution.</li>
                <li>Provides a robust, multi-class foundation for predictive modeling without the need for extreme SMOTE resampling.</li>
              </ul>
            }
          >
            {sevCountData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sevCountData} barCategoryGap="25%">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="severity" {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), "Accidents"]} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={1200}>
                    {sevCountData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <ChartCard 
            title="Impact of Traffic Infrastructure on Accident Frequency" 
            subtitle="Boolean road feature proximity" 
            loading={infraLoading} 
            height={320}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#fbbf24]">
                <li>Intersections equipped with Traffic Signals explicitly correlate with the highest volume of localized structural crashes.</li>
                <li>Crossings and Junction parameters also indicate profound risk clustering across built infrastructure.</li>
              </ul>
            }
          >
            {infraData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={infraData} layout="vertical" barCategoryGap="18%">
                  <CartesianGrid {...GRID_STYLE} horizontal={false} />
                  <XAxis type="number" {...AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <YAxis type="category" dataKey="feature" width={100} {...AXIS_STYLE} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), "Accidents"]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={1200}>
                    {infraData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
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
