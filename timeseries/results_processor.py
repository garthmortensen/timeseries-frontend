#!/usr/bin/env python3
# timeseries-frontend/timeseries/results_processor.py

"""
Results processor for time series analysis.
Processes raw API results into structured format for visualization and display.
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ResultsProcessor:
    """
    Processes raw time series analysis results from the API into structured format.
    Handles the complete API response structure according to your JSON paths.
    """
    
    def __init__(self, raw_results: Dict[str, Any]):
        """
        Initialize the processor with raw API results.
        
        Args:
            raw_results: Dictionary containing raw results from the API
        """
        self.raw_results = raw_results
        self.symbols = self._extract_symbols()
        
    def _extract_symbols(self) -> List[str]:
        """Extract symbol names from the analysis results."""
        # Try multiple sources to find symbols
        symbols = []
        
        # From returns_data
        if 'returns_data' in self.raw_results and self.raw_results['returns_data']:
            first_row = self.raw_results['returns_data'][0]
            symbols = [key for key in first_row.keys() if key != 'index']
        
        # From original_data
        elif 'original_data' in self.raw_results and self.raw_results['original_data']:
            first_row = self.raw_results['original_data'][0]
            symbols = [key for key in first_row.keys() if key != 'index']
            
        # From execution_configuration
        elif 'execution_configuration' in self.raw_results:
            config = self.raw_results['execution_configuration']
            if 'symbols' in config:
                symbols = config['symbols']
                
        return symbols
    
    def process_execution_configuration(self) -> Dict[str, Any]:
        """Process execution configuration data."""
        logger.info(f"DEBUG: Raw results top-level keys: {list(self.raw_results.keys())}")
        
        if 'execution_configuration' not in self.raw_results:
            logger.info("DEBUG: execution_configuration key not found in raw_results")
            return {}
            
        config = self.raw_results['execution_configuration']
        logger.info(f"DEBUG: execution_configuration found with keys: {list(config.keys()) if config else 'None'}")
        
        return {
            'data_source': config.get('data_source', {}),
            'data_processing': config.get('data_processing', {}),
            'model_configurations': config.get('model_configurations', {}),
            'spillover_configuration': config.get('spillover_configuration', {}),
            'execution_metadata': config.get('execution_metadata', {})
        }
    
    def process_data_arrays(self) -> Dict[str, Any]:
        """Process all data arrays (original_data, returns_data, etc.)"""
        data_arrays = {}
        
        # Process each data array type
        for data_type in ['original_data', 'returns_data', 'scaled_data', 'pre_garch_data', 'post_garch_data']:
            if data_type in self.raw_results and self.raw_results[data_type]:
                data_arrays[data_type] = self._process_data_array(self.raw_results[data_type])
                
        return data_arrays
    
    def _process_data_array(self, data_array: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process a single data array into structured format."""
        if not data_array:
            return {}
            
        # Extract timestamps and symbol data
        timestamps = [row.get('index') for row in data_array if 'index' in row]
        symbol_data = {}
        
        for symbol in self.symbols:
            symbol_data[symbol] = [row.get(symbol) for row in data_array if symbol in row]
            
        return {
            'timestamps': timestamps,
            'symbol_data': symbol_data,
            'count': len(timestamps)
        }
    
    def process_stationarity_results(self) -> Dict[str, Any]:
        """Process stationarity test results."""
        if 'stationarity_results' not in self.raw_results:
            return {}
        
        stationarity = self.raw_results['stationarity_results']
        processed = {
            'all_symbols_stationarity': {},
            'series_stats': {}
        }
        
        # Process stationarity tests
        if 'all_symbols_stationarity' in stationarity:
            tests = stationarity['all_symbols_stationarity']
            if 'all_symbols_stationarity' in tests:  # Handle double nesting
                tests = tests['all_symbols_stationarity']
                
            for symbol, test_result in tests.items():
                processed['all_symbols_stationarity'][symbol] = test_result
        
        # Process series statistics
        if 'series_stats' in stationarity:
            for symbol, stats in stationarity['series_stats'].items():
                processed['series_stats'][symbol] = stats
                
        return processed
    
    def process_arima_results(self) -> Dict[str, Any]:
        """Process ARIMA model results."""
        if 'arima_results' not in self.raw_results:
            return {}
        
        arima = self.raw_results['arima_results']
        processed = {}
        
        # Handle nested structure
        if 'all_symbols_arima' in arima:
            arima_data = arima['all_symbols_arima']
            for symbol, result in arima_data.items():
                processed[symbol] = {
                    'summary': result.get('summary', {}),
                    'forecast': result.get('forecast', {}),
                    'interpretation': result.get('interpretation', {})
                }
                
        return processed
    
    def process_garch_results(self) -> Dict[str, Any]:
        """Process GARCH model results."""
        if 'garch_results' not in self.raw_results:
            return {}
        
        garch = self.raw_results['garch_results']
        processed = {}
        
        if 'all_symbols_garch' in garch:
            for symbol, result in garch['all_symbols_garch'].items():
                processed[symbol] = {
                    'summary': result.get('summary', {}),
                    'forecast': result.get('forecast', []),
                    'interpretation': result.get('interpretation', {})
                }
                
        return processed
    
    def process_var_results(self) -> Dict[str, Any]:
        """Process VAR model results."""
        if 'var_results' not in self.raw_results:
            return {}
        
        var = self.raw_results['var_results']
        
        return {
            'fitted_model': var.get('fitted_model'),
            'selected_lag': var.get('selected_lag'),
            'ic_used': var.get('ic_used'),
            'coefficients': var.get('coefficients', {}),
            'granger_causality': var.get('granger_causality', {}),
            'fevd_matrix': var.get('fevd_matrix', []),
            'fevd_interpretation': var.get('fevd_interpretation', {}),
            'interpretation': var.get('interpretation', '')
        }
    
    def process_spillover_results(self) -> Dict[str, Any]:
        """Process spillover analysis results."""
        if 'spillover_results' not in self.raw_results:
            return {}
        
        spillover = self.raw_results['spillover_results']
        
        # Process spillover data into template-friendly format
        processed_spillover = {
            'total_spillover_index': spillover.get('total_spillover_index'),
            'directional_spillover': spillover.get('directional_spillover', {}),
            'net_spillover': spillover.get('net_spillover', {}),
            'pairwise_spillover': spillover.get('pairwise_spillover', {}),
            'interpretation': spillover.get('interpretation', ''),
            'pairwise_spillover_table': spillover.get('pairwise_spillover_table', [])
        }
        
        # Create template-friendly spillover table data
        spillover_table_data = []
        directional = spillover.get('directional_spillover', {})
        net_spillover = spillover.get('net_spillover', {})
        
        for symbol in self.symbols:
            spillover_to = directional.get(symbol, {}).get('to', 0) if directional.get(symbol) else 0
            spillover_from = directional.get(symbol, {}).get('from', 0) if directional.get(symbol) else 0
            net_value = net_spillover.get(symbol, 0)
            
            spillover_table_data.append({
                'symbol': symbol,
                'spillover_to': spillover_to,
                'spillover_from': spillover_from,
                'net_spillover': net_value,
                'net_spillover_positive': net_value > 0
            })
        
        processed_spillover['spillover_table_data'] = spillover_table_data
        
        return processed_spillover
    
    def process_granger_causality_results(self) -> Dict[str, Any]:
        """Process Granger causality results."""
        if 'granger_causality_results' not in self.raw_results:
            return {}
        
        granger = self.raw_results['granger_causality_results']
        
        return {
            'causality_results': granger.get('causality_results', {}),
            'interpretations': granger.get('interpretations', {}),
            'metadata': granger.get('metadata', {})
        }
    
    def get_executive_summary(self) -> Dict[str, Any]:
        """Create an executive summary from all results."""
        summary = {
            'analysis_overview': {
                'symbols_analyzed': self.symbols,
                'total_symbols': len(self.symbols),
                'analysis_complete': True
            },
            'key_insights': [],
            'model_performance': {},
            'business_recommendations': []
        }
        
        # Extract key insights from ARIMA interpretations
        arima_results = self.process_arima_results()
        for symbol, result in arima_results.items():
            interpretation = result.get('interpretation', {})
            if 'executive_summary' in interpretation:
                exec_summary = interpretation['executive_summary']
                if 'bottom_line' in exec_summary:
                    summary['key_insights'].append(f"{symbol}: {exec_summary['bottom_line']}")
                if 'recommendation' in exec_summary:
                    summary['business_recommendations'].append(f"{symbol}: {exec_summary['recommendation']}")
        
        # Extract spillover insights
        spillover_results = self.process_spillover_results()
        if spillover_results.get('interpretation'):
            summary['key_insights'].append(f"Spillover Analysis: {spillover_results['interpretation']}")
        
        return summary
    
    def process_all(self) -> Dict[str, Any]:
        """Process all sections and return comprehensive results."""
        logger.info("Processing comprehensive analysis results")
        
        # DEBUG: Let's see the actual structure we're getting
        logger.info(f"DEBUG: Full raw_results keys: {list(self.raw_results.keys())}")
        
        # Let's check if any of these sections contain configuration info
        for key in ['stationarity_results', 'arima_results', 'garch_results', 'var_results']:
            if key in self.raw_results and self.raw_results[key]:
                section_keys = list(self.raw_results[key].keys()) if isinstance(self.raw_results[key], dict) else "Not a dict"
                logger.info(f"DEBUG: {key} structure: {section_keys}")
        
        processed = {
            'execution_configuration': self.process_execution_configuration(),
            'data_arrays': self.process_data_arrays(),
            'stationarity_results': self.process_stationarity_results(),
            'arima_results': self.process_arima_results(),
            'garch_results': self.process_garch_results(),
            'var_results': self.process_var_results(),
            'spillover_results': self.process_spillover_results(),
            'granger_causality_results': self.process_granger_causality_results(),
            'executive_summary': self.get_executive_summary(),
            'symbols': self.symbols,
            'raw_results': self.raw_results  # Keep for debugging/raw data tab
        }
        
        logger.info(f"Processing complete for {len(self.symbols)} symbols")
        return processed