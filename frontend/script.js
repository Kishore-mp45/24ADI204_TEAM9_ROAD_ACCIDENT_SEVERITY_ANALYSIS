const API_BASE = "http://127.0.0.1:8000/api";

// --- THEMING ---
const toggleBtn = document.getElementById("theme-toggle");
toggleBtn.addEventListener('click', () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
        html.classList.remove("dark");
    } else {
        html.classList.add("dark");
    }
    // Update all charts dynamically based on new theme
    const isDark = html.classList.contains("dark");
    document.querySelectorAll('.js-plotly-plot').forEach(plot => {
        Plotly.relayout(plot, {
            font: { color: isDark ? '#e6ebf4' : '#121212' }
        });
    });
});

// --- NAVIGATION (SPA ROUTER) ---
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page-container');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active-link'));
        link.classList.add('active-link');
        
        // Hide all pages
        pages.forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetId = link.getAttribute('data-target');
        document.getElementById(`page-${targetId}`).classList.add('active');
        
        // Trigger resize on charts so Plotly fits the unhidden div perfectly
        window.dispatchEvent(new Event('resize'));
    });
});

// --- HELPER: Render Plotly Chart ---
async function renderChart(endpoint, divId) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const figJson = await response.json();
        if (Object.keys(figJson).length === 0) return;
        
        let figure = typeof figJson === 'string' ? JSON.parse(figJson) : figJson;

        const isDark = document.documentElement.classList.contains("dark");
        if(figure.layout) {
            figure.layout.paper_bgcolor = 'rgba(0,0,0,0)';
            figure.layout.plot_bgcolor = 'rgba(0,0,0,0)';
            figure.layout.font = { color: isDark ? '#e6ebf4' : '#121212', family: 'Inter, sans-serif' };
            figure.layout.autosize = true;
            // Clean up margins for tighter bento boxes
            if(!figure.layout.margin) {
                figure.layout.margin = {l: 30, r: 20, t: 30, b: 30};
            }
        }

        const config = {
            responsive: true,
            displayModeBar: false, // Cleaner UI
        };

        Plotly.newPlot(divId, figure.data, figure.layout, config);
    } catch (e) {
        console.error(`Error loading chart ${endpoint}`, e);
    }
}

// --- DYNAMIC DISTRIBUTION HANDLER ---
const featureSelector = document.getElementById('feature-selector');
if (featureSelector) {
    featureSelector.addEventListener('change', async (e) => {
        const feature = e.target.value;
        const featureName = e.target.options[e.target.selectedIndex].text;
        document.getElementById('hist-title').innerText = `${featureName} Density & Spread`;
        
        // Update Chart
        await renderChart(`/charts/feature-hist/${encodeURIComponent(feature)}`, 'plot_feature_hist');
        
        // Update Stats
        try {
            const distres = await fetch(`${API_BASE}/stats/distribution/${encodeURIComponent(feature)}`);
            if (distres.ok) {
                const data = await distres.json();
                document.getElementById('stat-skew').innerText = data.skewness !== undefined ? data.skewness : 'N/A';
                document.getElementById('stat-skew-type').innerText = data.skew_type || '';
                document.getElementById('stat-kurt').innerText = data.kurtosis !== undefined ? data.kurtosis : 'N/A';
                document.getElementById('stat-kurt-type').innerText = data.kurt_type || '';
            }
        } catch(err) { console.error(err); }
    });
}

// --- DATA FETCHERS ---
async function bootData() {
    // 1. Load Overview KPIs
    try {
        const kpires = await fetch(`${API_BASE}/kpis`);
        if (kpires.ok) {
            const data = await kpires.json();
            document.getElementById('kpi-records').innerText = (data.total_sample || 0).toLocaleString();
            document.getElementById('kpi-severity').innerText = data.avg_severity || '-';
            document.getElementById('kpi-state').innerText = data.top_state || '-';
            document.getElementById('kpi-weather').innerText = data.top_weather || '-';
        }
    } catch(e) { console.error(e); }

    // Initialize default feature (Temperature)
    if (featureSelector) {
        featureSelector.dispatchEvent(new Event('change'));
    }

    // 3. Load Data Snapshot Table
    try {
        const snapres = await fetch(`${API_BASE}/data-snapshot`);
        if (snapres.ok) {
            const records = await snapres.json();
            const tbody = document.getElementById('snapshot-tbody');
            tbody.innerHTML = '';
            records.forEach(r => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-primary/5 transition-colors";
                tr.innerHTML = `
                    <td class="px-8 py-4 font-mono text-xs text-on-surface">${r.id}</td>
                    <td class="px-8 py-4 text-sm font-bold">${r.severity} <span class="text-on-surface-variant font-normal">pts</span></td>
                    <td class="px-8 py-4 text-sm">${r.city}</td>
                    <td class="px-8 py-4 text-sm">${r.state}</td>
                    <td class="px-8 py-4">
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            r.status === 'Critical' ? 'bg-error/10 text-error border-error/20' : 'bg-secondary/10 text-secondary border-secondary/20'
                        }">${r.status}</span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch(e) { console.error(e); }

    // 4. Render All Plotly Charts
    
    // Overview
    renderChart('/charts/temporal-heatmap', 'plot_temporal_heatmap');
    renderChart('/charts/severity-pie', 'plot_severity_pie');
    renderChart('/charts/day-night', 'plot_day_night');
    renderChart('/charts/infra-bar', 'plot_infra_bar');
    renderChart('/charts/top-states', 'plot_top_states');
    
    // Distribution
    renderChart('/charts/temp-box', 'plot_temp_box');
    
    // Correlation
    renderChart('/charts/corr-heat', 'plot_corr_heat');
    renderChart('/charts/missing-bar', 'plot_missing_bar');
    renderChart('/charts/pca-line', 'plot_pca_line');
    renderChart('/charts/pca-scatter', 'plot_pca_scatter');
    renderChart('/charts/state-bubble', 'plot_state_bubble');
    
    // Insights
    renderChart('/charts/geo-2dhist', 'plot_geo_2dhist');
    renderChart('/charts/weather-stacked', 'plot_weather_stacked');
    renderChart('/charts/wind-hist', 'plot_wind_hist');
}

// Global Resize Listener to make charts responsive
window.addEventListener('resize', () => {
    document.querySelectorAll('.js-plotly-plot').forEach(plot => {
        Plotly.Plots.resize(plot);
    });
});

// Boot Immediately
window.onload = () => {
    bootData();
};
