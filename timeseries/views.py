from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils.dateparse import parse_date
from django.views.decorators.http import require_POST
from django.core.cache import cache
from datetime import timedelta
import json
import requests
import logging
import hashlib

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
    # Debug: Check what's in the session
    print("DEBUG: Session keys:", list(request.session.keys()))
    print("DEBUG: Session analysis_results exists:", 'analysis_results' in request.session)
    print("DEBUG: Session raw results exist:", 'analysis_raw_results' in request.session)
    
    # Retrieve processed results from session if available
    processed_results = request.session.get('analysis_results', {})
    print("DEBUG: Processed results keys:", list(processed_results.keys()) if processed_results else "None")
    
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

def view_api_response_popup(request):
    """
    View API response in popup - FIXED to not delete session data.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Session keys available: {list(request.session.keys())}")
    logger.info(f"Session has raw results: {'analysis_raw_results' in request.session}")
    
    # Use .get() to read without deleting session data
    raw_results = request.session.get('analysis_raw_results', None)
        
    if raw_results is not None:
        logger.info(f"Raw results found, size: {len(str(raw_results))}")
        raw_results_json = json.dumps(raw_results, indent=2)
    else:
        logger.warning("No raw results found in session")
        raw_results_json = 'No API response available.'
    
    # Don't modify session - just read and return
    return render(request, 'timeseries/api_response_popup.html', {'raw_results_json': raw_results_json})

def download_api_response(request):
    """
    Download API response as JSON file - FIXED to not delete session data.
    """
    # Use .get() to read without deleting session data
    raw_results = request.session.get('analysis_raw_results', None)
    if raw_results is not None:
        import json
        from django.utils import timezone
        
        # Generate filename with timestamp (same format as CSV exports)
        current_time = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"api_response_{current_time}.json"
        
        response = HttpResponse(json.dumps(raw_results, indent=2), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    else:
        return HttpResponse("No API response available to download.", content_type="text/plain")

def export_csv(request, data_type):
    """
    Export CSV data using HTMX for better UX - FIXED to not delete session data.
    """
    import csv
    import io
    from django.utils import timezone
    
    # Debug session state
    print(f"DEBUG: export_csv called for {data_type}")
    print(f"DEBUG: Session keys: {list(request.session.keys())}")
    print(f"DEBUG: Has analysis_results: {'analysis_results' in request.session}")
    
    # Use .get() to read without deleting session data
    processed_results = request.session.get('analysis_results', {})
    
    if not processed_results:
        print("DEBUG: No processed results found in session")
        if request.headers.get('HX-Request'):
            return HttpResponse(
                '<div class="alert alert-danger">No analysis results found in session. Please run an analysis first.</div>',
                content_type='text/html'
            )
        else:
            return HttpResponse("No analysis results found in session. Please run an analysis first.", content_type="text/plain")
    
    data_arrays = processed_results.get('data_arrays', {})
    symbols = processed_results.get('symbols', [])
    
    print(f"DEBUG: Data arrays available: {list(data_arrays.keys())}")
    print(f"DEBUG: Symbols: {symbols}")
    
    # Check if the requested data type exists
    if data_type not in data_arrays:
        print(f"DEBUG: Requested data type '{data_type}' not found in data_arrays")
        if request.headers.get('HX-Request'):
            return HttpResponse(
                f'<div class="alert alert-danger">No {data_type.replace("_", " ")} data available for export.</div>',
                content_type='text/html'
            )
        else:
            return HttpResponse(f"No {data_type} data available for export.", content_type="text/plain")
    
    data_info = data_arrays[data_type]
    timestamps = data_info.get('timestamps', [])
    symbol_data = data_info.get('symbol_data', {})
    
    print(f"DEBUG: Timestamps count: {len(timestamps)}")
    print(f"DEBUG: Symbol data keys: {list(symbol_data.keys())}")
    
    if not timestamps or not symbol_data:
        print(f"DEBUG: Missing data - timestamps: {len(timestamps)}, symbol_data: {len(symbol_data)}")
        if request.headers.get('HX-Request'):
            return HttpResponse(
                f'<div class="alert alert-warning">No data rows available for {data_type.replace("_", " ")}.</div>',
                content_type='text/html'
            )
        else:
            return HttpResponse(f"No data rows available for {data_type}.", content_type="text/plain")
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    header = ['Date'] + symbols
    writer.writerow(header)
    
    # Write data rows
    for i, timestamp in enumerate(timestamps):
        row = [timestamp]
        for symbol in symbols:
            symbol_values = symbol_data.get(symbol, [])
            if i < len(symbol_values) and symbol_values[i] is not None:
                row.append(symbol_values[i])
            else:
                row.append('')  # Empty cell for missing data
        writer.writerow(row)
    
    # Get CSV content
    csv_content = output.getvalue()
    output.close()
    
    # Generate filename with timestamp
    current_time = timezone.now().strftime('%Y%m%d_%H%M%S')
    filename = f"timeseries_{data_type}_{current_time}.csv"
    
    print(f"DEBUG: Generated CSV with {len(csv_content)} characters")
    
    # Return CSV file
    response = HttpResponse(csv_content, content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

def api_proxy(request, api_path):
    """
    Generic API proxy.
    """
    print(f"DEBUG: api_proxy called with path: {api_path}")
    print(f"DEBUG: Request method: {request.method}")
    print(f"DEBUG: This is the WRONG view - should be run_pipeline_htmx")
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
    if request.method != "POST":
        return redirect(reverse("timeseries:analysis"))

    try:
        print("DEBUG: run_pipeline_htmx called!")
        
        # Support both JSON and form POSTs
        if request.content_type and "application/json" in request.content_type:
            try:
                data = json.loads(request.body)
                print(f"DEBUG: Received JSON data with keys: {list(data.keys())}")
            except Exception as e:
                print(f"DEBUG: Error parsing JSON: {e}")
                data = {}
        else:
            data = request.POST
            print("DEBUG: Received form POST data")
        
        logger.info("[HTMX] Starting analysis")
        
        # Process form data into API payload (simplified version)
        symbols = data.get("symbols", "MSFT,AAPL,GOOGL")
        if isinstance(symbols, str):
            symbols = [s.strip() for s in symbols.split(",") if s.strip()]
        elif isinstance(symbols, list):
            # symbols is already a list
            pass
        else:
            symbols = ["MSFT", "AAPL", "GOOGL"]  # fallback
            
        print(f"DEBUG: Processing symbols: {symbols}")
        
        payload = {
            "source_actual_or_synthetic_data": data.get("source_actual_or_synthetic_data", "synthetic"),
            "symbols": symbols,
            "synthetic_anchor_prices": data.get("synthetic_anchor_prices", [100.0, 200.0, 300.0][:len(symbols)]),
            "data_start_date": data.get("data_start_date", "2023-01-01"),
            "data_end_date": data.get("data_end_date", "2023-06-01"),
            "scaling_method": data.get("scaling_method", "standardize"),
            "arima_params": data.get("arima_params", {
                "p": 2,
                "d": 1,
                "q": 2,
                "forecast_steps": 10,
            }),
            "garch_params": data.get("garch_params", {
                "p": 1,
                "q": 1,
                "dist": "t",
                "forecast_steps": 3,
            }),
            "spillover_enabled": data.get("spillover_enabled", True),
            "spillover_params": data.get("spillover_params", {
                "method": "diebold_yilmaz",
                "forecast_horizon": 5,
                "var_lag_selection_method": "aic",
                "max_lags": 10,
                "granger_significance_level": 0.05,
                "include_granger": True,
                "include_fevd_details": True,
            })
        }
        
        print(f"DEBUG: API payload prepared with symbols: {payload['symbols']}")
        
        # Backend date range validation (security)
        from datetime import datetime
        start = data.get("data_start_date")
        end = data.get("data_end_date")
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d") if start else None
            end_date = datetime.strptime(end, "%Y-%m-%d") if end else None
        except Exception:
            start_date = end_date = None
        if not start_date or not end_date:
            return JsonResponse({"success": False, "error": "Invalid start or end date."}, status=400)
        if end_date < start_date:
            return JsonResponse({"success": False, "error": "End date must be after start date."}, status=400)
        if (end_date - start_date).days > 1826:
            return JsonResponse({"success": False, "error": "Date range cannot exceed 5 years."}, status=400)
        
        # Backend symbol count validation (security)
        if len(symbols) > 5:
            return JsonResponse({"success": False, "error": "You can select up to 5 symbols only."}, status=400)
        
        # Backend ARIMA parameter validation (security)
        arima_params = data.get("arima_params", {})
        arima_p = arima_params.get("p", 2)
        arima_d = arima_params.get("d", 1)
        arima_q = arima_params.get("q", 2)
        arima_forecast_steps = arima_params.get("forecast_steps", 10)
        
        if arima_p > 5:
            return JsonResponse({"success": False, "error": "ARIMA parameter p (Auto-Regressive Component) cannot exceed 5."}, status=400)
        if arima_d > 2:
            return JsonResponse({"success": False, "error": "ARIMA parameter d (Integration Component) cannot exceed 2."}, status=400)
        if arima_q > 5:
            return JsonResponse({"success": False, "error": "ARIMA parameter q (Moving Average Component) cannot exceed 5."}, status=400)
        if arima_forecast_steps > 20:
            return JsonResponse({"success": False, "error": "ARIMA forecast steps cannot exceed 20."}, status=400)
        
        # Backend GARCH parameter validation (security)
        garch_params = data.get("garch_params", {})
        garch_p = garch_params.get("p", 1)
        garch_q = garch_params.get("q", 1)
        
        if garch_p > 3:
            return JsonResponse({"success": False, "error": "GARCH parameter p (ARCH) cannot exceed 3."}, status=400)
        if garch_q > 3:
            return JsonResponse({"success": False, "error": "GARCH parameter q (Generalized ARCH) cannot exceed 3."}, status=400)
        
        # Backend spillover parameter validation (security)
        if data.get("spillover_enabled"):
            spillover_params = data.get("spillover_params", {})
            forecast_horizon = spillover_params.get("forecast_horizon", 5)
            max_lags = spillover_params.get("max_lags", 10)
            granger_significance_level = spillover_params.get("granger_significance_level", 0.05)
            rolling_window = spillover_params.get("rolling_window")
            
            if forecast_horizon > 10:
                return JsonResponse({"success": False, "error": "Spillover forecast horizon cannot exceed 10."}, status=400)
            if max_lags > 20:
                return JsonResponse({"success": False, "error": "Maximum VAR lags cannot exceed 20."}, status=400)
            if granger_significance_level > 1:
                return JsonResponse({"success": False, "error": "Granger significance level cannot exceed 1."}, status=400)
            if rolling_window is not None and rolling_window > 365:
                return JsonResponse({"success": False, "error": "Rolling window cannot exceed 365 days."}, status=400)
        
        # Call the API using requests
        print("DEBUG: About to call API")
        response = requests.post(f"{settings.TIMESERIES_API_URL}/api/v1/run_pipeline", json=payload, timeout=120)
        
        if response.status_code == 200:
            # Parse and process the API response
            api_results = response.json()
            print(f"DEBUG: API call successful, got {len(api_results)} top-level keys", flush=True)
            print(f"DEBUG: API response keys: {list(api_results.keys())}", flush=True)
            
            # Write to debug file immediately
            try:
                with open('./logs/debug_view.log', 'a') as f:
                    f.write(f"DEBUG: API call successful, got {len(api_results)} top-level keys\n")
                    f.write(f"DEBUG: API response keys: {list(api_results.keys())}\n")
                    f.flush()
            except Exception as e:
                print(f"DEBUG: Could not write to debug file: {e}")
            
            logger.info("[HTMX] API call successful, processing results")
            
            # Import and use the ResultsProcessor
            from .results_processor import ResultsProcessor
            print("DEBUG: About to create ResultsProcessor", flush=True)
            
            try:
                with open('./logs/debug_view.log', 'a') as f:
                    f.write("DEBUG: About to create ResultsProcessor\n")
                    f.flush()
            except:
                pass
            
            processor = ResultsProcessor(api_results)
            print("DEBUG: About to call process_all()", flush=True)
            
            try:
                with open('./logs/debug_view.log', 'a') as f:
                    f.write("DEBUG: About to call process_all()\n")
                    f.flush()
            except:
                pass
                    
            processed_results = processor.process_all()
            print("DEBUG: process_all() completed successfully", flush=True)
            
            try:
                with open('./logs/debug_view.log', 'a') as f:
                    f.write("DEBUG: process_all() completed successfully\n")
                    f.flush()
            except:
                pass
            
            # Store both raw and processed results in session (database-backed)
            request.session['analysis_raw_results'] = api_results
            request.session['analysis_results'] = processed_results
            request.session['has_api_results'] = True  # Flag to check if results exist
            
            # Explicitly save the session to ensure it's persisted
            request.session.save()
            
            print(f"DEBUG: Session saved with keys: {list(request.session.keys())}")
            print(f"DEBUG: Session contains analysis_results: {'analysis_results' in request.session}")
            print(f"DEBUG: Session contains raw results: {'analysis_raw_results' in request.session}")
            
            # Return JSON response with redirect URL for JavaScript
            return JsonResponse({
                "success": True,
                "redirect_url": reverse('timeseries:results'),
                "message": "Analysis completed successfully"
            })
        else:
            print(f"DEBUG: API call failed with status {response.status_code}")
            print(f"DEBUG: API response text: {response.text}")
            logger.error(f"[HTMX] API call failed with status {response.status_code}")
            return JsonResponse({
                "success": False,
                "error": f"API call failed with status {response.status_code}: {response.text}"
            }, status=500)
            
    except requests.exceptions.Timeout:
        print("DEBUG: API request timed out")
        logger.error("[HTMX] API request timed out")
        return JsonResponse({
            "success": False,
            "error": "Analysis timed out"
        }, status=504)
    except requests.exceptions.ConnectionError:
        print("DEBUG: Failed to connect to API")
        logger.error("[HTMX] Failed to connect to API")
        return JsonResponse({
            "success": False,
            "error": "Could not connect to analysis API"
        }, status=503)
    except Exception as e:
        print(f"DEBUG: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        logger.exception("[HTMX] Unexpected error during API call")
        return JsonResponse({
            "success": False,
            "error": f"An unexpected server error occurred: {str(e)}"
        }, status=500)