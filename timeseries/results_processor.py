#!/usr/bin/env python3
# timeseries/results_processor.py

"""
Server-side results processor for timeseries analysis.
Reduces JavaScript dependencies by processing all analysis results on the server.
"""
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

logger = logging.getLogger(__name__)

class ResultsProcessor:
    """
    Processes raw API response data into structured, presentation-ready format.
    Implements the pyramid principle: Executive Summary -> Key Findings -> Technical Details
    """
    
    def __init__(self, raw_results: Dict[str, Any]):
        self.raw_results = raw_results
        self.symbols = self._extract_symbols()
        
    def _extract_symbols(self) -> List[str]:
        """Extract symbol list from raw results."""
        if 'original_data' in self.raw_results and isinstance(self.raw_results['original_data'], list):
            if len(self.raw_results['original_data']) > 0:
                first_record = self.raw_results['original_data'][0]
                symbols = [key for key in first_record.keys() if key != 'index']
                return symbols
        
        # Fallback: try to extract from other data sources
        for data_key in ['returns_data', 'scaled_data', 'pre_garch_data', 'post_garch_data']:
            if data_key in self.raw_results and isinstance(self.raw_results[data_key], list):
                if len(self.raw_results[data_key]) > 0:
                    first_record = self.raw_results[data_key][0]
                    symbols = [key for key in first_record.keys() if key != 'index']
                    return symbols
        
        return []
    
    def process_all_results(self) -> Dict[str, Any]:
        """
        Process all analysis results into structured format.
        
        Returns:
            Dict containing all processed results ready for template rendering
        """
        try:
            processed = {
                'overview': self._process_overview(),
                'data_lineage': self._process_data_lineage(),
                'statistical_tests': self._process_statistical_tests(),
                'models': self._process_models(),
                'spillover_analysis': self._process_spillover_analysis(),
                'raw_data': self._process_raw_data(),
                'symbols': self.symbols,
                'has_data': len(self.symbols) > 0
            }
            
            logger.info("Results processing completed successfully")
            return processed
            
        except Exception as e:
            logger.error(f"Error processing results: {str(e)}")
            return {'error': f"Processing failed: {str(e)}"}
    
    def _process_overview(self) -> Dict[str, Any]:
        """Generate executive summary and key insights for overview tab."""
        overview = {
            'executive_summary': self._generate_executive_summary(),
            'key_insights': self._generate_key_insights(),
            'analysis_summary': self._generate_analysis_summary(),
            'data_quality': self._calculate_data_quality()
        }
        return overview
    
    def _generate_executive_summary(self) -> Dict[str, Any]:
        """Generate executive summary of all analysis results."""
        try:
            summary = {
                'symbols_analyzed': len(self.symbols),
                'symbols_list': ', '.join(self.symbols),
                'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'key_findings': []
            }
            
            # Extract key findings from stationarity
            if 'stationarity_results' in self.raw_results:
                stationarity_data = self.raw_results['stationarity_results']
                if 'all_symbols_stationarity' in stationarity_data:
                    stationary_symbols = []
                    for symbol in self.symbols:
                        symbol_path = stationarity_data.get('all_symbols_stationarity', {}).get('all_symbols_stationarity', {}).get(symbol, {})
                        if symbol_path.get('is_stationary', False):
                            stationary_symbols.append(symbol)
                    
                    if len(stationary_symbols) == len(self.symbols):
                        summary['key_findings'].append("✅ All series are stationary - ready for modeling")
                    elif len(stationary_symbols) > 0:
                        summary['key_findings'].append(f"⚠️ {len(stationary_symbols)}/{len(self.symbols)} series are stationary")
                    else:
                        summary['key_findings'].append("❌ No series are stationary - preprocessing required")
            
            # Extract spillover findings
            if 'spillover_results' in self.raw_results:
                spillover_data = self.raw_results['spillover_results']
                total_spillover = spillover_data.get('total_spillover_index', 0)
                
                if total_spillover > 0.7:
                    summary['key_findings'].append(f"🔗 High interconnectedness detected ({total_spillover:.1%})")
                elif total_spillover > 0.3:
                    summary['key_findings'].append(f"🔗 Moderate interconnectedness ({total_spillover:.1%})")
                else:
                    summary['key_findings'].append(f"🔗 Low interconnectedness ({total_spillover:.1%})")
            
            # Extract ARIMA findings
            if 'arima_results' in self.raw_results:
                arima_data = self.raw_results['arima_results'].get('all_symbols_arima', {})
                forecasts_available = len([s for s in self.symbols if s in arima_data and 'forecast' in arima_data[s]])
                if forecasts_available > 0:
                    summary['key_findings'].append(f"📈 ARIMA forecasts generated for {forecasts_available} symbols")
            
            # Extract GARCH findings  
            if 'garch_results' in self.raw_results:
                garch_data = self.raw_results['garch_results'].get('all_symbols_garch', {})
                volatility_forecasts = len([s for s in self.symbols if s in garch_data and 'forecast' in garch_data[s]])
                if volatility_forecasts > 0:
                    summary['key_findings'].append(f"⚡ GARCH volatility forecasts for {volatility_forecasts} symbols")
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating executive summary: {str(e)}")
            return {'error': str(e)}
    
    def _generate_key_insights(self) -> List[str]:
        """Generate key insights from analysis results."""
        insights = []
        
        try:
            # ARIMA insights
            if 'arima_results' in self.raw_results:
                arima_data = self.raw_results['arima_results'].get('all_symbols_arima', {})
                for symbol in self.symbols:
                    if symbol in arima_data and 'interpretation' in arima_data[symbol]:
                        interpretation = arima_data[symbol]['interpretation']
                        if 'executive_summary' in interpretation:
                            insights.append(f"ARIMA {symbol}: {interpretation['executive_summary'].get('bottom_line', 'N/A')}")
            
            # GARCH insights
            if 'garch_results' in self.raw_results:
                garch_data = self.raw_results['garch_results'].get('all_symbols_garch', {})
                for symbol in self.symbols:
                    if symbol in garch_data and 'interpretation' in garch_data[symbol]:
                        interpretation = garch_data[symbol]['interpretation']
                        if 'executive_summary' in interpretation:
                            insights.append(f"GARCH {symbol}: {interpretation['executive_summary'].get('bottom_line', 'N/A')}")
            
            # Granger causality insights
            if 'granger_causality_results' in self.raw_results:
                causality_data = self.raw_results['granger_causality_results']
                if 'causality_results' in causality_data:
                    significant_relationships = []
                    for relationship, result in causality_data['causality_results'].items():
                        if result.get('causality_5pct', False):
                            significant_relationships.append(relationship)
                    
                    if significant_relationships:
                        insights.append(f"Significant causal relationships: {', '.join(significant_relationships)}")
                    else:
                        insights.append("No significant Granger causality relationships detected")
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating key insights: {str(e)}")
            return [f"Error generating insights: {str(e)}"]
    
    def _generate_analysis_summary(self) -> Dict[str, Any]:
        """Generate analysis configuration summary."""
        summary = {
            'models_fitted': [],
            'tests_performed': [],
            'data_points': 0,
            'time_period': 'Unknown'
        }
        
        try:
            # Count data points
            if 'original_data' in self.raw_results and isinstance(self.raw_results['original_data'], list):
                summary['data_points'] = len(self.raw_results['original_data'])
                
                # Determine time period
                if len(self.raw_results['original_data']) > 0:
                    first_date = self.raw_results['original_data'][0].get('index', '')
                    last_date = self.raw_results['original_data'][-1].get('index', '')
                    if first_date and last_date:
                        summary['time_period'] = f"{first_date[:10]} to {last_date[:10]}"
            
            # Check which models were fitted
            if 'arima_results' in self.raw_results:
                summary['models_fitted'].append('ARIMA')
            if 'garch_results' in self.raw_results:
                summary['models_fitted'].append('GARCH')
            if 'var_results' in self.raw_results:
                summary['models_fitted'].append('VAR')
            
            # Check which tests were performed
            if 'stationarity_results' in self.raw_results:
                summary['tests_performed'].append('Stationarity (ADF)')
            if 'spillover_results' in self.raw_results:
                summary['tests_performed'].append('Spillover Analysis')
            if 'granger_causality_results' in self.raw_results:
                summary['tests_performed'].append('Granger Causality')
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating analysis summary: {str(e)}")
            return summary
    
    def _calculate_data_quality(self) -> Dict[str, Any]:
        """Calculate data quality metrics."""
        quality = {
            'completeness': 'Unknown',
            'consistency': 'Unknown',
            'missing_values': 0,
            'outliers_detected': 'Unknown'
        }
        
        try:
            # Check completeness
            if 'original_data' in self.raw_results and isinstance(self.raw_results['original_data'], list):
                total_expected = len(self.raw_results['original_data']) * len(self.symbols)
                missing_count = 0
                
                for record in self.raw_results['original_data']:
                    for symbol in self.symbols:
                        if symbol not in record or record[symbol] is None:
                            missing_count += 1
                
                quality['missing_values'] = missing_count
                completeness_pct = ((total_expected - missing_count) / total_expected) * 100 if total_expected > 0 else 0
                
                if completeness_pct >= 99:
                    quality['completeness'] = f"Excellent ({completeness_pct:.1f}%)"
                elif completeness_pct >= 95:
                    quality['completeness'] = f"Good ({completeness_pct:.1f}%)"
                elif completeness_pct >= 90:
                    quality['completeness'] = f"Fair ({completeness_pct:.1f}%)"
                else:
                    quality['completeness'] = f"Poor ({completeness_pct:.1f}%)"
            
            return quality
            
        except Exception as e:
            logger.error(f"Error calculating data quality: {str(e)}")
            return quality
    
    def _process_data_lineage(self) -> Dict[str, Any]:
        """Process data lineage information showing data transformation pipeline."""
        lineage = {
            'pipeline_stages': [],
            'data_sets': {}
        }
        
        try:
            # Define the data processing pipeline stages
            stages = [
                {'name': 'Original Data', 'key': 'original_data', 'description': 'Raw price data'},
                {'name': 'Returns Data', 'key': 'returns_data', 'description': 'Log returns calculated from prices'},
                {'name': 'Scaled Data', 'key': 'scaled_data', 'description': 'Standardized returns for GARCH modeling'},
                {'name': 'Pre-GARCH', 'key': 'pre_garch_data', 'description': 'ARIMA residuals before GARCH'},
                {'name': 'Post-GARCH', 'key': 'post_garch_data', 'description': 'GARCH standardized residuals'}
            ]
            
            for stage in stages:
                if stage['key'] in self.raw_results:
                    data = self.raw_results[stage['key']]
                    stage_info = {
                        'name': stage['name'],
                        'description': stage['description'],
                        'data_available': True,
                        'record_count': len(data) if isinstance(data, list) else 0,
                        'symbols': self.symbols
                    }
                    lineage['pipeline_stages'].append(stage_info)
                    lineage['data_sets'][stage['key']] = data
                else:
                    stage_info = {
                        'name': stage['name'],
                        'description': stage['description'],
                        'data_available': False,
                        'record_count': 0,
                        'symbols': []
                    }
                    lineage['pipeline_stages'].append(stage_info)
            
            return lineage
            
        except Exception as e:
            logger.error(f"Error processing data lineage: {str(e)}")
            return lineage
    
    def _process_statistical_tests(self) -> Dict[str, Any]:
        """Process stationarity tests and series statistics."""
        tests = {
            'stationarity': {},
            'series_statistics': {}
        }
        
        try:
            # Process stationarity results
            if 'stationarity_results' in self.raw_results:
                stationarity_data = self.raw_results['stationarity_results']
                
                # Extract stationarity test results
                if 'all_symbols_stationarity' in stationarity_data:
                    symbol_results = stationarity_data['all_symbols_stationarity'].get('all_symbols_stationarity', {})
                    for symbol in self.symbols:
                        if symbol in symbol_results:
                            tests['stationarity'][symbol] = symbol_results[symbol]
                
                # Extract series statistics
                if 'series_stats' in stationarity_data:
                    tests['series_statistics'] = stationarity_data['series_stats']
            
            return tests
            
        except Exception as e:
            logger.error(f"Error processing statistical tests: {str(e)}")
            return tests
    
    def _process_models(self) -> Dict[str, Any]:
        """Process ARIMA, GARCH, and VAR model results."""
        models = {
            'arima': {},
            'garch': {},
            'var': {}
        }
        
        try:
            # Process ARIMA results
            if 'arima_results' in self.raw_results:
                arima_data = self.raw_results['arima_results'].get('all_symbols_arima', {})
                for symbol in self.symbols:
                    if symbol in arima_data:
                        models['arima'][symbol] = arima_data[symbol]
            
            # Process GARCH results
            if 'garch_results' in self.raw_results:
                garch_data = self.raw_results['garch_results'].get('all_symbols_garch', {})
                for symbol in self.symbols:
                    if symbol in garch_data:
                        models['garch'][symbol] = garch_data[symbol]
            
            # Process VAR results
            if 'var_results' in self.raw_results:
                models['var'] = self.raw_results['var_results']
            
            return models
            
        except Exception as e:
            logger.error(f"Error processing models: {str(e)}")
            return models
    
    def _process_spillover_analysis(self) -> Dict[str, Any]:
        """Process spillover analysis and Granger causality results."""
        spillover = {
            'total_spillover': {},
            'directional_spillover': {},
            'net_spillover': {},
            'pairwise_spillover': {},
            'granger_causality': {}
        }
        
        try:
            # Process spillover results
            if 'spillover_results' in self.raw_results:
                spillover_data = self.raw_results['spillover_results']
                
                # Total spillover index
                spillover['total_spillover'] = {
                    'index': spillover_data.get('total_spillover_index', 0),
                    'interpretation': spillover_data.get('interpretation', '')
                }
                
                # Directional spillover
                if 'directional_spillover' in spillover_data:
                    spillover['directional_spillover'] = spillover_data['directional_spillover']
                
                # Net spillover
                if 'net_spillover' in spillover_data:
                    spillover['net_spillover'] = spillover_data['net_spillover']
                
                # Pairwise spillover
                if 'pairwise_spillover' in spillover_data:
                    spillover['pairwise_spillover'] = spillover_data['pairwise_spillover']
                
                # Pairwise spillover table
                if 'pairwise_spillover_table' in spillover_data:
                    spillover['pairwise_spillover_table'] = spillover_data['pairwise_spillover_table']
            
            # Process Granger causality results
            if 'granger_causality_results' in self.raw_results:
                causality_data = self.raw_results['granger_causality_results']
                spillover['granger_causality'] = {
                    'causality_results': causality_data.get('causality_results', {}),
                    'interpretations': causality_data.get('interpretations', {}),
                    'metadata': causality_data.get('metadata', {})
                }
            
            return spillover
            
        except Exception as e:
            logger.error(f"Error processing spillover analysis: {str(e)}")
            return spillover
    
    def _process_raw_data(self) -> Dict[str, Any]:
        """Process raw data for table display."""
        raw_data = {}
        
        try:
            # Process each data type
            data_types = ['original_data', 'returns_data', 'scaled_data', 'pre_garch_data', 'post_garch_data']
            
            for data_type in data_types:
                if data_type in self.raw_results:
                    data = self.raw_results[data_type]
                    if isinstance(data, list) and len(data) > 0:
                        # Convert to table format
                        table_data = {
                            'headers': ['Date'] + self.symbols,
                            'rows': []
                        }
                        
                        for record in data:
                            row = [record.get('index', '')]
                            for symbol in self.symbols:
                                value = record.get(symbol, '')
                                if isinstance(value, (int, float)):
                                    row.append(f"{value:.6f}")
                                else:
                                    row.append(str(value))
                            table_data['rows'].append(row)
                        
                        raw_data[data_type] = table_data
            
            return raw_data
            
        except Exception as e:
            logger.error(f"Error processing raw data: {str(e)}")
            return raw_data
    
    def _calculate_time_series_statistics(self, time_series: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate statistics for time series data."""
        statistics = {}
        
        try:
            for symbol, series in time_series.items():
                if 'values' in series:
                    values = series['values']
                    statistics[symbol] = {
                        'mean': sum(values) / len(values) if values else 0,
                        'std_dev': self._calculate_standard_deviation(values),
                        'variance': self._calculate_variance(values),
                        'min': min(values) if values else 0,
                        'max': max(values) if values else 0,
                        'range': (max(values) - min(values)) if values else 0
                    }
            
            return statistics
            
        except Exception as e:
            logger.error(f"Error calculating time series statistics: {str(e)}")
            return {'error': f"Failed to calculate statistics: {str(e)}"}
    
    def _calculate_standard_deviation(self, values: List[float]) -> float:
        """Calculate standard deviation."""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance ** 0.5
    
    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance."""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        return sum((x - mean) ** 2 for x in values) / (len(values) - 1)
    
    def _process_stationarity_results(self) -> Dict[str, Any]:
        """Process stationarity test results."""
        try:
            stationarity_data = self.raw_results.get('stationarity_results', {})
            
            if not stationarity_data:
                return {'error': 'No stationarity results found'}
            
            processed_results = {}
            
            for symbol, results in stationarity_data.items():
                processed_results[symbol] = {
                    'raw_results': results,
                    'is_stationary': results.get('is_stationary', False),
                    'p_value': results.get('p_value', 0.0),
                    'adf_statistic': results.get('adf_statistic', 0.0),
                    'critical_values': results.get('critical_values', {}),
                    'interpretation': self._create_stationarity_interpretation(results)
                }
            
            return {
                'results': processed_results,
                'overall_summary': self._create_stationarity_overall_summary(processed_results)
            }
            
        except Exception as e:
            logger.error(f"Error processing stationarity results: {str(e)}")
            return {'error': str(e)}
    
    def _create_stationarity_interpretation(self, results: Dict[str, Any]) -> str:
        """Create interpretation for stationarity results."""
        is_stationary = results.get('is_stationary', False)
        p_value = results.get('p_value', 0.0)
        
        if is_stationary:
            return f"Time series is stationary (p-value: {p_value:.4f}). No differencing required."
        else:
            return f"Time series is non-stationary (p-value: {p_value:.4f}). Differencing recommended."
    
    def _create_stationarity_overall_summary(self, processed_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create overall summary for stationarity results."""
        stationary_count = 0
        total_count = len(processed_results)
        
        for symbol, data in processed_results.items():
            if data.get('is_stationary', False):
                stationary_count += 1
        
        return {
            'total_symbols': total_count,
            'stationary_count': stationary_count,
            'non_stationary_count': total_count - stationary_count,
            'stationary_percentage': (stationary_count / total_count * 100) if total_count > 0 else 0,
            'overall_assessment': 'Good' if stationary_count / total_count > 0.7 else 'Mixed' if stationary_count > 0 else 'Poor'
        }
    
    def _process_arima_results(self) -> Dict[str, Any]:
        """Process ARIMA results with interpretations."""
        try:
            arima_data = self.raw_results.get('arima_results', {})
            
            if not arima_data:
                return {'error': 'No ARIMA results found'}
            
            processed_results = {}
            
            for symbol, results in arima_data.items():
                processed_results[symbol] = {
                    'raw_results': results,
                    'order': results.get('order', [0, 0, 0]),
                    'aic': results.get('aic', 0.0),
                    'bic': results.get('bic', 0.0),
                    'forecast': results.get('forecast', []),
                    'forecast_se': results.get('forecast_se', [])
                }
            
            return {
                'results': processed_results,
                'overall_forecast': self._create_arima_overall_forecast(processed_results)
            }
            
        except Exception as e:
            logger.error(f"Error processing ARIMA results: {str(e)}")
            return {'error': str(e)}
    
    def _create_arima_overall_forecast(self, processed_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create overall forecast summary."""
        return {
            'symbols_forecasted': len(processed_results),
            'summary': f"ARIMA forecasts generated for {len(processed_results)} symbols"
        }
    
    def _process_garch_results(self) -> Dict[str, Any]:
        """Process GARCH results with interpretations."""
        try:
            garch_data = self.raw_results.get('garch_results', {})
            
            if not garch_data:
                return {'error': 'No GARCH results found'}
            
            processed_results = {}
            
            for symbol, results in garch_data.items():
                processed_results[symbol] = {
                    'raw_results': results,
                    'omega': results.get('omega', 0.0),
                    'alpha': results.get('alpha', 0.0),
                    'beta': results.get('beta', 0.0),
                    'volatility_forecast': results.get('volatility_forecast', [])
                }
            
            return {
                'results': processed_results,
                'overall_volatility': self._create_garch_overall_volatility(processed_results)
            }
            
        except Exception as e:
            logger.error(f"Error processing GARCH results: {str(e)}")
            return {'error': str(e)}
    
    def _create_garch_overall_volatility(self, processed_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create overall volatility summary."""
        return {
            'symbols_analyzed': len(processed_results),
            'summary': f"GARCH volatility analysis for {len(processed_results)} symbols"
        }
    
    def _process_spillover_results(self) -> Dict[str, Any]:
        """Process spillover analysis results."""
        try:
            spillover_data = self.raw_results.get('spillover_results', {})
            
            if not spillover_data:
                return {'error': 'No spillover results found'}
            
            # Fix: Use correct JSON paths from API response
            # The API returns 'total_spillover_index' not 'total_spillover'
            total_spillover = spillover_data.get('total_spillover_index', 0)
            
            # Fix: Use 'directional_spillover' (singular) from API response
            directional_spillover_raw = spillover_data.get('directional_spillover', {})
            net_spillover_raw = spillover_data.get('net_spillover', {})
            pairwise_spillover_raw = spillover_data.get('pairwise_spillover', {})
            
            # Process directional spillovers into expected format
            directional_spillovers = {}
            spillover_matrix = {}
            
            # Convert directional spillover data
            for symbol, spillover_data_inner in directional_spillover_raw.items():
                if isinstance(spillover_data_inner, dict):
                    to_others = spillover_data_inner.get('to', 0)
                    from_others = spillover_data_inner.get('from', 0)
                    net_spillover = net_spillover_raw.get(symbol, to_others - from_others)
                    
                    directional_spillovers[symbol] = {
                        'to_others': to_others,
                        'from_others': from_others,
                        'net_spillover': net_spillover
                    }
            
            # Convert pairwise spillover to matrix format if it's not already
            if pairwise_spillover_raw:
                if isinstance(pairwise_spillover_raw, dict):
                    # Check if it's already in matrix format (symbol -> {symbol: value})
                    for from_symbol, row_data in pairwise_spillover_raw.items():
                        if isinstance(row_data, dict):
                            spillover_matrix[from_symbol] = row_data
                        else:
                            # Handle flat format if needed
                            spillover_matrix = pairwise_spillover_raw
                            break
            
            # If we still don't have a spillover matrix, create one from directional data
            if not spillover_matrix and directional_spillovers:
                symbols = list(directional_spillovers.keys())
                spillover_matrix = {}
                for from_symbol in symbols:
                    spillover_matrix[from_symbol] = {}
                    for to_symbol in symbols:
                        if from_symbol == to_symbol:
                            # Diagonal elements (own variance)
                            spillover_matrix[from_symbol][to_symbol] = 100 - directional_spillovers[from_symbol]['from_others']
                        else:
                            # Off-diagonal elements (estimate from directional data)
                            spillover_matrix[from_symbol][to_symbol] = directional_spillovers[from_symbol]['from_others'] / (len(symbols) - 1)
            
            return {
                'spillover_matrix': spillover_matrix,
                'total_spillover': total_spillover,  # Fixed: now using total_spillover_index
                'directional_spillovers': directional_spillovers,
                'net_spillovers': net_spillover_raw,  # Add net spillovers separately
                'pairwise_spillovers': pairwise_spillover_raw,  # Add raw pairwise data
                'network_data': {'summary': 'Network data prepared for visualization'}
            }
            
        except Exception as e:
            logger.error(f"Error processing spillover results: {str(e)}")
            return {'error': str(e)}
    
    def _process_data_lineage(self) -> Dict[str, Any]:
        """Process data lineage for tabular display."""
        try:
            data_tables = {}
            
            # Process different data types
            data_types = ['data', 'returns_data', 'garch_scaled_data', 'pre_garch_data', 'post_garch_data']
            
            for data_type in data_types:
                raw_data = self.raw_results.get(data_type, {})
                # Only process if raw_data is a dict
                if isinstance(raw_data, dict) and raw_data:
                    data_tables[data_type] = self._convert_to_table_format(raw_data)
                else:
                    logger.warning(f"Skipping data lineage for {data_type}: not a dict or empty (type={type(raw_data)})")
            
            return data_tables
            
        except Exception as e:
            logger.error(f"Error processing data lineage: {str(e)}")
            return {'error': str(e)}
    
    def _convert_to_table_format(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert raw data to HTML table format."""
        if not isinstance(raw_data, dict) or not raw_data:
            return {}
        
        # Get all dates and symbols
        symbols = list(raw_data.keys())
        all_dates = set()
        
        for symbol_data in raw_data.values():
            if isinstance(symbol_data, dict):
                all_dates.update(symbol_data.keys())
        
        sorted_dates = sorted(all_dates)
        
        # Create table data
        table_data = {
            'headers': ['Date'] + symbols,
            'rows': []
        };
        
        for date in sorted_dates:
            row = [date]
            for symbol in symbols:
                value = raw_data.get(symbol, {}).get(date, 'N/A')
                if isinstance(value, (int, float)):
                    value = f"{value:.4f}"
                row.append(value)
            table_data['rows'].append(row)
        
        return table_data