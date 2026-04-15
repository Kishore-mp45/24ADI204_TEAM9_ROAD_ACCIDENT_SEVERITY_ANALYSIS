import { useState, useEffect } from "react";

// Severity color palette used across all charts
export const SEVERITY_COLORS = [
  "var(--color-sev1)",  // Sev 1 — green
  "var(--color-sev2)",  // Sev 2 — blue
  "var(--color-sev3)",  // Sev 3 — amber
  "var(--color-sev4)",  // Sev 4 — rose
];

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
];

// Shared Recharts theme config for dark mode
export const AXIS_STYLE = {
  stroke: "rgba(148,163,184,0.15)",
  fontSize: 11,
  fontFamily: "'Inter', sans-serif",
  fill: "#64748b",
};

export const GRID_STYLE = {
  strokeDasharray: "3 3",
  stroke: "rgba(148,163,184,0.06)",
};

/**
 * Generic async data hook with loading & error states.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load data");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
