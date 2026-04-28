from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from transformers import pipeline
import warnings

import database

warnings.filterwarnings("ignore")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the NLP Pipeline (Exp 4)
# This uses a lightweight BERT-based sentiment model.
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

# ==========================================
# EXP 1: DYNAMIC STOCK PREDICTION (ARIMA)
# ==========================================
@app.get("/api/invest/forecast")
def get_real_stock_forecast(ticker: str = "SPY", period: str = "1mo", interval: str = "1d", steps: int = 7):
    # Fetch REAL stock data from Yahoo Finance
    stock_data = yf.Ticker(ticker)
    
    # yfinance has strict rules: you cannot request 1-minute data for a whole year.
    # We use a try/except to catch invalid timeframe requests
    try:
        hist = stock_data.history(period=period, interval=interval)
    except Exception as e:
        return {"error": f"yfinance error: {str(e)}"}
    
    if hist.empty:
        return {"error": "Invalid Ticker Symbol or unsupported timeframe combination."}

    # Drop any rows with NaN values which crash ARIMA
    hist = hist.dropna(subset=['Close'])
    closing_prices = hist['Close'].values
    
    try:
        # ARIMA Model
        model = ARIMA(closing_prices, order=(5, 1, 0))
        fitted_model = model.fit()
        forecast = fitted_model.forecast(steps=steps)
    except Exception as e:
        return {"error": "Not enough historical data points to run ARIMA math."}
    
    # Format for React
    recent_history = hist.tail(30) # Show last 30 periods on chart
    results = []
    
    for date, row in recent_history.iterrows():
        results.append({
            # Format time differently if it's intraday (15m/1h) vs daily
            "date": date.strftime("%b %d %H:%M") if "m" in interval or "h" in interval else date.strftime("%b %d"),
            "actual_price": round(row['Close'], 2),
            "predicted_price": None
        })
        
    # Generate future timestamps
    last_date = recent_history.index[-1]
    
    # Calculate what the next time step should be based on user interval
    if interval == "15m":
        delta = pd.Timedelta(minutes=15)
    elif interval == "1h":
        delta = pd.Timedelta(hours=1)
    elif interval == "1wk":
        delta = pd.Timedelta(weeks=1)
    else:
        delta = pd.Timedelta(days=1)
        
    future_dates = pd.date_range(start=last_date + delta, periods=steps, freq=delta)
    for date, pred_val in zip(future_dates, forecast):
        results.append({
            "date": date.strftime("%b %d %H:%M") if "m" in interval or "h" in interval else date.strftime("%b %d"),
            "actual_price": None,
            "predicted_price": round(pred_val, 2)
        })

    return {
        "ticker": ticker.upper(),
        "current_price": round(closing_prices[-1], 2),
        "data": results
    }

# ==========================================
# EXP 6: ANOMALY DETECTION (ISOLATION FOREST)
# ==========================================
class TransactionCreate(BaseModel):
    vendor: str
    amount: float
    category_code: int

@app.post("/api/transactions")
def create_and_audit_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    np.random.seed(10)
    X_train = pd.DataFrame({
        'Amount': np.random.normal(loc=150, scale=30, size=500),
        'Category': np.random.randint(0, 4, size=500)
    })
    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_forest.fit(X_train)
    
    X_new = pd.DataFrame({'Amount': [tx.amount], 'Category': [tx.category_code]})
    is_anomaly = bool(iso_forest.predict(X_new)[0] == -1)
    
    db_tx = database.Transaction(
        vendor=tx.vendor, amount=tx.amount, category_code=tx.category_code,
        is_anomaly=is_anomaly, status="Flagged for Audit" if is_anomaly else "Approved"
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.get("/api/transactions")
def get_transactions(db: Session = Depends(get_db)):
    return db.query(database.Transaction).order_by(database.Transaction.id.desc()).limit(10).all()

# ==========================================
# EXP 3: VENDOR RISK CLASSIFICATION (RANDOM FOREST)
# ==========================================
class VendorData(BaseModel):
    delay_days: float
    defect_rate: float
    past_disputes: int

@app.post("/api/vendor/risk")
def calculate_vendor_risk(data: VendorData):
    # Train a fast Random Forest on synthetic historical vendor data
    # Features: [Avg Delay Days, Defect Rate %, Past Disputes]
    X = [[0, 0.01, 0], [1, 0.02, 0], [5, 0.05, 1], [15, 0.1, 3], [2, 0.02, 0], [25, 0.15, 5], [10, 0.08, 2]]
    y = [0, 0, 1, 1, 0, 1, 1] # 0 = Safe, 1 = Risky
    
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X, y)
    
    # Predict new vendor
    risk_prediction = clf.predict([[data.delay_days, data.defect_rate, data.past_disputes]])[0]
    risk_probability = clf.predict_proba([[data.delay_days, data.defect_rate, data.past_disputes]])[0]
    
    score = round(risk_probability[0] * 100) # Convert "safe" probability to a 0-100 score
    
    return {
        "is_risky": bool(risk_prediction == 1),
        "credit_score": score,
        "recommendation": "Do not advance cash." if risk_prediction == 1 else "Approved for standard terms."
    }

# ==========================================
# EXP 4: MARKET SENTIMENT (NLP / BERT)
# ==========================================
class NewsData(BaseModel):
    headline: str

@app.post("/api/market/sentiment")
def analyze_market_sentiment(news: NewsData):
    # Pass the user's headline through the DistilBERT model
    result = sentiment_analyzer(news.headline)[0]
    
    return {
        "headline": news.headline,
        "sentiment": result['label'], # 'POSITIVE' or 'NEGATIVE'
        "confidence": round(result['score'] * 100, 2)
    }