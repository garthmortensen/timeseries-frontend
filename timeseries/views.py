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
    task_id = request.GET.get('task_id')
    return render(request, 'timeseries/results.html', {'task_id': task_id})


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
