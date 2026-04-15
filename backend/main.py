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
    # Using parent directory since backend is in /backend
    csv_path = os.path.join(os.path.dirname(__file__), "..", "US_Accidents_March23.csv")
    
    try:
        df = pd.read_csv(csv_path, nrows=200000)
    except FileNotFoundError:
        print(f"Error: {csv_path} not found.")
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


# Expose the frontend natively if navigated directly
# Point to React build output when available, fall back to old frontend
react_dist = os.path.join(os.path.dirname(__file__), "..", "dashboard", "dist")
legacy_frontend = os.path.join(os.path.dirname(__file__), "..", "frontend")

if os.path.isdir(react_dist):
    app.mount("/", StaticFiles(directory=react_dist, html=True), name="frontend")
else:
    app.mount("/", StaticFiles(directory=legacy_frontend, html=True), name="frontend")

