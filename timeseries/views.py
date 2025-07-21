from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import json
import requests
import logging

logger = logging.getLogger(__name__)

def index(request):
    """
    Home page.
    """
    return render(request, 'timeseries/index.html')

def analysis(request):
    """
    Analysis page with comprehensive configuration options.
    """
    return render(request, 'timeseries/analysis_full.html')

def results(request):
    """
    Results page.
    """
    # Retrieve processed results from session if available
    processed_results = request.session.get('analysis_results', {})
    param_list = ['ar.L1', 'ar.L2', 'ma.L1', 'ma.L2', 'sigma2']
    # Always set active_tab to 'overview' for best practice
    context = {
        'active_tab': 'overview',
        'param_list': param_list,
        **processed_results
    }
    return render(request, 'timeseries/results.html', context)

def results_test(request):
    """
    Results test page.
    """
    return render(request, 'timeseries/results.html')

def about(request):
    """
    About page.
    """
    return render(request, 'timeseries/about.html')

def iterate(request):
    """
    Iterate page.
    """
    return redirect(reverse('timeseries:analysis'))

def download_api_response(request):
    """
    Download API response as JSON file.
    """
    raw_results = request.session.get('analysis_raw_results', None)
    if raw_results is not None:
        import json
        response = HttpResponse(json.dumps(raw_results, indent=2), content_type='application/json')
        response['Content-Disposition'] = 'attachment; filename="api_response.json"'
        return response
    else:
        return HttpResponse("No API response available to download.", content_type="text/plain")

def view_api_response_popup(request):
    """
    View API response in popup.
    """
    raw_results = request.session.get('analysis_raw_results', None)
    if raw_results is not None:
        import json
        raw_results_json = json.dumps(raw_results, indent=2)
    else:
        raw_results_json = 'No API response available.'
    return render(request, 'timeseries/api_response_popup.html', {'raw_results_json': raw_results_json})

def export_csv(request, data_type):
    """
    Export CSV data.
    """
    return HttpResponse(f"CSV export for {data_type} not implemented", content_type="text/plain")

def api_proxy(request, api_path):
    """
    Generic API proxy.
    """
    return JsonResponse({"error": "API proxy not implemented"})

def debug_data(request):
    """
    Debug data view.
    """
    return JsonResponse({"debug": "Debug data not implemented"})

@csrf_exempt
def run_pipeline_htmx(request):
    """
    HTMX-compatible view for running analysis with simple redirect response.
    """
    if request.method == "POST":
        # Support both JSON and form POSTs
        if request.content_type and "application/json" in request.content_type:
            try:
                data = json.loads(request.body)
            except Exception:
                data = {}
        else:
            data = request.POST
        
        logger.info("[HTMX] Starting analysis")
        
        # Process form data into API payload (simplified version)
        symbols = data.get("symbols", "MSFT,AAPL,GOOGL")
        if isinstance(symbols, str):
            symbols = [s.strip() for s in symbols.split(",") if s.strip()]
            
        payload = {
            "source_actual_or_synthetic_data": data.get("source_actual_or_synthetic_data", "synthetic"),
            "symbols": symbols,
            "synthetic_anchor_prices": [100.0, 200.0, 300.0][:len(symbols)],  # Default prices
            "data_start_date": "2023-01-01",
            "data_end_date": "2023-06-01",
            "scaling_method": "standardize",
            "arima_params": {
                "p": int(data.get("arima_p", 2)),
                "d": int(data.get("arima_d", 1)),
                "q": int(data.get("arima_q", 2)),
                "forecast_steps": 10,
            },
            "garch_params": {
                "p": int(data.get("garch_p", 1)),
                "q": int(data.get("garch_q", 1)),
                "dist": "t",
                "forecast_steps": 3,
            },
            "spillover_enabled": data.get("enable_spillover") == "on",
            "spillover_params": {
                "method": "diebold_yilmaz",
                "forecast_horizon": 5,
                "var_lag_selection_method": "aic",
                "max_lags": 10,
                "granger_significance_level": 0.05,
                "include_granger": True,
                "include_fevd_details": True,
            }
        }
        
        try:
            # Call the API
            response = requests.post("http://localhost:8001/api/v1/run_pipeline", json=payload, timeout=120)
            
            if response.status_code == 200:
                # Parse and process the API response
                api_results = response.json()
                logger.info("[HTMX] API call successful, processing results")
                
                # Import and use the ResultsProcessor
                from .results_processor import ResultsProcessor
                processor = ResultsProcessor(api_results)
                processed_results = processor.process_all()
                
                # Store processed results in session for the results page
                request.session['analysis_results'] = processed_results
                request.session['analysis_raw_results'] = api_results
                
                # Return simple redirect instruction for HTMX
                return HttpResponse(f"redirect:{reverse('timeseries:results')}")
            else:
                logger.error(f"[HTMX] API call failed with status {response.status_code}")
                return HttpResponse(f"Error: API call failed - {response.text}", status=500)
                
        except requests.exceptions.Timeout:
            logger.error("[HTMX] API request timed out")
            return HttpResponse("Error: Analysis timed out", status=504)
        except requests.exceptions.ConnectionError:
            logger.error("[HTMX] Failed to connect to API")
            return HttpResponse("Error: Could not connect to analysis API", status=503)
        except Exception as e:
            logger.exception("[HTMX] Unexpected error during API call")
            return HttpResponse(f"Error: {str(e)}", status=500)
    else:
        return redirect(reverse("timeseries:analysis"))