import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ZAxis, Cell,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchGeoSeverity, fetchGeo2dHist } from "@/lib/api";
import { SEVERITY_COLORS, AXIS_STYLE, GRID_STYLE, useAsyncData } from "@/lib/charts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "rgba(11,17,32,0.92)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "0.75rem" },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 as const },
};

const SEV_COLOR: Record<number, string> = { 1: "#34d399", 2: "#6ea8fe", 3: "#fbbf24", 4: "#fb7185" };

export default function GeospatialPage() {
  const { data: geoSevData, loading: geoSevLoading } = useAsyncData(fetchGeoSeverity);
  const { data: densityData, loading: densityLoading } = useAsyncData(fetchGeo2dHist);

  return (
    <div>
      <div className="mb-10">
        <span className="text-[#22d3ee] font-bold tracking-[0.2em] text-[10px] uppercase mb-2 block">Geospatial Module</span>
        <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">Geospatial Analysis</h2>
        <p className="text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
          Explore accident distribution across US geography — density patterns, severity hotspots, and spatial clustering.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Scatter Plot — Accident Location by Severity (Chart #7) */}
        <div className="col-span-12">
          <ChartCard title="Scatter Plot — Accident Location by Severity" subtitle="10,000 sample points colored by severity level across the continental US" loading={geoSevLoading} height={500}>
            {geoSevData && geoSevData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="lng" type="number" domain={[-130, -65]} name="Longitude" {...AXIS_STYLE} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${v}°W`} label={{ value: "Longitude", position: "bottom", fill: "#64748b", fontSize: 11, offset: 10 }} />
                  <YAxis dataKey="lat" type="number" domain={[24, 50]} name="Latitude" {...AXIS_STYLE} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${v}°N`} label={{ value: "Latitude", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                  <ZAxis range={[10, 10]} />
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => {
                      if (name === "Severity") return [`Level ${value}`, "Severity"];
                      return [`${value.toFixed(2)}°`, name];
                    }}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload;
                      return p ? `${p.city}, ${p.state}` : "";
                    }}
                  />
                  <Scatter name="Accidents" data={geoSevData} animationDuration={1500}>
                    {geoSevData.map((d: { severity: number }, i: number) => (
                      <Cell key={i} fill={SEV_COLOR[d.severity] || "#6ea8fe"} opacity={0.4} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Spatial Accident Density Map (Chart #8) */}
        <div className="col-span-12">
          <ChartCard title="Spatial Accident Density Map" subtitle="Geospatial density analysis — brighter = higher concentration" loading={densityLoading} height={500}>
            {densityData && densityData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="lng" type="number" domain={[-130, -65]} name="Longitude" {...AXIS_STYLE} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${v}°W`} label={{ value: "Longitude", position: "bottom", fill: "#64748b", fontSize: 11, offset: 10 }} />
                  <YAxis dataKey="lat" type="number" domain={[24, 50]} name="Latitude" {...AXIS_STYLE} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${v}°N`} label={{ value: "Latitude", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                  <ZAxis range={[8, 8]} />
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => {
                      if (name === "Severity") return [`Level ${value}`, "Severity"];
                      return [`${value.toFixed(2)}°`, name];
                    }}
                  />
                  <Scatter name="Density" data={densityData} animationDuration={2000}>
                    {densityData.map((_: unknown, i: number) => {
                      // Create a density-like color gradient (blue → cyan → white)
                      const ratio = i / densityData.length;
                      const r = Math.round(34 + ratio * 200);
                      const g = Math.round(130 + ratio * 100);
                      const b = 246;
                      return <Cell key={i} fill={`rgb(${r},${g},${b})`} opacity={0.35 + ratio * 0.4} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Stats Row */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Severity 1 — Minor", color: "#34d399", icon: "🟢" },
            { label: "Severity 2 — Moderate", color: "#6ea8fe", icon: "🔵" },
            { label: "Severity 3 — Significant", color: "#fbbf24", icon: "🟡" },
            { label: "Severity 4 — Critical", color: "#fb7185", icon: "🔴" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-5 flex items-center gap-4 group hover:scale-[1.02] transition-transform">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">{s.label}</p>
                <div className="w-full h-1 rounded-full mt-2" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
