#!/usr/bin/env python3
# timeseries/api_client.py

"""
API client module for interacting with the Timeseries Pipeline API.
"""
import json
import logging
import requests
from django.conf import settings

# Set up logger
logger = logging.getLogger(__name__)

class TimeseriesAPIClient:
    """
    Client for interacting with the Timeseries Pipeline API.
    """
    
    def __init__(self):
        """
        Initialize the client with the API base URL.
        """
        self.base_url = settings.TIMESERIES_API_URL
        self.timeout = 160  # Request timeout in seconds (increased for heavy pipeline operations)
    
    def _make_request(self, method, endpoint, data=None):
        """
        Make a request to the API.
        
        Args:
            method (str): HTTP method (GET, POST, etc.)
            endpoint (str): API endpoint path
            data (dict, optional): Request payload for POST/PUT requests
        
        Returns:
            dict: Response data
        
        Raises:
            Exception: If the request fails
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, timeout=self.timeout)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            # Check response status
            response.raise_for_status()
            
            # Return JSON response
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response content: {e.response.text}")
                
                # Try to parse error response
                try:
                    error_data = e.response.json()
                    logger.error(f"Error details: {error_data}")
                except json.JSONDecodeError:
                    pass
            
            raise Exception(f"API request failed: {str(e)}")
    
    def generate_data(self, params):
        """
        Generate synthetic time series data.
        
        Args:
            params (dict): Data generation parameters
        
        Returns:
            dict: Generated time series data
        """
        return self._make_request('POST', '/api/generate_data', params)
    
    def fetch_market_data(self, params):
        """
        Fetch real market data.
        
        Args:
            params (dict): Market data parameters
        
        Returns:
            dict: Fetched market data
        """
        return self._make_request('POST', '/api/fetch_market_data', params)
    
    def run_pipeline(self, params):
        """
        Run the complete analysis pipeline.
        
        Args:
            params (dict): Pipeline parameters
        
        Returns:
            dict: Pipeline results
        """
        return self._make_request('POST', '/api/v1/run_pipeline', params)
