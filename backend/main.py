from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import warnings

warnings.filterwarnings("ignore")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- EXPERIMENT 1: REAL STOCK PREDICTION (ARIMA) ---
@app.get("/api/invest/forecast")
def get_real_stock_forecast():
    # 1. Fetch REAL stock data from Yahoo Finance (e.g., S&P 500 ETF)
    ticker = "SPY"
    stock_data = yf.Ticker(ticker)
    # Get the last 1 year of daily closing prices
    hist = stock_data.history(period="1y") 
    
    if hist.empty:
        return {"error": "Failed to fetch data from yfinance"}

    # 2. Extract just the closing prices for the math model
    closing_prices = hist['Close'].values
    dates = hist.index

    # 3. Run the ARIMA Model on the REAL data
    # (Order 5,1,0 is a standard baseline for daily stock volatility)
    model = ARIMA(closing_prices, order=(5, 1, 0))
    fitted_model = model.fit()
    
    # 4. Predict the next 7 days of the stock market
    forecast = fitted_model.forecast(steps=7)
    
    # 5. Format the output for the React frontend
    # Grab the last 14 days of ACTUAL data to show history
    recent_history = hist.tail(14)
    
    results = []
    # Add the actual past 14 days
    for date, row in recent_history.iterrows():
        results.append({
            "date": date.strftime("%b %d"),
            "actual_price": round(row['Close'], 2),
            "predicted_price": None # We know the actual price here
        })
        
    # Add the predicted next 7 days
    future_dates = pd.date_range(start=recent_history.index[-1] + pd.Timedelta(days=1), periods=7, freq='B')
    for date, pred_val in zip(future_dates, forecast):
        results.append({
            "date": date.strftime("%b %d"),
            "actual_price": None, # It hasn't happened yet
            "predicted_price": round(pred_val, 2)
        })

    return {
        "ticker": ticker,
        "current_price": round(closing_prices[-1], 2),
        "data": results
    }