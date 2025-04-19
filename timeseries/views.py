#!/usr/bin/env python3
# timeseries/views.py

"""
Views for the timeseries app.
"""

import json
import logging
import requests
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

from utilities.chronicler import init_chronicler
chronicler = init_chronicler()
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

def results(request):
    """
    Results page displaying analysis output and visualizations.
    """
    return render(request, 'timeseries/results.html')

@csrf_exempt
def run_pipeline(request):
    """
    Proxy API endpoint that forwards the pipeline execution request to the FastAPI backend.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        # Get the request payload
        payload = json.loads(request.body)
        
        # Log the request
        logger.info(f"Forwarding pipeline request to backend: {payload}")
        
        # Forward the request to the FastAPI backend
        api_url = f"{settings.TIMESERIES_API_URL}/api/v1/run_pipeline"
        response = requests.post(api_url, json=payload, timeout=30)
        
        # Check the response status code
        if response.status_code == 200:
            # Log success and return the response
            logger.info("Pipeline executed successfully")
            return JsonResponse(response.json())
        else:
            # Log error and return the error response
            logger.error(f"Pipeline execution failed: {response.status_code} - {response.text}")
            return JsonResponse({'error': response.text}, status=response.status_code)
    
    except Exception as e:
        # Log exception and return error response
        logger.exception(f"Error running pipeline: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
