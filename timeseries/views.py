#!/usr/bin/env python3
# timeseries/views.py

#
# === FILE META OPENING ===
# file: ./timeseries-frontend/timeseries/views.py
# role: frontend
# desc: Django views that handle user requests and communicate with the timeseries API backend
# === FILE META CLOSING ===
#

"""
Views for the timeseries app.
"""

import json
import logging
import requests
import pprint
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .results_processor import ResultsProcessor
from django.urls import reverse
import uuid
from datetime import datetime

# Get a logger instance specific to this module
logger = logging.getLogger(__name__)


def _proxy_request(request: HttpRequest, path: str) -> tuple[int, str]:
    """
    Helper function to forward requests to the backend API.
    """
    api_url = f"{settings.TIMESERIES_API_URL}/api/v1/{path}"
    method = request.method
    logger.info(f"Proxying {method} request to {api_url}")

    try:
        response = requests.request(
            method,
            api_url,
            headers={key: value for key, value in request.headers.items() if key.lower() in ['content-type', 'accept', 'authorization']},
            data=request.body,
            timeout=30
        )
        response.raise_for_status()
        return response.status_code, response.text
    except requests.exceptions.RequestException as e:
        logger.error(f"API request to {api_url} failed: {e}")
        return 500, str(e)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def run_pipeline(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        status_code, response_text = _proxy_request(request, 'run_pipeline')
        if status_code == 200:
            try:
                data = json.loads(response_text)
                task_id = data.get("task_id")
                if task_id:
                    return JsonResponse({"task_id": task_id})
                else:
                    return JsonResponse({"error": "task_id not in response"}, status=500)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON response from API"}, status=500)
        return JsonResponse({"error": response_text}, status=status_code)

    elif request.method == 'GET':
        task_id = request.GET.get('task_id')
        if not task_id:
            return JsonResponse({"status": "error", "message": "task_id is required"}, status=400)

        status_code, response_text = _proxy_request(request, f'results/{task_id}')

        if status_code == 200:
            try:
                data = json.loads(response_text)
                processor = ResultsProcessor(data)
                if processor.is_ready():
                    return JsonResponse({
                        "status": "completed",
                        "data": processor.get_processed_results()
                    })
                else:
                    return JsonResponse({"status": "pending"})
            except json.JSONDecodeError:
                return JsonResponse({"status": "error", "message": "Invalid JSON response"}, status=500)
        elif status_code == 202:
             return JsonResponse({"status": "pending"})
        else:
            return JsonResponse({"status": "error", "message": response_text}, status=status_code)


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


def results(request: HttpRequest) -> HttpResponse:
    """
    Results page that displays processed analysis results from Django session.
    No longer relies on client-side JavaScript parsing.
    """
    # Get processed results from session
    processed_results = request.session.get('analysis_results')
    raw_results = request.session.get('analysis_raw_results')
    
    if not processed_results:
        # No results found, redirect to analysis page
        return render(request, 'timeseries/results.html', {
            'no_results': True,
            'error_message': 'No analysis results found. Please run an analysis first.'
        })
    
    # Debug: Log what we have in execution_configuration
    execution_config = processed_results.get('execution_configuration', {})
    logger.info(f"DEBUG: execution_configuration keys: {list(execution_config.keys())}")
    if execution_config.get('data_source'):
        logger.info(f"DEBUG: data_source keys: {list(execution_config['data_source'].keys())}")
    if execution_config.get('model_configurations'):
        logger.info(f"DEBUG: model_configurations keys: {list(execution_config['model_configurations'].keys())}")
    
    # Prepare context for template
    context = {
        'results_available': True,
        'processed_results': processed_results,
        'raw_results': raw_results,
        'symbols': processed_results.get('symbols', []),
        'executive_summary': processed_results.get('executive_summary', {}),
        'execution_configuration': execution_config,  # Use the extracted config
        'data_arrays': processed_results.get('data_arrays', {}),
        'stationarity_results': processed_results.get('stationarity_results', {}),
        'arima_results': processed_results.get('arima_results', {}),
        'garch_results': processed_results.get('garch_results', {}),
        'var_results': processed_results.get('var_results', {}),
        'spillover_results': processed_results.get('spillover_results', {}),
        'granger_causality_results': processed_results.get('granger_causality_results', {}),
        'spillover_enabled': bool(processed_results.get('spillover_results')),
        'active_tab': 'overview'  # Default active tab
    }
    
    return render(request, 'timeseries/results.html', context)


def api_proxy(request: HttpRequest, path: str) -> HttpResponse:
    """
    A generic proxy view to forward requests to the backend API.
    It captures the part of the URL after /api_proxy/ and appends it to settings.TIMESERIES_API_URL.
    """
    response = _proxy_request(request, path)

    if isinstance(response, (HttpResponse, JsonResponse)):
        return response

    try:
        if 'application/json' in response.headers.get('Content-Type', ''):
            return JsonResponse(response.json(), status=response.status_code)
        else:
            return HttpResponse(response.content, status=response.status_code, content_type=response.headers.get('Content-Type'))
    except requests.exceptions.Timeout:
        logger.error(f"Timeout error when proxying request to {request.path}")
        return JsonResponse({'error': 'The request to the backend API timed out.'}, status=504)
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error when proxying request to {request.path}")
        return JsonResponse({'error': 'Could not connect to the backend API.'}, status=503)
    except Exception as e:
        logger.exception(f"Unexpected error in API proxy view: {str(e)}")
        return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)


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

def results_test(request):
    return HttpResponse("This is a test response.")

def chart_data(request):
    """
    View to handle requests for chart data.
    """
    # For now, just return a simple JSON response
    return JsonResponse({
        "status": "success",
        "data": {
            "labels": ["January", "February", "March", "April"],
            "datasets": [
                {
                    "label": "Sample Data",
                    "data": [10, 20, 30, 40],
                    "fill": False,
                    "borderColor": "rgb(75, 192, 192)",
                    "tension": 0.1
                }
            ]
        }
    })

def iterate(request):
    if request.method == 'POST':
        previous_session_id = request.POST.get('session_id')
        # Here you would add logic to retrieve the parameters from the previous session
        # and set them up for the new analysis page.
        # For now, we'll just redirect to the analysis page.
        return redirect(reverse('timeseries:analysis'))
    # If it's not a POST request, just redirect to the main page or show an error.
    return redirect(reverse('timeseries:index'))

@csrf_exempt
def run_pipeline_proxy(request):
    if request.method == "POST":
        # Support both JSON and form POSTs
        if request.content_type and "application/json" in request.content_type:
            try:
                data = json.loads(request.body)
            except Exception:
                data = {}
        else:
            data = request.POST
        
        logger.info("[DEBUG] Incoming POST data received")
        
        # Process form data into API payload
        symbols = data.get("symbols", [])
        if isinstance(symbols, str):
            symbols = [s.strip() for s in symbols.split(",") if s.strip()]
            
        anchor_prices = data.get("synthetic_anchor_prices", [])
        if isinstance(anchor_prices, str):
            anchor_prices = [float(x.strip()) for x in anchor_prices.split(",") if x.strip()]
        elif isinstance(anchor_prices, list):
            anchor_prices = [float(x) for x in anchor_prices]
        else:
            anchor_prices = []
            
        payload = {
            "source_actual_or_synthetic_data": data.get("source_actual_or_synthetic_data", "synthetic"),
            "symbols": symbols,
            "synthetic_anchor_prices": anchor_prices,
            "data_start_date": data.get("data_start_date"),
            "data_end_date": data.get("data_end_date"),
            "scaling_method": data.get("scaling_method", "standardize"),
            "arima_params": data.get("arima_params", {
                "p": int(data.get("arima_p", 1)),
                "d": int(data.get("arima_d", 1)),
                "q": int(data.get("arima_q", 1)),
                "forecast_steps": int(data.get("arima_forecast_steps", 10)),
            }),
            "garch_params": data.get("garch_params", {
                "p": int(data.get("garch_p", 1)),
                "q": int(data.get("garch_q", 1)),
                "dist": data.get("garch_dist", "t"),
                "forecast_steps": 3,
            }),
            "spillover_enabled": data.get("spillover_enabled") is True or data.get("enable_spillover") == "on",
            "spillover_params": data.get("spillover_params", {
                "method": data.get("spillover_method", "diebold_yilmaz"),
                "forecast_horizon": int(data.get("forecast_horizon", 5)),
                "window_size": None,
                "var_lag_selection_method": data.get("var_lag_selection_method", "aic"),
                "max_lags": int(data.get("max_lags", 10)),
                "granger_significance_level": float(data.get("granger_significance_level", 0.05)),
                "include_granger": data.get("include_granger") == "on" or data.get("include_granger") is True,
                "include_fevd_details": data.get("include_fevd_details") == "on" or data.get("include_fevd_details") is True,
            })
        }
        
        # Clean payload
        allowed_keys = {
            "source_actual_or_synthetic_data", "symbols", "synthetic_anchor_prices",
            "data_start_date", "data_end_date", "scaling_method",
            "arima_params", "garch_params", "spillover_enabled", "spillover_params"
        }
        payload = {k: v for k, v in payload.items() if k in allowed_keys}
        
        logger.info("[DEBUG] Sending payload to API")
        
        try:
            # Call the API
            response = requests.post("http://localhost:8001/api/v1/run_pipeline", json=payload, timeout=120)
            
            if response.status_code == 200:
                # Parse and process the API response server-side
                api_results = response.json()
                logger.info("API call successful, processing results server-side")
                
                # Process the results using our ResultsProcessor
                processor = ResultsProcessor(api_results)
                processed_results = processor.process_all()
                
                # Store processed results in session for the results page
                request.session['analysis_results'] = processed_results
                request.session['analysis_raw_results'] = api_results
                
                # Return JSON response indicating success and redirect URL
                return JsonResponse({
                    "status": "success",
                    "redirect_url": reverse('timeseries:results')
                })
            else:
                logger.error(f"API call failed with status {response.status_code}")
                return JsonResponse({
                    "status": "error", 
                    "error": response.text
                }, status=response.status_code)
                
        except requests.exceptions.Timeout:
            logger.error("API request timed out")
            return JsonResponse({
                "status": "error",
                "error": "The analysis request timed out. Please try again with a smaller dataset or shorter time range."
            }, status=504)
        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to API")
            return JsonResponse({
                "status": "error",
                "error": "Could not connect to the analysis API. Please check that the backend service is running."
            }, status=503)
        except Exception as e:
            logger.exception("Unexpected error during API call")
            return JsonResponse({
                "status": "error",
                "error": f"An unexpected error occurred: {str(e)}"
            }, status=500)
    else:
        return redirect(reverse("timeseries:analysis"))

def download_api_response(request: HttpRequest) -> HttpResponse:
    """
    Download the raw API response as a JSON file - unmodified original response.
    """
    # Get the raw results from session (unmodified API response)
    raw_results = request.session.get('analysis_raw_results')
    
    if not raw_results:
        return HttpResponse("No analysis results found in session.", status=404)
    
    # Return the raw API response exactly as received - no wrapping or modification
    response = HttpResponse(
        json.dumps(raw_results, indent=2, default=str),
        content_type='application/json'
    )
    
    # Set headers for file download
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'raw_api_response_{timestamp}.json'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response


def view_api_response_popup(request: HttpRequest) -> HttpResponse:
    """
    Display the API response in a popup-friendly template.
    """
    # Get results from session
    raw_results = request.session.get('analysis_raw_results')
    processed_results = request.session.get('analysis_results')
    
    if not raw_results:
        return HttpResponse("<h3>No analysis results found</h3><p>Please run an analysis first.</p>")
    
    context = {
        'raw_results': raw_results,
        'processed_results': processed_results,
        'raw_results_json': json.dumps(raw_results, indent=2, default=str),
        'symbols': processed_results.get('symbols', []) if processed_results else []
    }
    
    return render(request, 'timeseries/api_response_popup.html', context)
