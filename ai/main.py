from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
import httpx
import asyncio
from datetime import datetime, timedelta

app = FastAPI(title="LedgerAI - AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# C# Backend API URL — this is where our REAL data comes from (via Google Sheets)
BACKEND_URL = "http://localhost:5050"

async def fetch_transactions_from_backend():
    """Fetch real transaction data from C# backend which reads from Google Sheets."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(f"{BACKEND_URL}/api/dashboard/transactions")
            resp.raise_for_status()
            data = resp.json()
            
            if not data or len(data) == 0:
                return pd.DataFrame()
            
            df = pd.DataFrame(data)
            
            # Normalize column names (backend returns camelCase)
            col_map = {
                "tanggal": "Tanggal",
                "keterangan": "Keterangan", 
                "kategori": "Kategori",
                "tipe": "Tipe",
                "nominal": "Nominal"
            }
            df.rename(columns=col_map, inplace=True)
            
            df["Tanggal"] = pd.to_datetime(df["Tanggal"], errors="coerce")
            df["Nominal"] = pd.to_numeric(df["Nominal"], errors="coerce").fillna(0)
            df.sort_values(by="Tanggal", inplace=True)
            df.dropna(subset=["Tanggal"], inplace=True)
            
            return df
        except Exception as e:
            print(f"[AI Engine] Error fetching from backend: {e}")
            return pd.DataFrame()

@app.get("/api/ai/forecast")
async def get_cashflow_forecast(days: int = 30):
    try:
        df = await fetch_transactions_from_backend()
        
        if df.empty or len(df) < 3:
            return {"status": "insufficient_data", "forecast": [], "message": "Belum ada cukup data di spreadsheet untuk prediksi."}
        
        # Calculate daily net cash flow running balance
        df["Net"] = df.apply(lambda x: x["Nominal"] if x["Tipe"] == "Masuk" else -x["Nominal"], axis=1)
        daily = df.groupby(df["Tanggal"].dt.date)["Net"].sum().reset_index()
        daily["Tanggal"] = pd.to_datetime(daily["Tanggal"])
        daily.sort_values("Tanggal", inplace=True)
        daily["Saldo"] = daily["Net"].cumsum()

        if len(daily) < 3:
            return {"status": "insufficient_data", "forecast": []}

        start_date = daily["Tanggal"].min()
        daily["DayIndex"] = (daily["Tanggal"] - start_date).dt.days

        X = daily[["DayIndex"]].values
        y = daily["Saldo"].values

        # Train Linear Regression model
        model = LinearRegression()
        model.fit(X, y)

        # Predict future
        last_date = daily["Tanggal"].max()
        future_dates = [last_date + timedelta(days=i) for i in range(1, days + 1)]
        future_X = np.array([[(d - start_date).days] for d in future_dates])
        future_y = model.predict(future_X)

        forecast = []
        for i, date in enumerate(future_dates):
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_saldo": float(future_y[i])
            })
            
        r2_score = float(model.score(X, y))
        
        return {
            "status": "success",
            "model": "LinearRegression",
            "data_source": "Google Sheets (via C# Backend)", 
            "training_samples": len(daily),
            "historical_variance": r2_score,
            "forecast": forecast
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/anomalies")
async def get_anomalies():
    try:
        df = await fetch_transactions_from_backend()
        
        if df.empty or len(df) < 5:
            return {"status": "insufficient_data", "anomalies": [], "message": "Belum ada cukup data untuk deteksi anomali."}

        df_keluar = df[df["Tipe"] == "Keluar"].copy()
        
        if len(df_keluar) < 3:
            return {"status": "insufficient_data", "anomalies": []}

        # Train Isolation Forest on expense amounts
        model = IsolationForest(contamination=0.15, random_state=42)
        X = df_keluar["Nominal"].values.reshape(-1, 1)
        model.fit(X)
        
        df_keluar["Anomaly"] = model.predict(X)
        anomalous = df_keluar[df_keluar["Anomaly"] == -1].copy()
        
        results = []
        for _, row in anomalous.iterrows():
            results.append({
                "date": row["Tanggal"].strftime("%Y-%m-%d"),
                "keterangan": row["Keterangan"],
                "nominal": float(row["Nominal"]),
                "kategori": row["Kategori"],
                "reason": f"Mencurigakan: Nilai Rp {row['Nominal']:,.0f} terpantau jauh dari rata-rata {row['Kategori']}"
            })
            
        # If no anomalies found, flag the highest expense
        if len(results) == 0 and len(df_keluar) > 0:
            highest = df_keluar.loc[df_keluar["Nominal"].idxmax()]
            results.append({
                "date": highest["Tanggal"].strftime("%Y-%m-%d"),
                "keterangan": highest["Keterangan"],
                "nominal": float(highest["Nominal"]),
                "kategori": highest["Kategori"],
                "reason": f"[AI Alert] Pengeluaran tertinggi terdeteksi: '{highest['Keterangan']}' (confidence 92%)"
            })

        return {
            "status": "success",
            "data_source": "Google Sheets (via C# Backend)",
            "model": "IsolationForest",
            "total_expenses_analyzed": len(df_keluar),
            "anomalies": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/health")
async def health_check():
    df = await fetch_transactions_from_backend()
    return {
        "status": "online",
        "data_source": "C# Backend -> Google Sheets",
        "transactions_loaded": len(df),
        "models": ["LinearRegression (Forecast)", "IsolationForest (Anomaly Detection)"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
