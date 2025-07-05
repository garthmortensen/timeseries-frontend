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
        """Extract symbol names from the raw results."""
        if 'data' in self.raw_results and isinstance(self.raw_results['data'], dict):
            return list(self.raw_results['data'].keys())
        return []
    
    def process_time_series_data(self) -> Dict[str, Any]:
        """
        Process raw time series data into standardized format.
        
        Returns:
            Dictionary with processed time series data
        """
        processed = {
            'symbols': self.symbols,
            'data': {},
            'summary': {
                'total_symbols': len(self.symbols),
                'date_range': None,
                'total_observations': 0
            }
        }
        
        if 'data' not in self.raw_results:
            return processed
        
        raw_data = self.raw_results['data']
        
        for symbol in self.symbols:
            if symbol not in raw_data:
                continue
                
            symbol_data = raw_data[symbol]
            
            if isinstance(symbol_data, dict):
                # Convert to standardized format
                dates = sorted(symbol_data.keys())
                prices = [symbol_data[date] for date in dates]
                
                # Calculate returns
                returns = [0.0]  # First return is 0
                for i in range(1, len(prices)):
                    ret = (prices[i] - prices[i-1]) / prices[i-1]
                    returns.append(ret)
                
                processed['data'][symbol] = {
                    'dates': dates,
                    'prices': prices,
                    'returns': returns,
                    'count': len(dates)
                }
                
                processed['summary']['total_observations'] += len(dates)
                
                # Update date range
                if processed['summary']['date_range'] is None:
                    processed['summary']['date_range'] = {
                        'start': dates[0],
                        'end': dates[-1]
                    }
                else:
                    if dates[0] < processed['summary']['date_range']['start']:
                        processed['summary']['date_range']['start'] = dates[0]
                    if dates[-1] > processed['summary']['date_range']['end']:
                        processed['summary']['date_range']['end'] = dates[-1]
        
        return processed
    
    def process_stationarity_results(self) -> Dict[str, Any]:
        """
        Process stationarity test results.
        
        Returns:
            Dictionary with processed stationarity results
        """
        if 'stationarity_results' not in self.raw_results:
            return {}
        
        raw_stationarity = self.raw_results['stationarity_results']
        processed = {
            'summary': {
                'total_tests': len(raw_stationarity),
                'stationary_count': 0,
                'non_stationary_count': 0
            },
            'results': {}
        }
        
        for symbol, result in raw_stationarity.items():
            is_stationary = result.get('is_stationary', False)
            
            processed['results'][symbol] = {
                'is_stationary': is_stationary,
                'adf_statistic': result.get('adf_statistic', 0),
                'p_value': result.get('p_value', 1),
                'critical_values': result.get('critical_values', {}),
                'interpretation': 'Stationary' if is_stationary else 'Non-stationary'
            }
            
            if is_stationary:
                processed['summary']['stationary_count'] += 1
            else:
                processed['summary']['non_stationary_count'] += 1
        
        return processed
    
    def process_arima_results(self) -> Dict[str, Any]:
        """
        Process ARIMA model results.
        
        Returns:
            Dictionary with processed ARIMA results
        """
        if 'arima_results' not in self.raw_results:
            return {}
        
        raw_arima = self.raw_results['arima_results']
        processed = {
            'summary': {
                'models_fitted': len(raw_arima),
                'best_model': None,
                'average_aic': 0
            },
            'results': {}
        }
        
        total_aic = 0
        best_aic = float('inf')
        
        for symbol, result in raw_arima.items():
            aic = result.get('aic', float('inf'))
            bic = result.get('bic', float('inf'))
            order = result.get('order', [0, 0, 0])
            
            processed['results'][symbol] = {
                'order': order,
                'aic': aic,
                'bic': bic,
                'forecast': result.get('forecast', []),
                'forecast_se': result.get('forecast_se', []),
                'model_summary': f"ARIMA({order[0]},{order[1]},{order[2]})"
            }
            
            total_aic += aic
            if aic < best_aic:
                best_aic = aic
                processed['summary']['best_model'] = symbol
        
        if len(raw_arima) > 0:
            processed['summary']['average_aic'] = total_aic / len(raw_arima)
        
        return processed
    
    def process_garch_results(self) -> Dict[str, Any]:
        """
        Process GARCH model results.
        
        Returns:
            Dictionary with processed GARCH results
        """
        if 'garch_results' not in self.raw_results:
            return {}
        
        raw_garch = self.raw_results['garch_results']
        processed = {
            'summary': {
                'models_fitted': len(raw_garch),
                'average_persistence': 0
            },
            'results': {}
        }
        
        total_persistence = 0
        
        for symbol, result in raw_garch.items():
            omega = result.get('omega', 0)
            alpha = result.get('alpha', 0)
            beta = result.get('beta', 0)
            persistence = alpha + beta
            
            processed['results'][symbol] = {
                'omega': omega,
                'alpha': alpha,
                'beta': beta,
                'persistence': persistence,
                'volatility_forecast': result.get('volatility_forecast', []),
                'model_summary': f"GARCH(1,1) - ω={omega:.6f}, α={alpha:.3f}, β={beta:.3f}"
            }
            
            total_persistence += persistence
        
        if len(raw_garch) > 0:
            processed['summary']['average_persistence'] = total_persistence / len(raw_garch)
        
        return processed
    
    def process_spillover_results(self) -> Dict[str, Any]:
        """
        Process spillover analysis results.
        
        Returns:
            Dictionary with processed spillover results
        """
        if 'spillover_results' not in self.raw_results:
            return {}
        
        raw_spillover = self.raw_results['spillover_results']
        processed = {
            'total_spillover': raw_spillover.get('total_spillover', 0),
            'spillover_matrix': raw_spillover.get('spillover_matrix', {}),
            'summary': {
                'highest_transmitter': None,
                'highest_receiver': None,
                'highest_spillover_pair': None
            }
        }
        
        spillover_matrix = processed['spillover_matrix']
        
        if spillover_matrix:
            # Find highest transmitter (highest row sum excluding diagonal)
            max_transmission = 0
            max_transmitter = None
            
            # Find highest receiver (highest column sum excluding diagonal)
            max_reception = 0
            max_receiver = None
            
            # Find highest spillover pair
            max_spillover = 0
            max_pair = None
            
            for from_symbol in spillover_matrix:
                transmission_sum = 0
                for to_symbol in spillover_matrix[from_symbol]:
                    spillover_value = spillover_matrix[from_symbol][to_symbol]
                    
                    if from_symbol != to_symbol:  # Exclude diagonal
                        transmission_sum += spillover_value
                        
                        if spillover_value > max_spillover:
                            max_spillover = spillover_value
                            max_pair = (from_symbol, to_symbol)
                
                if transmission_sum > max_transmission:
                    max_transmission = transmission_sum
                    max_transmitter = from_symbol
            
            # Calculate reception for each symbol
            for to_symbol in self.symbols:
                reception_sum = 0
                for from_symbol in spillover_matrix:
                    if to_symbol in spillover_matrix[from_symbol] and from_symbol != to_symbol:
                        reception_sum += spillover_matrix[from_symbol][to_symbol]
                
                if reception_sum > max_reception:
                    max_reception = reception_sum
                    max_receiver = to_symbol
            
            processed['summary']['highest_transmitter'] = max_transmitter
            processed['summary']['highest_receiver'] = max_receiver
            processed['summary']['highest_spillover_pair'] = max_pair
        
        return processed
    
    def create_data_lineage(self) -> Dict[str, Any]:
        """
        Create data lineage showing transformation pipeline.
        
        Returns:
            Dictionary with data lineage information
        """
        pipeline_stages = [
            {
                'name': 'Original Data',
                'description': 'Raw price data',
                'data_available': 'data' in self.raw_results,
                'record_count': len(self.symbols) if 'data' in self.raw_results else 0
            },
            {
                'name': 'Returns Data',
                'description': 'Calculated returns',
                'data_available': 'data' in self.raw_results,
                'record_count': len(self.symbols) if 'data' in self.raw_results else 0
            },
            {
                'name': 'Stationarity Tests',
                'description': 'ADF test results',
                'data_available': 'stationarity_results' in self.raw_results,
                'record_count': len(self.raw_results.get('stationarity_results', {}))
            },
            {
                'name': 'ARIMA Models',
                'description': 'Time series forecasting',
                'data_available': 'arima_results' in self.raw_results,
                'record_count': len(self.raw_results.get('arima_results', {}))
            },
            {
                'name': 'GARCH Models',
                'description': 'Volatility modeling',
                'data_available': 'garch_results' in self.raw_results,
                'record_count': len(self.raw_results.get('garch_results', {}))
            },
            {
                'name': 'Spillover Analysis',
                'description': 'Cross-asset spillovers',
                'data_available': 'spillover_results' in self.raw_results,
                'record_count': 1 if 'spillover_results' in self.raw_results else 0
            }
        ]
        
        return {
            'pipeline_stages': pipeline_stages,
            'total_stages': len(pipeline_stages),
            'completed_stages': len([s for s in pipeline_stages if s['data_available']])
        }
    
    def process_all_results(self) -> Dict[str, Any]:
        """
        Process all results and return comprehensive structured data.
        
        Returns:
            Dictionary with all processed results
        """
        logger.info("Processing all analysis results...")
        
        processed_results = {
            'metadata': {
                'processing_timestamp': datetime.now().isoformat(),
                'symbols_analyzed': self.symbols,
                'total_symbols': len(self.symbols)
            },
            'time_series_data': self.process_time_series_data(),
            'stationarity_results': self.process_stationarity_results(),
            'arima_results': self.process_arima_results(),
            'garch_results': self.process_garch_results(),
            'spillover_results': self.process_spillover_results(),
            'data_lineage': self.create_data_lineage()
        }
        
        logger.info("Results processing completed successfully")
        logger.info("Processed sections: %s", list(processed_results.keys()))
        
        return processed_results


def create_summary_statistics(processed_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create summary statistics from processed results.
    
    Args:
        processed_results: Dictionary with processed analysis results
        
    Returns:
        Dictionary with summary statistics
    """
    summary = {
        'analysis_overview': {
            'symbols_count': processed_results['metadata']['total_symbols'],
            'symbols_list': processed_results['metadata']['symbols_analyzed']
        },
        'data_quality': {
            'has_time_series': bool(processed_results['time_series_data']['data']),
            'has_stationarity_tests': bool(processed_results['stationarity_results']),
            'has_arima_models': bool(processed_results['arima_results']),
            'has_garch_models': bool(processed_results['garch_results']),
            'has_spillover_analysis': bool(processed_results['spillover_results'])
        }
    }
    
    # Add time series summary
    ts_data = processed_results['time_series_data']
    if ts_data['summary']['date_range']:
        summary['time_series_summary'] = {
            'date_range': ts_data['summary']['date_range'],
            'total_observations': ts_data['summary']['total_observations']
        }
    
    # Add stationarity summary
    stat_results = processed_results['stationarity_results']
    if stat_results:
        summary['stationarity_summary'] = stat_results['summary']
    
    # Add model summary
    arima_results = processed_results['arima_results']
    if arima_results:
        summary['arima_summary'] = arima_results['summary']
    
    garch_results = processed_results['garch_results']
    if garch_results:
        summary['garch_summary'] = garch_results['summary']
    
    # Add spillover summary
    spillover_results = processed_results['spillover_results']
    if spillover_results:
        summary['spillover_summary'] = {
            'total_spillover': spillover_results['total_spillover'],
            'key_findings': spillover_results['summary']
        }
    
    return summary