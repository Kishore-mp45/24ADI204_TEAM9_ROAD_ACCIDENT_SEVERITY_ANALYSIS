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
