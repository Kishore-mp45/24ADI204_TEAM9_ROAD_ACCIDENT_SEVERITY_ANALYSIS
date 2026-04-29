import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  loading?: boolean;
  height?: number | string;
  interpretation?: ReactNode;
}

export function ChartCard({ title, subtitle, children, className = "", action, loading, height = 340, interpretation }: ChartCardProps) {
  return (
    <div className={`glass-card rounded-2xl p-6 flex flex-col ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ width: "100%", height: height, position: "relative" }}>
        {loading ? <ChartSkeleton /> : children}
      </div>
      {interpretation && (
        <div className="mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)]">
          <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-1">
            {interpretation}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div className="skeleton w-3/4 h-4 rounded" />
      <div className="skeleton w-full h-[70%] rounded-xl" />
      <div className="skeleton w-1/2 h-3 rounded" />
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="glass-card kpi-glow rounded-2xl p-6">
      <div className="skeleton w-20 h-3 rounded mb-4" />
      <div className="skeleton w-28 h-8 rounded mb-1" />
    </div>
  );
}
