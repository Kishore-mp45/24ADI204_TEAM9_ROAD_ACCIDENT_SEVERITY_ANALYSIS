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

@app.get("/api/kpis")
def get_kpis():
    if global_df is None: return JSONResponse({"error": "No data available."})
    return {
        "total_sample": len(global_df),
        "top_state": global_df['State'].mode().iloc[0],
        "top_weather": global_df['Weather_Condition'].mode().iloc[0],
        "avg_severity": round(global_df['Severity'].mean(), 2)
    }

# --- OVERVIEW PAGE PLOTS ---
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

# --- DISTRIBUTION PAGE PLOTS ---
@app.get("/api/charts/feature-hist/{feature}")
def feature_hist(feature: str):
    if global_df is None: return Response(content="{}")
    # Decode URL-safe strings if needed, though FastAPI handles paths well
    actual_feature = feature
    if actual_feature not in global_df.columns: 
        return Response(content="{}")
        
    fig = px.histogram(global_df, x=actual_feature, nbins=50, title=f"{actual_feature} Density & Spread")
    fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    return Response(content=fig.to_json(), media_type="application/json")

# --- CORRELATION PAGE PLOTS ---
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

# --- ADVANCED INSIGHTS PAGE PLOTS ---
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
    # Sample down farther for the scatter so the browser doesn't freeze (100k points in Plotly.js can be laggy)
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

# Expose the frontend natively if navigated directly
app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "frontend"), html=True), name="frontend")
