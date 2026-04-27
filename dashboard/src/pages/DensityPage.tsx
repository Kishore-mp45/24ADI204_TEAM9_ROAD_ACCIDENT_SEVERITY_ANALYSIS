import { useState } from "react";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchCalendarHeatmap } from "@/lib/api";
import { useAsyncData } from "@/lib/charts";

// ── Interactive Calendar Heatmap ──
function CalendarHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  const byYear: Record<string, { date: string; count: number }[]> = {};
  data.forEach(d => {
    const year = d.date.slice(0, 4);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(d);
  });

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const CELL = 12;
  const GAP = 2;
  const COLS = 53;
  const STEP = CELL + GAP;

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="w-full space-y-5 relative"
      onMouseLeave={() => setTooltip(null)}
    >
      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 px-3 py-2 rounded-xl text-xs font-medium shadow-2xl border"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 36,
            background: "rgba(11,17,32,0.97)",
            border: "1px solid rgba(148,163,184,0.15)",
            color: "#f1f5f9",
            minWidth: 140,
          }}
        >
          <span className="text-[#94a3b8]">{tooltip.date}</span>
          <br />
          <span className="text-[#6ea8fe] font-bold">{tooltip.count.toLocaleString()}</span>
          <span className="text-[#64748b]"> accidents</span>
        </div>
      )}

      {/* Month labels (shared, approximate) */}
      <div className="flex ml-10 mb-1">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
          <div key={m} style={{ width: STEP * 4.35, fontSize: 9 }} className="text-[var(--color-text-muted)] font-mono">{m}</div>
        ))}
      </div>

      {Object.entries(byYear).sort().map(([year, days]) => {
        // Build a map of date → count for quick lookup
        const dateMap: Record<string, number> = {};
        days.forEach(d => { dateMap[d.date] = d.count; });

        // Generate all weeks for this year
        const firstDay = new Date(`${year}-01-01`);
        const startDow = firstDay.getDay(); // 0=Sun
        const cells: { date: string | null; count: number }[][] = [];
        let current = new Date(firstDay);
        current.setDate(current.getDate() - startDow); // back to Sunday

        for (let w = 0; w < COLS; w++) {
          const week: { date: string | null; count: number }[] = [];
          for (let d = 0; d < 7; d++) {
            const dateStr = current.toISOString().slice(0, 10);
            const inYear = current.getFullYear() === parseInt(year);
            week.push({ date: inYear ? dateStr : null, count: inYear ? (dateMap[dateStr] || 0) : 0 });
            current.setDate(current.getDate() + 1);
          }
          cells.push(week);
        }

        const W = COLS * STEP + 40;
        const H = 7 * STEP;

        return (
          <div key={year}>
            <div className="flex items-start gap-2">
              {/* Day labels */}
              <div style={{ width: 28 }} className="flex flex-col gap-0" style={{ paddingTop: 0 }}>
                {dayNames.map((name, di) => (
                  <div key={di} style={{ height: STEP, fontSize: 8, lineHeight: `${STEP}px` }} className="text-right pr-1 text-[var(--color-text-muted)] font-mono">
                    {di % 2 === 1 ? name : ""}
                  </div>
                ))}
              </div>

              {/* Year label */}
              <div>
                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] mb-1 font-mono">{year}</p>
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
                  {cells.map((week, wi) =>
                    week.map((cell, di) => {
                      if (!cell.date) return null;
                      const intensity = cell.count > 0 ? cell.count / maxCount : 0;
                      const bg = intensity > 0
                        ? `rgba(59,130,246,${0.08 + intensity * 0.88})`
                        : "rgba(148,163,184,0.04)";
                      const cx = wi * STEP;
                      const cy = di * STEP;
                      return (
                        <rect key={`${wi}-${di}`}
                          x={cx} y={cy} width={CELL} height={CELL} rx={2}
                          fill={bg}
                          style={{ cursor: "pointer", transition: "fill 0.1s" }}
                          onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, date: cell.date!, count: cell.count })}
                          onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                        />
                      );
                    })
                  )}
                </svg>
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px] text-[var(--color-text-muted)]">Less</span>
        {[0.08, 0.25, 0.45, 0.65, 0.88].map((op) => (
          <div key={op} style={{ width: CELL, height: CELL, borderRadius: 2, background: `rgba(59,130,246,${op})` }} />
        ))}
        <span className="text-[9px] text-[var(--color-text-muted)]">More</span>
      </div>
    </div>
  );
}

export default function DensityPage() {
  const { data: calData, loading: calLoading } = useAsyncData(fetchCalendarHeatmap);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">
          Density &amp; Patterns
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Calendar-level daily accident patterns across the full 2016–2023 dataset span. Hover over any cell to see exact values.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ChartCard
            title="Calendar Heatmap — Daily Accident Intensity"
            subtitle="GitHub-style daily accident count heatmap — hover any cell to see exact date & count"
            loading={calLoading}
            height={580}
            interpretation={
              <ul className="list-disc pl-4 marker:text-[#22d3ee]">
                <li>The annual calendar clearly shows high-intensity clusters (darker blue cells) appearing consistently during autumn and winter months (Oct–Jan), aligning with adverse seasonal driving conditions.</li>
                <li>A visible intensity gap is present around March–May 2020, directly corresponding to COVID-19 lockdown periods where road traffic volume dropped significantly nationwide.</li>
                <li>Year-over-year comparisons reveal that 2021 and 2022 show noticeably higher daily intensities than pre-pandemic years, reflecting the traffic rebound and increased data collection coverage.</li>
              </ul>
            }
          >
            {Array.isArray(calData) && calData.length > 0 && (
              <CalendarHeatmap data={calData} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
