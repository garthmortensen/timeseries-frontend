#!/usr/bin/env python3
# api_mock/api_mock.py

"""
Mock FastAPI server for development.
This simulates the Timeseries Pipeline API for frontend development.
"""
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Initialize FastAPI app
app = FastAPI(
    title="Timeseries Pipeline API Mock",
    description="Mock API for frontend development",
    version="0.0.1",
)

# Define Pydantic models
class DataGenerationInput(BaseModel):
    start_date: str
    end_date: str
    anchor_prices: Dict[str, Any]

class MarketDataInput(BaseModel):
    symbols: List[str]
    start_date: str
    end_date: str
    interval: str = "1d"

class StationarityTestInput(BaseModel):
    data: List[Any]

class ARIMAInput(BaseModel):
    p: int
    d: int
    q: int
    data: List[Any]

class GARCHInput(BaseModel):
    p: int
    q: int
    data: List[Any]
    dist: Optional[str] = "normal"

class PipelineInput(BaseModel):
    source_actual_or_synthetic_data: Optional[str] = "actual"
    data_start_date: Optional[str] = "2023-01-01"
    data_end_date: Optional[str] = "2023-02-01"
    symbols: Optional[List[str]] = ["GME", "BYND", "BYD"]
    synthetic_anchor_prices: Optional[List[float]] = [150.0, 200.0, 15.0]
    synthetic_random_seed: Optional[int] = 1
    scaling_method: Optional[str] = "standardize"
    arima_params: Optional[Dict[str, Any]] = {"p": 2, "d": 1, "q": 4}
    garch_params: Optional[Dict[str, Any]] = {"p": 1, "q": 1, "dist": "t"}

class TimeSeriesDataResponse(BaseModel):
    data: Dict[str, Any]

class StationarityTestResponse(BaseModel):
    adf_statistic: float
    p_value: float
    critical_values: Dict[str, float]
    is_stationary: bool
    interpretation: str

class PipelineResponse(BaseModel):
    stationarity_results: StationarityTestResponse
    arima_summary: str
    arima_forecast: List[float]
    garch_summary: str
    garch_forecast: List[float]

# Helper functions
def generate_mock_time_series(
    start_date_str: str, end_date_str: str, anchor_price: float, seed: int = None
) -> List[float]:
    """Generate synthetic time series data."""
    if seed is not None:
        np.random.seed(seed)
    
    # Parse dates
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    
    # Calculate number of days
    days = (end_date - start_date).days + 1
    
    # Generate time series
    returns = np.random.normal(0, 0.02, days)
    prices = [anchor_price]
    
    for r in returns:
        prices.append(prices[-1] * (1 + r))
    
    return prices

# API routes
@app.get("/")
def root():
    """Root endpoint for API health check."""
    return {"status": "ok", "message": "Timeseries Pipeline API Mock is running"}

@app.get("/favicon.ico")
def ignore_favicon():
    """Ignore favicon requests."""
    return {}

@app.post("/api/generate_data", response_model=TimeSeriesDataResponse)
def generate_data_endpoint(input_data: DataGenerationInput):
    """Generate synthetic time series data."""
    result = {"data": {}}
    
    for symbol, price in input_data.anchor_prices.items():
        time_series = generate_mock_time_series(
            input_data.start_date, input_data.end_date, float(price)
        )
        
        # Create date range
        start_date = datetime.strptime(input_data.start_date, "%Y-%m-%d")
        dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(len(time_series))]
        
        # Add to result
        result["data"][symbol] = dict(zip(dates, time_series))
    
    return result

@app.post("/api/fetch_market_data", response_model=TimeSeriesDataResponse)
def fetch_market_data_endpoint(input_data: MarketDataInput):
    """Fetch mock market data."""
    result = {"data": {}}
    
    for symbol in input_data.symbols:
        # Random anchor price between 50 and 500
        anchor_price = random.uniform(50, 500)
        
        time_series = generate_mock_time_series(
            input_data.start_date, input_data.end_date, anchor_price
        )
        
        # Create date range
        start_date = datetime.strptime(input_data.start_date, "%Y-%m-%d")
        dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(len(time_series))]
        
        # Add to result
        result["data"][symbol] = dict(zip(dates, time_series))
    
    return result

@app.post("/api/test_stationarity", response_model=StationarityTestResponse)
def test_stationarity_endpoint(input_data: StationarityTestInput):
    """Test for stationarity."""
    # Mock stationarity test results
    is_stationary = random.choice([True, False])
    
    return {
        "adf_statistic": random.uniform(-4, 0),
        "p_value": random.uniform(0, 0.1) if is_stationary else random.uniform(0.1, 0.5),
        "critical_values": {
            "1%": -3.5,
            "5%": -2.9,
            "10%": -2.6,
        },
        "is_stationary": is_stationary,
        "interpretation": (
            "The time series is stationary based on the ADF test results. "
            "The null hypothesis of a unit root is rejected."
            if is_stationary
            else "The time series is non-stationary based on the ADF test results. "
            "The null hypothesis of a unit root cannot be rejected."
        ),
    }

@app.post("/api/run_arima", response_model=dict)
def run_arima_endpoint(input_data: ARIMAInput):
    """Run ARIMA model."""
    return {
        "fitted_model": f"ARIMA({input_data.p},{input_data.d},{input_data.q}) Results",
        "parameters": {
            "ar.L1": 0.7,
            "ma.L1": 0.3,
        },
        "p_values": {
            "ar.L1": 0.001,
            "ma.L1": 0.02,
        },
        "forecast": [random.uniform(100, 200) for _ in range(10)],
    }

@app.post("/api/run_garch", response_model=dict)
def run_garch_endpoint(input_data: GARCHInput):
    """Run GARCH model."""
    return {
        "fitted_model": f"GARCH({input_data.p},{input_data.q}) with {input_data.dist} distribution",
        "forecast": [random.uniform(0.01, 0.05) for _ in range(10)],
    }

@app.post("/api/v1/run_pipeline", response_model=PipelineResponse)
def run_pipeline_endpoint(input_data: PipelineInput):
    """Execute the complete pipeline."""
    # Mock stationarity results
    is_stationary = random.choice([True, False])
    stationarity_results = {
        "adf_statistic": random.uniform(-4, 0),
        "p_value": random.uniform(0, 0.1) if is_stationary else random.uniform(0.1, 0.5),
        "critical_values": {
            "1%": -3.5,
            "5%": -2.9,
            "10%": -2.6,
        },
        "is_stationary": is_stationary,
        "interpretation": (
            "The time series is stationary based on the ADF test results. "
            "The null hypothesis of a unit root is rejected."
            if is_stationary
            else "The time series is non-stationary based on the ADF test results. "
            "The null hypothesis of a unit root cannot be rejected."
        ),
    }
    
    # Generate mock ARIMA summary
    arima_p = input_data.arima_params.get("p", 2)
    arima_d = input_data.arima_params.get("d", 1)
    arima_q = input_data.arima_params.get("q", 4)
    
    arima_summary = f"""
                         ARIMA Model Results                              
==============================================================================
Dep. Variable:                      y   No. Observations:                  100
Model:                 ARIMA({arima_p},{arima_d},{arima_q})   Log Likelihood                -135.23
Method:                       css-mle   S.D. of innovations                  1.21
Date:                {datetime.now().strftime('%a, %d %b %Y')}   AIC                           280.45
Time:                        {datetime.now().strftime('%H:%M:%S')}   BIC                           289.89
Sample:                             0   HQIC                          284.34
                                                                              
==============================================================================
                 coef    std err          z      P>|z|      [0.025      0.975]
------------------------------------------------------------------------------
const          0.0020      0.001      2.028      0.042       0.000       0.004
ar.L1          0.8837      0.038     23.459      0.000       0.810       0.957
ma.L1          0.2523      0.093      2.713      0.007       0.070       0.435
ma.L2         -0.0377      0.073     -0.516      0.606      -0.181       0.106
ma.L3          0.0345      0.073      0.475      0.635      -0.108       0.177
ma.L4          0.0301      0.062      0.484      0.628      -0.092       0.152
sigma2         1.4664      0.154      9.487      0.000       1.162       1.769
==============================================================================
Warnings:
[1] Covariance matrix calculated using the outer product of gradients (complex-step).
"""
    
    # Generate mock GARCH summary
    garch_p = input_data.garch_params.get("p", 1)
    garch_q = input_data.garch_params.get("q", 1)
    garch_dist = input_data.garch_params.get("dist", "t")
    
    garch_summary = f"""
                        GARCH Model Results                              
==============================================================================
Dep. Variable:                      y   R-squared:                       0.001
Mean Model:             Constant Mean   Adj. R-squared:                  0.000
Vol Model:                GARCH({garch_p},{garch_q})   Log-Likelihood:               -132.41
Distribution:                     {garch_dist}   AIC:                           272.82
Method:            Maximum Likelihood   BIC:                           283.65
                                        No. Observations:                  100
Date:              {datetime.now().strftime('%a, %d %b %Y')}   Df Residuals:                      98
Time:                      {datetime.now().strftime('%H:%M:%S')}   Df Model:                           2
                                                                      
===============================================================================
                  coef    std err          t      P>|t|      95.0% Conf. Int.
-------------------------------------------------------------------------------
mu             0.0010   9.49e-03      0.109      0.914 [-1.749e-02,1.949e-02]
omega          0.0500      0.023      2.219      0.026 [5.885e-03,9.422e-02]
alpha[1]       0.2000      0.065      3.071      0.002     [0.072,0.328]
beta[1]        0.7000      0.060     11.614      0.000     [0.582,0.818]
===============================================================================
"""
    
    # Generate mock forecasts
    forecast_length = 30
    arima_forecast = [random.uniform(100, 200) for _ in range(forecast_length)]
    garch_forecast = [random.uniform(0.01, 0.05) for _ in range(forecast_length)]
    
    return {
        "stationarity_results": stationarity_results,
        "arima_summary": arima_summary,
        "arima_forecast": arima_forecast,
        "garch_summary": garch_summary,
        "garch_forecast": garch_forecast,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)