const API = "/api";

export async function fetchKPIs() {
  const res = await fetch(`${API}/kpis`);
  return res.json();
}
export async function fetchDataSnapshot() {
  const res = await fetch(`${API}/data-snapshot`);
  return res.json();
}
export async function fetchDistributionStats(feature: string) {
  const res = await fetch(`${API}/stats/distribution/${encodeURIComponent(feature)}`);
  return res.json();
}

// ── V2 Raw Data Endpoints ──
export async function fetchSeverityPie() {
  const res = await fetch(`${API}/v2/severity-pie`);
  return res.json();
}
export async function fetchDayNight() {
  const res = await fetch(`${API}/v2/day-night`);
  return res.json();
}
export async function fetchTemporalHeatmap() {
  const res = await fetch(`${API}/v2/temporal-heatmap`);
  return res.json();
}
export async function fetchTopStates() {
  const res = await fetch(`${API}/v2/top-states`);
  return res.json();
}
export async function fetchInfraBar() {
  const res = await fetch(`${API}/v2/infra-bar`);
  return res.json();
}
export async function fetchFeatureHist(feature: string) {
  const res = await fetch(`${API}/v2/feature-hist/${encodeURIComponent(feature)}`);
  return res.json();
}
export async function fetchTempBox() {
  const res = await fetch(`${API}/v2/temp-box`);
  return res.json();
}
export async function fetchCorrHeat() {
  const res = await fetch(`${API}/v2/corr-heat`);
  return res.json();
}
export async function fetchMissingBar() {
  const res = await fetch(`${API}/v2/missing-bar`);
  return res.json();
}
export async function fetchPcaLine() {
  const res = await fetch(`${API}/v2/pca-line`);
  return res.json();
}
export async function fetchPcaScatter() {
  const res = await fetch(`${API}/v2/pca-scatter`);
  return res.json();
}
export async function fetchStateBubble() {
  const res = await fetch(`${API}/v2/state-bubble`);
  return res.json();
}
export async function fetchWeatherStacked() {
  const res = await fetch(`${API}/v2/weather-stacked`);
  return res.json();
}
export async function fetchGeo2dHist() {
  const res = await fetch(`${API}/v2/geo-2dhist`);
  return res.json();
}
export async function fetchWindHist() {
  const res = await fetch(`${API}/v2/wind-hist`);
  return res.json();
}
export async function fetchSeverityCount() {
  const res = await fetch(`${API}/v2/severity-count`);
  return res.json();
}
export async function fetchWindSeverityTrend() {
  const res = await fetch(`${API}/v2/wind-severity-trend`);
  return res.json();
}
export async function fetchTempViolin() {
  const res = await fetch(`${API}/v2/temp-violin`);
  return res.json();
}
export async function fetchGeoSeverity() {
  const res = await fetch(`${API}/v2/geo-severity`);
  return res.json();
}

// ── Temporal Trends ──
export async function fetchTrendMonthly() {
  const res = await fetch(`${API}/v2/trend-monthly`);
  return res.json();
}
export async function fetchTrendSeasonality() {
  const res = await fetch(`${API}/v2/trend-seasonality`);
  return res.json();
}
export async function fetchTrendSeverityShift() {
  const res = await fetch(`${API}/v2/trend-severity-shift`);
  return res.json();
}

// ── Hierarchy & Categorical ──
export async function fetchTreemap() {
  const res = await fetch(`${API}/v2/treemap`);
  return res.json();
}
export async function fetchTopCities() {
  const res = await fetch(`${API}/v2/top-cities`);
  return res.json();
}
export async function fetchMosaicWeather() {
  const res = await fetch(`${API}/v2/mosaic-weather`);
  return res.json();
}
export async function fetchSunburst() {
  const res = await fetch(`${API}/v2/sunburst`);
  return res.json();
}

// ── Multi-Variable ──
export async function fetchScatter3d() {
  const res = await fetch(`${API}/v2/scatter-3d`);
  return res.json();
}
export async function fetchBubbleChart() {
  const res = await fetch(`${API}/v2/bubble-chart`);
  return res.json();
}
export async function fetchRidgeline() {
  const res = await fetch(`${API}/v2/ridgeline`);
  return res.json();
}

// ── Density & Patterns ──
export async function fetchCalendarHeatmap() {
  const res = await fetch(`${API}/v2/calendar-heatmap`);
  return res.json();
}
export async function fetchHexbin() {
  const res = await fetch(`${API}/v2/hexbin`);
  return res.json();
}
export async function fetchTrendSeverityAbsolute() {
  const res = await fetch(`${API}/v2/trend-severity-absolute`);
  return res.json();
}

// ── Statistical Analysis ──
export async function fetchFacetVisibility() {
  const res = await fetch(`${API}/v2/facet-visibility`);
  return res.json();
}
export async function fetchEcdf() {
  const res = await fetch(`${API}/v2/ecdf`);
  return res.json();
}
export async function fetchConfidenceWind() {
  const res = await fetch(`${API}/v2/confidence-wind`);
  return res.json();
}
export async function fetchRollingTrend() {
  const res = await fetch(`${API}/v2/rolling-trend`);
  return res.json();
}

// ── Comparative Analysis ──
export async function fetchSlopeDayNight() {
  const res = await fetch(`${API}/v2/slope-day-night`);
  return res.json();
}
export async function fetchDualAxisMonthly() {
  const res = await fetch(`${API}/v2/dual-axis-monthly`);
  return res.json();
}

// ── Pattern Discovery ──
export async function fetchContourDensity() {
  const res = await fetch(`${API}/v2/contour-density`);
  return res.json();
}
export async function fetchScatterMatrix() {
  const res = await fetch(`${API}/v2/scatter-matrix`);
  return res.json();
}
export async function fetchPolarHour() {
  const res = await fetch(`${API}/v2/polar-hour`);
  return res.json();
}
export async function fetchGroupedBoxplot() {
  const res = await fetch(`${API}/v2/grouped-boxplot`);
  return res.json();
}
