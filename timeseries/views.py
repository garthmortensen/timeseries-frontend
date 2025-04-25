#!/usr/bin/env python3
# timeseries/views.py

"""
Views for the timeseries app.
"""

import json
import logging
import requests
import pprint
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

# Get a logger instance specific to this module
logger = logging.getLogger(__name__)

def index(request):
    """
    Homepage with introduction to the time series analysis tool.
    """
    return render(request, 'timeseries/index.html')

def analysis(request):
    """
    Analysis page with form for configuring and running analysis.
    """
    return render(request, 'timeseries/analysis.html')

def about(request):
    """
    About page with project information and repository links.
    """
    return render(request, 'timeseries/about.html')
def results(request):
    """
    Results page displaying analysis output and visualizations.
    """
    return render(request, 'timeseries/results.html')

def debug_results(request):
    """
    Debug version of the results page with additional diagnostic information.
    """
    return render(request, 'timeseries/debug_results.html')

@csrf_exempt
def run_pipeline(request):
    """
    Proxy API endpoint that forwards the pipeline execution request to the FastAPI backend.
    
    The API returns:
    - Historical time series data
    - Stationarity test results
    - ARIMA model summary and forecast
    - GARCH model summary and forecast
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        # Get the request payload
        payload = json.loads(request.body)
        
        # Log the request
        logger.info(f"Forwarding pipeline request to backend with payload:")
        logger.info(pprint.pformat(payload, indent=2))
        
        # Forward the request to the FastAPI backend
        api_url = f"{settings.TIMESERIES_API_URL}/api/v1/run_pipeline"
        logger.info(f"Sending request to: {api_url}")
        
        response = requests.post(api_url, json=payload, timeout=60)  # Increased timeout for larger data
        
        # Check the response status code
        if response.status_code == 200:
            # Log success and response data structure 
            response_data = response.json()
            logger.info("Pipeline executed successfully")
            logger.info("Response keys: %s", response_data.keys())
            
            # Log specific details about the data structure
            if 'data' in response_data:
                logger.info("'data' key exists in response")
                logger.info("'data' type: %s", type(response_data['data']))
                if isinstance(response_data['data'], dict):
                    logger.info("'data' keys: %s", response_data['data'].keys())
                    # Log sample data for first symbol if available
                    if response_data['data'] and len(response_data['data']) > 0:
                        first_symbol = list(response_data['data'].keys())[0]
                        logger.info("First symbol: %s", first_symbol)
                        sample_data = response_data['data'][first_symbol]
                        logger.info("Sample data type: %s", type(sample_data))
                        if isinstance(sample_data, dict) and sample_data:
                            first_date = list(sample_data.keys())[0]
                            logger.info("First date: %s, value: %s", first_date, sample_data[first_date])
            else:
                logger.info("'data' key NOT found in response")
            
            # Log ARIMA and GARCH forecast availability
            logger.info("ARIMA forecast available: %s", 'arima_forecast' in response_data)
            if 'arima_forecast' in response_data:
                logger.info("ARIMA forecast length: %s", len(response_data['arima_forecast']))
            
            logger.info("GARCH forecast available: %s", 'garch_forecast' in response_data)
            if 'garch_forecast' in response_data:
                logger.info("GARCH forecast length: %s", len(response_data['garch_forecast']))
            
            # Log stationarity results availability
            logger.info("Stationarity results available: %s", 'stationarity_results' in response_data)
            
            return JsonResponse(response_data)
        else:
            # Log error and return the error response
            logger.error(f"Pipeline execution failed: {response.status_code} - {response.text}")
            return JsonResponse({'error': response.text}, status=response.status_code)
    
    except Exception as e:
        # Log exception and return error response
        logger.exception(f"Error running pipeline: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

# Add diagnostic endpoint for debugging
@csrf_exempt
def debug_data(request):
    """
    Diagnostic endpoint to check raw API response.
    
    Access this endpoint after running analysis to see the raw API data.
    """
    try:
        # Forward the request to the FastAPI backend with a test payload
        api_url = f"{settings.TIMESERIES_API_URL}/api/v1/run_pipeline"
        
        test_payload = {
            "source_actual_or_synthetic_data": "synthetic",
            "data_start_date": "2023-01-01",
            "data_end_date": "2023-02-01",
            "symbols": ["TEST1", "TEST2"],
            "synthetic_anchor_prices": [100.0, 200.0],
            "synthetic_random_seed": 42,
            "scaling_method": "standardize",
            "arima_params": {"p": 1, "d": 1, "q": 1},
            "garch_params": {"p": 1, "q": 1, "dist": "t"}
        }
        
        logger.info("Sending diagnostic request to API")
        response = requests.post(api_url, json=test_payload, timeout=60)
        
        # Check the response
        if response.status_code == 200:
            response_data = response.json()
            logger.info("Diagnostic API call successful")
            logger.info("Response keys: %s", response_data.keys())
            
            # Return HTML page with data structure visualization
            html = "<html><head><title>API Debug</title></head><body>"
            html += "<h1>API Response Debug</h1>"
            
            # Status and keys
            html += f"<h2>Status: {response.status_code}</h2>"
            html += f"<h2>Top-level keys:</h2><ul>"
            for key in response_data.keys():
                html += f"<li>{key} (type: {type(response_data[key]).__name__})</li>"
            html += "</ul>"
            
            # Data structure
            if 'data' in response_data:
                html += "<h2>Data structure:</h2>"
                data = response_data['data']
                if isinstance(data, dict):
                    html += "<ul>"
                    for symbol, values in data.items():
                        html += f"<li>Symbol: {symbol}<ul>"
                        if isinstance(values, dict):
                            # Show first 5 dates
                            dates = list(values.keys())[:5]
                            for date in dates:
                                html += f"<li>{date}: {values[date]}</li>"
                            html += f"<li>... ({len(values)} total dates)</li>"
                        else:
                            html += f"<li>Unexpected type: {type(values).__name__}</li>"
                        html += "</ul></li>"
                    html += "</ul>"
                else:
                    html += f"<p>Unexpected data type: {type(data).__name__}</p>"
            
            # ARIMA forecast
            if 'arima_forecast' in response_data:
                html += "<h2>ARIMA Forecast:</h2>"
                forecast = response_data['arima_forecast']
                if isinstance(forecast, list):
                    html += f"<p>Length: {len(forecast)}</p>"
                    if forecast:
                        html += "<p>First 5 values: "
                        html += ", ".join([str(val) for val in forecast[:5]])
                        html += "...</p>"
                else:
                    html += f"<p>Unexpected type: {type(forecast).__name__}</p>"
            
            # Full JSON
            html += "<h2>Full JSON Response:</h2>"
            html += f"<pre style='max-height:500px;overflow:auto'>{json.dumps(response_data, indent=2)}</pre>"
            
            html += "</body></html>"
            return HttpResponse(html)
        else:
            return HttpResponse(f"API Error: {response.status_code} - {response.text}")
    
    except Exception as e:
        logger.exception("Error in debug endpoint")
        return HttpResponse(f"Error: {str(e)}")
