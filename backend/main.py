import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from fastapi.staticfiles import StaticFiles

# Setup FastAPI Instance
app = FastAPI(title="Road Accident Severity API")

# Setup CORS for Frontend separation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for caching
global_df = None
global_pca_df = None

def load_data():
    global global_df
    print("Loading 200,000 row sampled dataset...")
    # Support Railway volume via CSV_PATH env variable, fallback to local path
    default_path = os.path.join(os.path.dirname(__file__), "..", "US_Accidents_March23.csv")
    csv_path = os.environ.get("CSV_PATH", default_path)

    try:
        df = pd.read_csv(csv_path, nrows=200000)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {csv_path}. Set CSV_PATH env variable to the correct location.")
        return None

    # Parsing & Cleaning mirroring the notebook pipeline
    df['Start_Time'] = pd.to_datetime(df['Start_Time'], errors='coerce')
    df['Hour'] = df['Start_Time'].dt.hour
    df['DayOfWeek'] = df['Start_Time'].dt.day_name()
    df['Weather_Condition'] = df['Weather_Condition'].fillna('Fair')
    df['Sunrise_Sunset'] = df['Sunrise_Sunset'].fillna('Day')
    df['Severity'] = df['Severity'].astype(int)
    
    # Fill numeric NAs
    num_cols = ['Distance(mi)', 'Temperature(F)', 'Humidity(%)', 'Pressure(in)', 'Visibility(mi)', 'Wind_Speed(mph)']
    for col in num_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
            
    global_df = df
    print("Data loaded perfectly.")
    return df

@app.on_event("startup")
def startup_event():
    load_data()
    # Precompute PCA for the advanced tab so it's instantaneous
    global global_df, global_pca_df
    if global_df is not None:
        print("Pre-computing PCA Matrix...")
        num_df = global_df.select_dtypes(include=['int64', 'float64']).fillna(0)
        if 'Severity' in num_df.columns:
            y = num_df['Severity'].astype(str)
            X = num_df.drop('Severity', axis=1)
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            pca = PCA(n_components=2, random_state=42)
            X_pca = pca.fit_transform(X_scaled)
            pca_df = pd.DataFrame(X_pca, columns=['PC1', 'PC2'])
            pca_df['Severity'] = y.values
            global_pca_df = pca_df

# =====================================================================
# ORIGINAL PLOTLY ENDPOINTS (kept for backward compatibility)
# =====================================================================

@app.get("/api/kpis")
def get_kpis():
    if global_df is None: return JSONResponse({"error": "No data available."})
    return {
        "total_sample": len(global_df),
        "top_state": global_df['State'].mode().iloc[0],
        "top_weather": global_df['Weather_Condition'].mode().iloc[0],
        "avg_severity": round(global_df['Severity'].mean(), 2)
    }

@app.get("/api/charts/severity-dist")
def severity_dist():
    if global_df is None: return Response(content="{}")
    sev_counts = global_df['Severity'].value_counts().reset_index()
    sev_counts.columns = ['Severity', 'Count']
    fig = px.bar(sev_counts, x='Severity', y='Count', title="Severity Distribution", color='Severity')
    fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/day-night")
def day_night():
    if global_df is None: return Response(content="{}")
    dn_counts = global_df.groupby(['Sunrise_Sunset', 'Severity']).size().reset_index(name='Count')
    fig = px.bar(dn_counts, x='Sunrise_Sunset', y='Count', color='Severity', title="Day vs Night Severity", barmode='group')
    fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/feature-hist/{feature}")
def feature_hist(feature: str):
    if global_df is None: return Response(content="{}")
    actual_feature = feature
    if actual_feature not in global_df.columns: 
        return Response(content="{}")
    fig = px.histogram(global_df, x=actual_feature, nbins=50, title=f"{actual_feature} Density & Spread")
    fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/corr-heat")
def corr_heat():
    if global_df is None: return Response(content="{}")
    num_df = global_df.select_dtypes(include=['int64', 'float64']).drop(columns=['Start_Lat', 'Start_Lng', 'End_Lat', 'End_Lng'], errors='ignore')
    corr = num_df.corr()
    fig = go.Figure(data=go.Heatmap(z=corr.values, x=corr.columns, y=corr.index, colorscale='RdBu'))
    fig.update_layout(title="Feature Correlation Matrix", margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/missing-bar")
def missing_bar():
    if global_df is None: return Response(content="{}")
    missing = global_df.isnull().sum()
    missing = missing[missing > 0].sort_values(ascending=True).reset_index()
    if missing.empty:
        fig = px.bar(title="No Missing Variables in Sample")
    else:
        missing.columns = ['Feature', 'Null Count']
        fig = px.bar(missing, x='Null Count', y='Feature', orientation='h', title="Missing Values per Column")
    fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/top-states")
def top_states():
    if global_df is None: return Response(content="{}")
    state_counts = global_df['State'].value_counts().head(15).reset_index()
    state_counts.columns = ['State', 'Accidents']
    fig = px.bar(state_counts, x='Accidents', y='State', orientation='h', title="Top 15 Accident States", color='Accidents')
    fig.update_layout(yaxis={'categoryorder': 'total ascending'}, margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/temporal-heatmap")
def temporal_heatmap():
    if global_df is None: return Response(content="{}")
    heatmap_data = global_df.groupby(['DayOfWeek', 'Hour']).size().reset_index(name='Accidents')
    days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    fig = px.density_heatmap(heatmap_data, x="Hour", y="DayOfWeek", z="Accidents", title="Rush-Hour Traffic Matrix", category_orders={"DayOfWeek": days_order})
    fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/weather-stacked")
def weather_stacked():
    if global_df is None: return Response(content="{}")
    weather_counts = global_df['Weather_Condition'].value_counts().head(5).index
    filtered_w = global_df[global_df['Weather_Condition'].isin(weather_counts)]
    w_sev = filtered_w.groupby(['Weather_Condition', 'Severity']).size().reset_index(name='Count')
    fig = px.bar(w_sev, x='Weather_Condition', y='Count', color='Severity', title="Severity Proportions by Top Weather", barmode='relative')
    fig.update_layout(barnorm='percent', margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    fig.update_yaxes(title="Percentage (%)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/charts/pca-scatter")
def pca_scatter():
    if global_pca_df is None: return Response(content="{}")
    sample_df = global_pca_df.sample(n=min(20000, len(global_pca_df)))
    fig = px.scatter(sample_df, x='PC1', y='PC2', color='Severity', opacity=0.6, title="PCA 2D Dimensionality Reduction (PC1 vs PC2)")
    fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

@app.get("/api/stats/distribution/{feature}")
def stats_distribution(feature: str):
    if global_df is None: return JSONResponse({})
    if feature not in global_df.columns:
        return JSONResponse({"skewness": 0, "kurtosis": 0})
    
    skew_val = global_df[feature].skew()
    kurt_val = global_df[feature].kurtosis()
    
    return {
        "feature": feature,
        "skewness": round(skew_val, 2),
        "kurtosis": round(kurt_val, 2),
        "skew_type": "Positive Space" if skew_val > 0 else "Negative Space" if skew_val < 0 else "Symmetrical",
        "kurt_type": "Leptokurtic" if kurt_val > 3 else "Platykurtic" if kurt_val < 3 else "Mesokurtic"
    }

@app.get("/api/data-snapshot")
def data_snapshot():
    if global_df is None: return JSONResponse([])
    # Return 5 most recent or random sample
    sample = global_df.dropna(subset=['ID', 'Severity']).sample(5)
    records = []
    import math
    for idx, row in sample.iterrows():
        records.append({
            "id": row.get('ID', f'IDX-{np.random.randint(10000, 99999)}'),
            "severity": row['Severity'],
            "state": row.get('State', 'N/A'),
            "city": row.get('City', 'N/A'),
            "status": "Critical" if row['Severity'] >= 3 else "Nominal"
        })
    return JSONResponse(records)


# =====================================================================
# V2 RAW DATA ENDPOINTS — For React + Recharts/shadcn frontend
# =====================================================================

@app.get("/api/v2/severity-pie")
def v2_severity_pie():
    """Severity distribution as pie/donut data."""
    if global_df is None: return JSONResponse([])
    sev = global_df['Severity'].value_counts().reset_index()
    sev.columns = ['severity', 'count']
    sev = sev.sort_values('severity')
    return JSONResponse(sev.to_dict(orient='records'))


@app.get("/api/v2/day-night")
def v2_day_night():
    """Day vs Night severity grouped bar data."""
    if global_df is None: return JSONResponse([])
    dn = global_df.groupby(['Sunrise_Sunset', 'Severity']).size().reset_index(name='count')
    # pivot so each row = Day/Night, with sev1, sev2, sev3, sev4 columns
    pivot = dn.pivot_table(index='Sunrise_Sunset', columns='Severity', values='count', fill_value=0).reset_index()
    pivot.columns = ['period'] + [f'sev{c}' for c in pivot.columns[1:]]
    return JSONResponse(pivot.to_dict(orient='records'))


@app.get("/api/v2/temporal-heatmap")
def v2_temporal_heatmap():
    """Returns heatmap grid: [{day, hour, accidents}, ...]"""
    if global_df is None: return JSONResponse([])
    hm = global_df.groupby(['DayOfWeek', 'Hour']).size().reset_index(name='accidents')
    hm.columns = ['day', 'hour', 'accidents']
    return JSONResponse(hm.to_dict(orient='records'))


@app.get("/api/v2/top-states")
def v2_top_states():
    """Top 15 states by accident count."""
    if global_df is None: return JSONResponse([])
    sc = global_df['State'].value_counts().head(15).reset_index()
    sc.columns = ['state', 'accidents']
    sc = sc.sort_values('accidents', ascending=True)
    return JSONResponse(sc.to_dict(orient='records'))


@app.get("/api/v2/infra-bar")
def v2_infra_bar():
    """Accidents near infrastructure (boolean road features)."""
    if global_df is None: return JSONResponse([])
    infra_cols = ['Amenity', 'Crossing', 'Junction', 'Railway', 'Station', 'Stop', 'Traffic_Signal']
    existing = [c for c in infra_cols if c in global_df.columns]
    data = []
    for col in existing:
        count = int(global_df[col].sum())
        data.append({"feature": col, "count": count})
    data.sort(key=lambda x: x['count'], reverse=True)
    return JSONResponse(data)


@app.get("/api/v2/feature-hist/{feature}")
def v2_feature_hist(feature: str):
    """Histogram bins for a numeric feature."""
    if global_df is None: return JSONResponse([])
    if feature not in global_df.columns: return JSONResponse([])
    
    col_data = global_df[feature].dropna()
    counts, bin_edges = np.histogram(col_data, bins=40)
    data = []
    for i in range(len(counts)):
        mid = round((bin_edges[i] + bin_edges[i+1]) / 2, 2)
        data.append({"bin": mid, "count": int(counts[i])})
    return JSONResponse(data)


@app.get("/api/v2/temp-box")
def v2_temp_box():
    """Temperature box plot stats by severity."""
    if global_df is None: return JSONResponse([])
    data = []
    for sev in sorted(global_df['Severity'].unique()):
        temps = global_df[global_df['Severity'] == sev]['Temperature(F)'].dropna()
        if len(temps) == 0: continue
        q1 = float(temps.quantile(0.25))
        median = float(temps.median())
        q3 = float(temps.quantile(0.75))
        iqr = q3 - q1
        low = float(max(temps.min(), q1 - 1.5 * iqr))
        high = float(min(temps.max(), q3 + 1.5 * iqr))
        data.append({
            "severity": f"Severity {sev}",
            "min": round(low, 1),
            "q1": round(q1, 1),
            "median": round(median, 1),
            "q3": round(q3, 1),
            "max": round(high, 1),
            "mean": round(float(temps.mean()), 1)
        })
    return JSONResponse(data)


@app.get("/api/v2/corr-heat")
def v2_corr_heat():
    """Correlation matrix as {columns, data} for heatmap rendering."""
    if global_df is None: return JSONResponse({})
    num_df = global_df.select_dtypes(include=['int64', 'float64']).drop(
        columns=['Start_Lat', 'Start_Lng', 'End_Lat', 'End_Lng'], errors='ignore'
    )
    corr = num_df.corr()
    cols = corr.columns.tolist()
    # Return as flat array of {x, y, value}
    cells = []
    for i, row_name in enumerate(cols):
        for j, col_name in enumerate(cols):
            cells.append({
                "x": col_name,
                "y": row_name,
                "value": round(float(corr.iloc[i, j]), 3)
            })
    return JSONResponse({"columns": cols, "cells": cells})


@app.get("/api/v2/missing-bar")
def v2_missing_bar():
    """Missing values per column."""
    if global_df is None: return JSONResponse([])
    missing = global_df.isnull().sum()
    missing = missing[missing > 0].sort_values(ascending=False).reset_index()
    if missing.empty:
        return JSONResponse([])
    missing.columns = ['feature', 'nullCount']
    return JSONResponse(missing.to_dict(orient='records'))


@app.get("/api/v2/pca-line")
def v2_pca_line():
    """PCA explained variance ratio curve."""
    if global_df is None: return JSONResponse([])
    num_df = global_df.select_dtypes(include=['int64', 'float64']).fillna(0)
    if 'Severity' in num_df.columns:
        X = num_df.drop('Severity', axis=1)
    else:
        X = num_df
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    n_comp = min(10, X.shape[1])
    pca = PCA(n_components=n_comp, random_state=42)
    pca.fit(X_scaled)
    
    data = []
    cumulative = 0.0
    for i in range(n_comp):
        cumulative += pca.explained_variance_ratio_[i]
        data.append({
            "component": f"PC{i+1}",
            "variance": round(float(pca.explained_variance_ratio_[i]) * 100, 2),
            "cumulative": round(cumulative * 100, 2)
        })
    return JSONResponse(data)


@app.get("/api/v2/pca-scatter")
def v2_pca_scatter():
    """PCA 2D scatter — sampled to 5000 points for performance."""
    if global_pca_df is None: return JSONResponse([])
    sample = global_pca_df.sample(n=min(5000, len(global_pca_df)), random_state=42)
    sample['PC1'] = sample['PC1'].round(3)
    sample['PC2'] = sample['PC2'].round(3)
    return JSONResponse(sample.to_dict(orient='records'))


@app.get("/api/v2/state-bubble")
def v2_state_bubble():
    """State-level bubble chart: accidents, avg severity, top weather."""
    if global_df is None: return JSONResponse([])
    state_agg = global_df.groupby('State').agg(
        accidents=('Severity', 'size'),
        avg_severity=('Severity', 'mean')
    ).reset_index()
    state_agg = state_agg.sort_values('accidents', ascending=False).head(20)
    state_agg['avg_severity'] = state_agg['avg_severity'].round(2)
    return JSONResponse(state_agg.to_dict(orient='records'))


@app.get("/api/v2/weather-stacked")
def v2_weather_stacked():
    """Weather x Severity stacked bar (percentages)."""
    if global_df is None: return JSONResponse([])
    top5 = global_df['Weather_Condition'].value_counts().head(5).index.tolist()
    filtered = global_df[global_df['Weather_Condition'].isin(top5)]
    pivot = filtered.groupby(['Weather_Condition', 'Severity']).size().reset_index(name='count')
    
    # Convert to percentage within each weather
    totals = pivot.groupby('Weather_Condition')['count'].sum().to_dict()
    pivot['pct'] = pivot.apply(lambda r: round(r['count'] / totals[r['Weather_Condition']] * 100, 1), axis=1)
    
    # Pivot to: [{weather, sev1, sev2, sev3, sev4}, ...]
    result_pivot = pivot.pivot_table(
        index='Weather_Condition', columns='Severity', values='pct', fill_value=0
    ).reset_index()
    result_pivot.columns = ['weather'] + [f'sev{c}' for c in result_pivot.columns[1:]]
    return JSONResponse(result_pivot.to_dict(orient='records'))


@app.get("/api/v2/geo-2dhist")
def v2_geo_2dhist():
    """Lat/Lng density data — sampled and binned for scatter."""
    if global_df is None: return JSONResponse([])
    geo = global_df[['Start_Lat', 'Start_Lng', 'Severity']].dropna()
    sample = geo.sample(n=min(8000, len(geo)), random_state=42)
    sample = sample.round(2)
    sample.columns = ['lat', 'lng', 'severity']
    return JSONResponse(sample.to_dict(orient='records'))


@app.get("/api/v2/wind-hist")
def v2_wind_hist():
    """Wind speed histogram binned data."""
    if global_df is None: return JSONResponse([])
    col_data = global_df['Wind_Speed(mph)'].dropna()
    col_data = col_data[col_data <= col_data.quantile(0.99)]  # trim outliers
    counts, bin_edges = np.histogram(col_data, bins=40)
    data = []
    for i in range(len(counts)):
        mid = round((bin_edges[i] + bin_edges[i+1]) / 2, 1)
        data.append({"speed": mid, "count": int(counts[i])})
    return JSONResponse(data)


@app.get("/api/v2/severity-count")
def v2_severity_count():
    """Severity level counts as bar chart data."""
    if global_df is None: return JSONResponse([])
    sev = global_df['Severity'].value_counts().sort_index().reset_index()
    sev.columns = ['severity', 'count']
    result = []
    for _, row in sev.iterrows():
        result.append({
            "severity": f"Severity {int(row['severity'])}",
            "count": int(row['count']),
            "level": int(row['severity'])
        })
    return JSONResponse(result)


@app.get("/api/v2/wind-severity-trend")
def v2_wind_severity_trend():
    """Average severity across wind speed bins — line plot data."""
    if global_df is None: return JSONResponse([])
    df = global_df[['Wind_Speed(mph)', 'Severity']].dropna()
    df = df[df['Wind_Speed(mph)'] <= df['Wind_Speed(mph)'].quantile(0.98)]
    # Bin wind speed into 20 equal-width bins
    df['wind_bin'] = pd.cut(df['Wind_Speed(mph)'], bins=20)
    grouped = df.groupby('wind_bin', observed=True).agg(
        avg_severity=('Severity', 'mean'),
        count=('Severity', 'size')
    ).reset_index()
    data = []
    for _, row in grouped.iterrows():
        mid = round(row['wind_bin'].mid, 1)
        data.append({
            "windSpeed": mid,
            "avgSeverity": round(float(row['avg_severity']), 3),
            "count": int(row['count'])
        })
    return JSONResponse(data)


@app.get("/api/v2/temp-violin")
def v2_temp_violin():
    """Temperature distribution per severity for violin plot approximation."""
    if global_df is None: return JSONResponse([])
    result = []
    for sev in sorted(global_df['Severity'].unique()):
        temps = global_df[global_df['Severity'] == sev]['Temperature(F)'].dropna()
        if len(temps) == 0: continue
        # Create density approximation via histogram
        counts, bin_edges = np.histogram(temps, bins=30, density=True)
        points = []
        for i in range(len(counts)):
            mid = round((bin_edges[i] + bin_edges[i+1]) / 2, 1)
            points.append({
                "temp": mid,
                "density": round(float(counts[i]), 6)
            })
        result.append({
            "severity": int(sev),
            "label": f"Severity {int(sev)}",
            "points": points,
            "stats": {
                "mean": round(float(temps.mean()), 1),
                "median": round(float(temps.median()), 1),
                "std": round(float(temps.std()), 1),
                "count": int(len(temps))
            }
        })
    return JSONResponse(result)


@app.get("/api/v2/geo-severity")
def v2_geo_severity():
    """Lat/Lng scatter colored by severity — for geospatial page."""
    if global_df is None: return JSONResponse([])
    geo = global_df[['Start_Lat', 'Start_Lng', 'Severity', 'State', 'City']].dropna(subset=['Start_Lat', 'Start_Lng'])
    sample = geo.sample(n=min(10000, len(geo)), random_state=42)
    sample = sample.round({'Start_Lat': 2, 'Start_Lng': 2})
    sample.columns = ['lat', 'lng', 'severity', 'state', 'city']
    return JSONResponse(sample.to_dict(orient='records'))


@app.get("/api/v2/severity-count")
def v2_severity_count():
    """Severity level counts as bar chart data."""
    if global_df is None: return JSONResponse([])
    sev = global_df['Severity'].value_counts().sort_index().reset_index()
    sev.columns = ['severity', 'count']
    result = []
    for _, row in sev.iterrows():
        result.append({
            "severity": f"Severity {int(row['severity'])}",
            "count": int(row['count']),
            "level": int(row['severity'])
        })
    return JSONResponse(result)


@app.get("/api/v2/wind-severity-trend")
def v2_wind_severity_trend():
    """Average severity across wind speed bins — line plot data."""
    if global_df is None: return JSONResponse([])
    df = global_df[['Wind_Speed(mph)', 'Severity']].dropna()
    df = df[df['Wind_Speed(mph)'] <= df['Wind_Speed(mph)'].quantile(0.98)]
    df['wind_bin'] = pd.cut(df['Wind_Speed(mph)'], bins=20)
    grouped = df.groupby('wind_bin', observed=True).agg(
        avg_severity=('Severity', 'mean'),
        count=('Severity', 'size')
    ).reset_index()
    data = []
    for _, row in grouped.iterrows():
        mid = round(row['wind_bin'].mid, 1)
        data.append({
            "windSpeed": mid,
            "avgSeverity": round(float(row['avg_severity']), 3),
            "count": int(row['count'])
        })
    return JSONResponse(data)


@app.get("/api/v2/temp-violin")
def v2_temp_violin():
    """Temperature distribution per severity for violin plot."""
    if global_df is None: return JSONResponse([])
    result = []
    for sev in sorted(global_df['Severity'].unique()):
        temps = global_df[global_df['Severity'] == sev]['Temperature(F)'].dropna()
        if len(temps) == 0: continue
        counts, bin_edges = np.histogram(temps, bins=30, density=True)
        points = []
        for i in range(len(counts)):
            mid = round((bin_edges[i] + bin_edges[i+1]) / 2, 1)
            points.append({"temp": mid, "density": round(float(counts[i]), 6)})
        result.append({
            "severity": int(sev),
            "label": f"Severity {int(sev)}",
            "points": points,
            "stats": {
                "mean": round(float(temps.mean()), 1),
                "median": round(float(temps.median()), 1),
                "std": round(float(temps.std()), 1),
                "count": int(len(temps))
            }
        })
    return JSONResponse(result)


@app.get("/api/v2/geo-severity")
def v2_geo_severity():
    """Lat/Lng scatter colored by severity — for geospatial page."""
    if global_df is None: return JSONResponse([])
    geo = global_df[['Start_Lat', 'Start_Lng', 'Severity', 'State', 'City']].dropna(subset=['Start_Lat', 'Start_Lng'])
    sample = geo.sample(n=min(10000, len(geo)), random_state=42)
    sample = sample.round({'Start_Lat': 2, 'Start_Lng': 2})
    sample.columns = ['lat', 'lng', 'severity', 'state', 'city']
    return JSONResponse(sample.to_dict(orient='records'))



# =====================================================================
# TEMPORAL TRENDS ENDPOINTS
# =====================================================================

@app.get("/api/v2/trend-monthly")
def v2_trend_monthly():
    """Year-over-Year monthly accident counts for Area Chart."""
    if global_df is None: return JSONResponse([])
    df = global_df.copy()
    df['Year'] = df['Start_Time'].dt.year
    df['Month'] = df['Start_Time'].dt.month
    grouped = df.groupby(['Year', 'Month']).size().reset_index(name='count')
    grouped['period'] = grouped['Year'].astype(str) + '-' + grouped['Month'].astype(str).str.zfill(2)
    grouped = grouped.sort_values('period')
    return JSONResponse(grouped[['period', 'count', 'Year', 'Month']].to_dict(orient='records'))


@app.get("/api/v2/trend-seasonality")
def v2_trend_seasonality():
    """Monthly accident frequency aggregated across all years — Radar chart."""
    if global_df is None: return JSONResponse([])
    df = global_df.copy()
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    df['Month'] = df['Start_Time'].dt.month
    grouped = df.groupby('Month').size().reset_index(name='count')
    grouped['month_name'] = grouped['Month'].apply(lambda m: month_names[m - 1])
    return JSONResponse(grouped[['month_name', 'count']].to_dict(orient='records'))


@app.get("/api/v2/trend-severity-shift")
def v2_trend_severity_shift():
    """Proportional severity distribution per year — Stacked Area chart."""
    if global_df is None: return JSONResponse([])
    df = global_df.copy()
    df['Year'] = df['Start_Time'].dt.year
    grouped = df.groupby(['Year', 'Severity']).size().reset_index(name='count')
    pivot = grouped.pivot_table(index='Year', columns='Severity', values='count', fill_value=0)
    pivot = pivot.div(pivot.sum(axis=1), axis=0) * 100  # Convert to percentages
    pivot.columns = [f'Severity {int(c)}' for c in pivot.columns]
    pivot = pivot.reset_index()
    return JSONResponse(pivot.to_dict(orient='records'))


# =====================================================================
# HIERARCHY & CATEGORICAL ENDPOINTS
# =====================================================================

@app.get("/api/v2/treemap")
def v2_treemap():
    """State → Severity breakdown for Treemap."""
    if global_df is None: return JSONResponse([])
    top_states = global_df['State'].value_counts().head(12).index.tolist()
    df_f = global_df[global_df['State'].isin(top_states)]
    grouped = df_f.groupby(['State', 'Severity']).size().reset_index(name='value')
    result = []
    for _, row in grouped.iterrows():
        result.append({
            'name': f"Sev {int(row['Severity'])}",
            'state': str(row['State']),
            'severity': int(row['Severity']),
            'value': int(row['value'])
        })
    return JSONResponse(result)


@app.get("/api/v2/top-cities")
def v2_top_cities():
    """Top 15 cities by accident count for Lollipop chart."""
    if global_df is None: return JSONResponse([])
    city_counts = global_df['City'].value_counts().head(15).reset_index()
    city_counts.columns = ['city', 'count']
    return JSONResponse(city_counts.to_dict(orient='records'))


@app.get("/api/v2/mosaic-weather")
def v2_mosaic_weather():
    """Weather Condition vs Severity proportional matrix."""
    if global_df is None: return JSONResponse([])
    top_weather = global_df['Weather_Condition'].value_counts().head(6).index.tolist()
    df_f = global_df[global_df['Weather_Condition'].isin(top_weather)]
    grouped = df_f.groupby(['Weather_Condition', 'Severity']).size().reset_index(name='count')
    pivot = grouped.pivot_table(index='Weather_Condition', columns='Severity', values='count', fill_value=0)
    pivot.columns = [f'sev{int(c)}' for c in pivot.columns]
    pivot['total'] = pivot.sum(axis=1)
    pivot = pivot.reset_index()
    pivot.rename(columns={'Weather_Condition': 'weather'}, inplace=True)
    return JSONResponse(pivot.to_dict(orient='records'))


@app.get("/api/v2/sunburst")
def v2_sunburst():
    """Weather → Day/Night → Severity hierarchy for multi-ring chart."""
    if global_df is None: return JSONResponse([])
    top_weather = global_df['Weather_Condition'].value_counts().head(5).index.tolist()
    df_f = global_df[global_df['Weather_Condition'].isin(top_weather)]
    grouped = df_f.groupby(['Weather_Condition', 'Sunrise_Sunset', 'Severity']).size().reset_index(name='count')
    result = []
    for _, row in grouped.iterrows():
        result.append({
            'weather': str(row['Weather_Condition']),
            'period': str(row['Sunrise_Sunset']),
            'severity': int(row['Severity']),
            'count': int(row['count'])
        })
    return JSONResponse(result)


# =====================================================================
# MULTI-VARIABLE ENDPOINTS
# =====================================================================

@app.get("/api/v2/scatter-3d")
def v2_scatter_3d():
    """Temperature x Visibility x Wind Speed x Severity (3D simulation)."""
    if global_df is None: return JSONResponse([])
    cols = ['Temperature(F)', 'Visibility(mi)', 'Wind_Speed(mph)', 'Severity']
    df_clean = global_df[cols].dropna()
    df_clean = df_clean[
        (df_clean['Temperature(F)'].between(-20, 120)) &
        (df_clean['Visibility(mi)'].between(0, 15)) &
        (df_clean['Wind_Speed(mph)'].between(0, 60))
    ]
    sample = df_clean.sample(n=min(2000, len(df_clean)), random_state=42)
    sample.columns = ['temperature', 'visibility', 'windSpeed', 'severity']
    return JSONResponse(sample.round(2).to_dict(orient='records'))


@app.get("/api/v2/bubble-chart")
def v2_bubble_chart():
    """Visibility x Wind Speed x Count x Severity aggregated bubbles."""
    if global_df is None: return JSONResponse([])
    df = global_df[['Visibility(mi)', 'Wind_Speed(mph)', 'Severity']].dropna()
    df = df[(df['Visibility(mi)'] <= 15) & (df['Wind_Speed(mph)'] <= 50)]
    df = df.copy()
    df['vis_bin'] = (df['Visibility(mi)'] / 2).round() * 2
    df['wind_bin'] = (df['Wind_Speed(mph)'] / 5).round() * 5
    grouped = df.groupby(['vis_bin', 'wind_bin', 'Severity']).size().reset_index(name='count')
    result = []
    for _, row in grouped.iterrows():
        result.append({
            'visibility': float(row['vis_bin']),
            'windSpeed': float(row['wind_bin']),
            'count': int(row['count']),
            'severity': int(row['Severity'])
        })
    return JSONResponse(result)


@app.get("/api/v2/ridgeline")
def v2_ridgeline():
    """Wind Speed distribution per Severity for ridgeline plot."""
    if global_df is None: return JSONResponse({})
    df = global_df[['Wind_Speed(mph)', 'Severity']].dropna()
    df = df[df['Wind_Speed(mph)'] <= 60]
    bins = list(range(0, 62, 3))
    result = {}
    for sev in [1, 2, 3, 4]:
        sev_data = df[df['Severity'] == sev]['Wind_Speed(mph)']
        counts, edges = np.histogram(sev_data, bins=bins)
        max_c = float(max(counts)) if max(counts) > 0 else 1.0
        result[f'sev{sev}'] = [
            {'wind': float(edges[i]), 'count': int(counts[i]), 'normalized': round(float(counts[i]) / max_c, 4)}
            for i in range(len(counts))
        ]
    return JSONResponse(result)


# =====================================================================
# DENSITY & PATTERNS ENDPOINTS
# =====================================================================

@app.get("/api/v2/calendar-heatmap")
def v2_calendar_heatmap():
    """Daily accident counts across dataset span."""
    if global_df is None: return JSONResponse([])
    df = global_df.copy()
    df['Date'] = df['Start_Time'].dt.date
    daily = df.groupby('Date').size().reset_index(name='count')
    daily['date'] = daily['Date'].astype(str)
    daily = daily.sort_values('date')
    return JSONResponse(daily[['date', 'count']].to_dict(orient='records'))


@app.get("/api/v2/hexbin")
def v2_hexbin():
    """Lat/Lng binned into grid cells for hexbin density map."""
    if global_df is None: return JSONResponse([])
    geo = global_df[['Start_Lat', 'Start_Lng']].dropna()
    geo = geo[(geo['Start_Lat'].between(24, 50)) & (geo['Start_Lng'].between(-130, -65))]
    lat_step = 1.2
    lng_step = 1.8
    geo = geo.copy()
    geo['lat_bin'] = (geo['Start_Lat'] / lat_step).round() * lat_step
    geo['lng_bin'] = (geo['Start_Lng'] / lng_step).round() * lng_step
    grouped = geo.groupby(['lat_bin', 'lng_bin']).size().reset_index(name='count')
    grouped = grouped[grouped['count'] > 5]
    return JSONResponse([{
        'lat': round(float(r['lat_bin']), 2),
        'lng': round(float(r['lng_bin']), 2),
        'count': int(r['count'])
    } for _, r in grouped.iterrows()])


@app.get("/api/v2/trend-severity-absolute")
def v2_trend_severity_absolute():
    """Absolute severity counts per year for Stacked Area chart."""
    if global_df is None: return JSONResponse([])
    df = global_df.copy()
    df['Year'] = df['Start_Time'].dt.year
    grouped = df.groupby(['Year', 'Severity']).size().reset_index(name='count')
    pivot = grouped.pivot_table(index='Year', columns='Severity', values='count', fill_value=0)
    pivot.columns = [f'Severity {int(c)}' for c in pivot.columns]
    pivot = pivot.reset_index()
    return JSONResponse(pivot.to_dict(orient='records'))



# =====================================================================
# STATISTICAL ANALYSIS ENDPOINTS
# =====================================================================

@app.get("/api/v2/facet-visibility")
def v2_facet_visibility():
    if global_df is None: return JSONResponse({})
    df = global_df[['Visibility(mi)', 'Severity']].dropna()
    df = df[df['Visibility(mi)'] <= 15]
    bins = [0, 1, 2, 3, 4, 5, 6, 8, 10, 15]
    labels = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-8', '8-10', '10-15']
    result = {}
    for sev in [1, 2, 3, 4]:
        sev_df = df[df['Severity'] == sev]
        counts, _ = np.histogram(sev_df['Visibility(mi)'], bins=bins)
        result[f'sev{sev}'] = [{'bin': labels[i], 'count': int(counts[i])} for i in range(len(labels))]
    return JSONResponse(result)


@app.get("/api/v2/ecdf")
def v2_ecdf():
    if global_df is None: return JSONResponse({})
    df = global_df[['Visibility(mi)', 'Wind_Speed(mph)']].dropna()
    df = df[(df['Visibility(mi)'] <= 15) & (df['Wind_Speed(mph)'] <= 60)]
    vis_sorted = sorted(df['Visibility(mi)'].values)
    n = len(vis_sorted)
    step = max(1, n // 200)
    vis_ecdf = [{'value': round(float(v), 2), 'cumulative': round((i + 1) / n * 100, 2)} for i, v in enumerate(vis_sorted[::step])]
    wind_sorted = sorted(df['Wind_Speed(mph)'].values)
    n2 = len(wind_sorted)
    step2 = max(1, n2 // 200)
    wind_ecdf = [{'value': round(float(v), 2), 'cumulative': round((i + 1) / n2 * 100, 2)} for i, v in enumerate(wind_sorted[::step2])]
    return JSONResponse({'visibility': vis_ecdf, 'wind': wind_ecdf})


@app.get("/api/v2/confidence-wind")
def v2_confidence_wind():
    if global_df is None: return JSONResponse([])
    df = global_df[['Wind_Speed(mph)', 'Severity']].dropna()
    df = df[df['Wind_Speed(mph)'] <= 50].copy()
    df['wind_bin'] = (df['Wind_Speed(mph)'] / 5).round() * 5
    g = df.groupby('wind_bin')['Severity'].agg(['mean', 'std', 'count']).reset_index()
    g.columns = ['windBin', 'avgSeverity', 'std', 'count']
    g['std'] = g['std'].fillna(0)
    g['ci'] = 1.96 * g['std'] / np.sqrt(g['count'].clip(1))
    g['upper'] = (g['avgSeverity'] + g['ci']).round(3)
    g['lower'] = (g['avgSeverity'] - g['ci']).round(3)
    g['avgSeverity'] = g['avgSeverity'].round(3)
    return JSONResponse(g[['windBin', 'avgSeverity', 'upper', 'lower']].to_dict(orient='records'))


@app.get("/api/v2/rolling-trend")
def v2_rolling_trend():
    if global_df is None: return JSONResponse([])
    df = global_df.copy()
    df['Date'] = df['Start_Time'].dt.date
    daily = df.groupby('Date').size().reset_index(name='count')
    daily['date'] = daily['Date'].astype(str)
    daily = daily.sort_values('date').reset_index(drop=True)
    daily['roll7'] = daily['count'].rolling(7, min_periods=1).mean().round(1)
    daily['roll30'] = daily['count'].rolling(30, min_periods=1).mean().round(1)
    step = max(1, len(daily) // 300)
    return JSONResponse(daily[::step][['date', 'count', 'roll7', 'roll30']].to_dict(orient='records'))


# =====================================================================
# COMPARATIVE ANALYSIS ENDPOINTS
# =====================================================================

@app.get("/api/v2/slope-day-night")
def v2_slope_day_night():
    if global_df is None: return JSONResponse([])
    top_weather = global_df['Weather_Condition'].value_counts().head(8).index.tolist()
    df_f = global_df[global_df['Weather_Condition'].isin(top_weather)]
    g = df_f.groupby(['Weather_Condition', 'Sunrise_Sunset'])['Severity'].mean().reset_index()
    pivot = g.pivot_table(index='Weather_Condition', columns='Sunrise_Sunset', values='Severity').reset_index()
    pivot.columns.name = None
    pivot.rename(columns={'Weather_Condition': 'weather'}, inplace=True)
    return JSONResponse(pivot.round(3).to_dict(orient='records'))


@app.get("/api/v2/dual-axis-monthly")
def v2_dual_axis_monthly():
    if global_df is None: return JSONResponse([])
    df = global_df.copy()
    df['Year'] = df['Start_Time'].dt.year
    df['Month'] = df['Start_Time'].dt.month
    g = df.groupby(['Year', 'Month']).agg(count=('Severity', 'size'), avgSeverity=('Severity', 'mean')).reset_index()
    g['period'] = g['Year'].astype(str) + '-' + g['Month'].astype(str).str.zfill(2)
    g = g.sort_values('period')
    g['avgSeverity'] = g['avgSeverity'].round(3)
    return JSONResponse(g[['period', 'count', 'avgSeverity']].to_dict(orient='records'))


# =====================================================================
# PATTERN DISCOVERY ENDPOINTS
# =====================================================================

@app.get("/api/v2/contour-density")
def v2_contour_density():
    if global_df is None: return JSONResponse([])
    df = global_df[['Temperature(F)', 'Humidity(%)']].dropna()
    df = df[(df['Temperature(F)'].between(-10, 110)) & (df['Humidity(%)'].between(0, 100))]
    temp_bins = np.arange(-10, 111, 10)
    hum_bins = np.arange(0, 101, 10)
    temp_centers = [(temp_bins[i] + temp_bins[i+1]) / 2 for i in range(len(temp_bins)-1)]
    hum_centers = [(hum_bins[i] + hum_bins[i+1]) / 2 for i in range(len(hum_bins)-1)]
    df_c = df.copy()
    df_c['temp_bin'] = pd.cut(df['Temperature(F)'], bins=temp_bins, labels=temp_centers)
    df_c['hum_bin'] = pd.cut(df['Humidity(%)'], bins=hum_bins, labels=hum_centers)
    g = df_c.groupby(['temp_bin', 'hum_bin']).size().reset_index(name='count')
    g = g.dropna()
    return JSONResponse([{'temperature': float(r['temp_bin']), 'humidity': float(r['hum_bin']), 'count': int(r['count'])} for _, r in g.iterrows()])


@app.get("/api/v2/scatter-matrix")
def v2_scatter_matrix():
    if global_df is None: return JSONResponse([])
    cols = ['Temperature(F)', 'Humidity(%)', 'Visibility(mi)', 'Wind_Speed(mph)', 'Severity']
    df_clean = global_df[cols].dropna()
    df_clean = df_clean[(df_clean['Temperature(F)'].between(-20, 120)) & (df_clean['Humidity(%)'].between(0, 100)) & (df_clean['Visibility(mi)'].between(0, 15)) & (df_clean['Wind_Speed(mph)'].between(0, 60))]
    sample = df_clean.sample(n=min(600, len(df_clean)), random_state=42)
    sample.columns = ['temperature', 'humidity', 'visibility', 'windSpeed', 'severity']
    return JSONResponse(sample.round(2).to_dict(orient='records'))


@app.get("/api/v2/polar-hour")
def v2_polar_hour():
    if global_df is None: return JSONResponse([])
    hourly = global_df.groupby('Hour').size().reset_index(name='count')
    hourly.columns = ['hour', 'count']
    return JSONResponse(hourly.to_dict(orient='records'))


@app.get("/api/v2/grouped-boxplot")
def v2_grouped_boxplot():
    if global_df is None: return JSONResponse([])
    df = global_df[['Visibility(mi)', 'Severity', 'Sunrise_Sunset']].dropna()
    df = df[df['Visibility(mi)'] <= 15]
    result = []
    for sev in [1, 2, 3, 4]:
        for period in ['Day', 'Night']:
            vals = df[(df['Severity'] == sev) & (df['Sunrise_Sunset'] == period)]['Visibility(mi)']
            if len(vals) > 0:
                q1, q2, q3 = float(np.percentile(vals, 25)), float(np.percentile(vals, 50)), float(np.percentile(vals, 75))
                iqr = q3 - q1
                result.append({'severity': sev, 'period': period, 'q1': round(q1, 2), 'q2': round(q2, 2), 'q3': round(q3, 2), 'whiskerLow': round(float(max(vals.min(), q1 - 1.5 * iqr)), 2), 'whiskerHigh': round(float(min(vals.max(), q3 + 1.5 * iqr)), 2)})
    return JSONResponse(result)


# Expose the frontend natively if navigated directly
# Point to React build output when available, fall back to old frontend
react_dist = os.path.join(os.path.dirname(__file__), "..", "dashboard", "dist")
legacy_frontend = os.path.join(os.path.dirname(__file__), "..", "frontend")

if os.path.isdir(react_dist):
    app.mount("/", StaticFiles(directory=react_dist, html=True), name="frontend")
else:
    app.mount("/", StaticFiles(directory=legacy_frontend, html=True), name="frontend")

# ── Entry point for Railway deployment ──────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
