import json
import requests
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.shortcuts import render

def run_pipeline_proxy(request):
    if request.method == "POST":
        data = request.POST
        # Parse symbols and anchor prices
        symbols = [s.strip() for s in data.get("synthetic_symbols", data.get("symbols", "")).split(",") if s.strip()]
        anchor_prices = [float(x.strip()) for x in data.get("synthetic_anchor_prices", "").split(",") if x.strip()]
        # ARIMA and GARCH params
        arima_params = {
            "p": int(data.get("arima_p", 1)),
            "d": int(data.get("arima_d", 1)),
            "q": int(data.get("arima_q", 1)),
            "forecast_steps": int(data.get("arima_forecast_steps", 10)),
        }
        garch_params = {
            "p": int(data.get("garch_p", 1)),
            "q": int(data.get("garch_q", 1)),
            "dist": data.get("garch_dist", "t"),
            "forecast_steps": 3,
        }
        # Spillover params
        spillover_enabled = data.get("enable_spillover") == "on"
        spillover_params = {
            "method": data.get("spillover_method", "diebold_yilmaz"),
            "forecast_horizon": int(data.get("forecast_horizon", 5)),
            "window_size": None,
            "var_lag_selection_method": data.get("var_lag_selection_method", "aic"),
            "max_lags": int(data.get("max_lags", 10)),
            "granger_significance_level": float(data.get("granger_significance_level", 0.05)),
            "include_granger": data.get("include_granger") == "on",
            "include_fevd_details": data.get("include_fevd_details") == "on",
        }
        payload = {
            "source_actual_or_synthetic_data": data.get("source_actual_or_synthetic_data", "synthetic"),
            "symbols": symbols,
            "synthetic_anchor_prices": dict(zip(symbols, anchor_prices)),
            "data_start_date": data.get("data_start_date"),
            "data_end_date": data.get("data_end_date"),
            "scaling_method": data.get("scaling_method", "standardize"),
            "arima_params": arima_params,
            "garch_params": garch_params,
            "spillover_enabled": spillover_enabled,
            "spillover_params": spillover_params,
        }
        # Send to backend API
        response = requests.post("http://localhost:8001/api/v1/run_pipeline", json=payload)
        # Optionally, render a template with results or redirect
        if response.status_code == 200:
            return render(request, "timeseries/analysis_results.html", {"results": response.json()})
        else:
            return render(request, "timeseries/analysis_results.html", {"error": response.text})
    else:
        return HttpResponseRedirect(reverse("timeseries:analysis"))
