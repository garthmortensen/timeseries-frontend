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
        Process ARIMA model results including interpretations.
        
        Returns:
            Dictionary with processed ARIMA results
        """
        if 'arima_results' not in self.raw_results:
            return {}
        
        raw_arima = self.raw_results['arima_results']
        
        # Handle deeply nested structure - check for all_symbols_arima
        arima_data = raw_arima
        if 'all_symbols_arima' in raw_arima:
            arima_data = raw_arima['all_symbols_arima']
            # Check for double nesting (all_symbols_arima.all_symbols_arima)
            if 'all_symbols_arima' in arima_data:
                arima_data = arima_data['all_symbols_arima']
        elif 'results' in raw_arima and 'all_symbols_arima' in raw_arima['results']:
            arima_data = raw_arima['results']['all_symbols_arima']
        
        logger.info(f"ARIMA data extraction: found {len(arima_data)} symbols")
        logger.info(f"ARIMA data symbols: {list(arima_data.keys())}")
        
        processed = {
            'summary': {
                'models_fitted': len(arima_data),
                'best_model': None,
                'average_aic': 0
            },
            'results': {}
        }
        
        total_aic = 0
        best_aic = float('inf')
        
        for symbol, result in arima_data.items():
            logger.info(f"Processing ARIMA result for {symbol}")
            logger.info(f"Result structure keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            
            # Extract summary information
            summary = result.get('summary', {})
            forecast = result.get('forecast', {})
            interpretation = result.get('interpretation', {})
            
            logger.info(f"Found interpretation for {symbol}: {bool(interpretation)}")
            if interpretation:
                logger.info(f"Interpretation keys: {list(interpretation.keys())}")
            
            aic = summary.get('aic', float('inf'))
            bic = summary.get('bic', float('inf'))
            model_spec = summary.get('model_specification', 'Unknown')
            
            # Parse model order from specification (e.g., "ARIMA(1,1,1)")
            order = [0, 0, 0]
            if model_spec and 'ARIMA' in model_spec:
                try:
                    # Extract numbers from ARIMA(p,d,q) format
                    import re
                    match = re.search(r'ARIMA\\((\\d+),(\\d+),(\\d+)\\)', model_spec)
                    if match:
                        order = [int(match.group(1)), int(match.group(2)), int(match.group(3))]
                except:
                    pass
            
            # Process interpretation sections
            processed_interpretation = self._process_arima_interpretation(interpretation)
            
            processed['results'][symbol] = {
                'order': order,
                'model_specification': model_spec,
                'aic': aic,
                'bic': bic,
                'log_likelihood': summary.get('log_likelihood'),
                'hqic': summary.get('hqic'),
                'sample_size': summary.get('sample_size'),
                'parameters': summary.get('parameters', {}),
                'parameter_pvalues': summary.get('parameter_pvalues', {}),
                'parameter_significance': summary.get('parameter_significance', {}),
                'residual_statistics': summary.get('residual_statistics', {}),
                'forecast': {
                    'point_forecasts': forecast.get('point_forecasts', []),
                    'forecast_steps': forecast.get('forecast_steps', 0),
                    'forecast_method': forecast.get('forecast_method', 'Unknown'),
                    'confidence_intervals': forecast.get('confidence_intervals', {})
                },
                'interpretation': processed_interpretation,
                'model_summary': f"ARIMA({order[0]},{order[1]},{order[2]})"
            }
            
            total_aic += aic if aic != float('inf') else 0
            if aic < best_aic:
                best_aic = aic
                processed['summary']['best_model'] = symbol
        
        if len(arima_data) > 0:
            valid_aics = [aic for aic in [processed['results'][s]['aic'] for s in processed['results']] if aic != float('inf')]
            if valid_aics:
                processed['summary']['average_aic'] = sum(valid_aics) / len(valid_aics)
        
        logger.info(f"ARIMA processing complete: {len(processed['results'])} models processed")
        return processed
    
    def _process_arima_interpretation(self, interpretation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process ARIMA interpretation section into structured format.
        
        Args:
            interpretation: Raw interpretation dictionary from API
            
        Returns:
            Structured interpretation data
        """
        if not interpretation:
            return {}
        
        processed = {
            'executive_summary': {},
            'key_findings': {},
            'technical_details': {},
            'business_context': {}
        }
        
        # Process executive summary
        exec_summary = interpretation.get('executive_summary', {})
        if exec_summary:
            processed['executive_summary'] = {
                'bottom_line': exec_summary.get('bottom_line', ''),
                'business_impact': exec_summary.get('business_impact', ''),
                'recommendation': exec_summary.get('recommendation', ''),
                'justification': exec_summary.get('justification', ''),
                'confidence': exec_summary.get('confidence', 'Unknown')
            }
        
        # Process key findings
        key_findings = interpretation.get('key_findings', {})
        if key_findings:
            processed['key_findings'] = {
                'forecast_trend': self._extract_finding_text(key_findings.get('forecast_trend', {})),
                'model_performance': self._extract_finding_text(key_findings.get('model_performance', {})),
                'forecast_statistics': self._extract_finding_text(key_findings.get('forecast_statistics', {})),
                'business_impact': self._extract_finding_text(key_findings.get('business_impact', {}))
            }
        
        # Process technical details
        tech_details = interpretation.get('technical_details', {})
        if tech_details:
            processed['technical_details'] = {
                'model_specification': self._extract_finding_text(tech_details.get('model_specification', {})),
                'forecast_mechanics': tech_details.get('forecast_mechanics', {}),
                'accuracy_metrics': tech_details.get('accuracy_metrics', {}),
                'stationarity': tech_details.get('forecast_mechanics', {}).get('stationarity', 'Unknown')
            }
        
        # Process background context
        background = interpretation.get('background_context', {})
        if background:
            processed['business_context'] = {
                'what_is_arima': background.get('what_is_arima', ''),
                'why_it_matters': background.get('why_it_matters', ''),
                'model_assumptions': background.get('model_assumptions', ''),
                'limitations': background.get('limitations', ''),
                'interpretation_guide': background.get('interpretation_guide', '')
            }
        
        return processed
    
    def _extract_finding_text(self, finding_dict: Dict[str, Any]) -> str:
        """
        Extract justification text from finding dictionary.
        
        Args:
            finding_dict: Dictionary containing finding information
            
        Returns:
            Justification text or empty string
        """
        if isinstance(finding_dict, dict):
            return finding_dict.get('justification', '')
        elif isinstance(finding_dict, str):
            return finding_dict
        return ''

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
                'summary_text': result.get('summary', ''),
                'interpretation': self._process_garch_interpretation(result.get('interpretation', {}))
            }
            
            total_persistence += persistence
        
        if len(raw_garch) > 0:
            processed['summary']['average_persistence'] = total_persistence / len(raw_garch)
            
        return processed

    def _process_garch_interpretation(self, interpretation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process GARCH interpretation section into structured format.
        """
        if not interpretation:
            return {}
        
        # Simplified processing for now, can be expanded
        return {
            'executive_summary': interpretation.get('executive_summary', {}).get('justification', ''),
            'key_findings': interpretation.get('key_findings', {})
        }

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
            'total_spillover_index': raw_spillover.get('total_spillover_index'),
            'directional_spillover': raw_spillover.get('directional_spillover'),
            'net_spillover': raw_spillover.get('net_spillover'),
            'pairwise_spillover': raw_spillover.get('pairwise_spillover'),
            'interpretation': raw_spillover.get('interpretation'),
            'pairwise_spillover_table': raw_spillover.get('pairwise_spillover_table')
        }
        
        return processed

    def process_all(self) -> Dict[str, Any]:
        """
        Process all sections of the time series analysis results and return comprehensive structured data.
        
        Returns:
            Dictionary with all processed results
        """
        logger.info("Starting to process all results")
        
        processed_data = {
            'time_series': self.process_time_series_data(),
            'stationarity': self.process_stationarity_results(),
            'arima': self.process_arima_results(),
            'garch': self.process_garch_results(),
            'spillover': self.process_spillover_results(),
            'metadata': self.raw_results.get('execution_metadata', {})
        }
        
        logger.info("Finished processing all results")
        return processed_data


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