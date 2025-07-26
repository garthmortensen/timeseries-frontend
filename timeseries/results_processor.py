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
            symbols = [key for key in first_row.keys() if key not in ['index', 'Date']]
        
        # From original_data
        elif 'original_data' in self.raw_results and self.raw_results['original_data']:
            first_row = self.raw_results['original_data'][0]
            symbols = [key for key in first_row.keys() if key not in ['index', 'Date']]
            
        # From execution_configuration
        elif 'execution_configuration' in self.raw_results:
            config = self.raw_results['execution_configuration']
            if 'symbols' in config:
                symbols = config['symbols']
                
        return symbols
    
    def _format_list_for_display(self, value):
        """Format a list, dict, or string for display as comma-separated values."""
        if isinstance(value, list):
            return ', '.join(str(v) for v in value)
        if isinstance(value, dict):
            # If dict, show values only, comma separated
            return ', '.join(str(v) for v in value.values())
        if isinstance(value, str):
            # Remove brackets and quotes if present
            return value.replace('[', '').replace(']', '').replace("'", '').replace('"', '').strip()
        return value

    def process_execution_configuration(self) -> Dict[str, Any]:
        """Process execution configuration data."""
        logger.info(f"DEBUG: Raw results top-level keys: {list(self.raw_results.keys())}")
        
        if 'execution_configuration' not in self.raw_results:
            logger.info("DEBUG: execution_configuration key not found in raw_results")
            return {}
            
        config = self.raw_results['execution_configuration']
        logger.info(f"DEBUG: execution_configuration found with keys: {list(config.keys()) if config else 'None'}")
        
        data_source = config.get('data_source', {})
        # Format symbols and synthetic_anchor_prices for display
        if 'symbols' in data_source:
            data_source['symbols'] = self._format_list_for_display(data_source['symbols'])
        if 'synthetic_anchor_prices' in data_source:
            data_source['synthetic_anchor_prices'] = self._format_list_for_display(data_source['synthetic_anchor_prices'])
        return {
            'data_source': data_source,
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
            
        # DEBUG: Let's see what the raw data looks like
        logger.info(f"DEBUG: Processing data array with {len(data_array)} rows")
        if len(data_array) > 0:
            logger.info(f"DEBUG: First row: {data_array[0]}")
        if len(data_array) > 1:
            logger.info(f"DEBUG: Second row: {data_array[1]}")
        if len(data_array) > 2:
            logger.info(f"DEBUG: Third row: {data_array[2]}")
            
        # Extract timestamps - check for both 'Date' and 'index' fields
        timestamps = []
        for row in data_array:
            if 'Date' in row:
                timestamps.append(row['Date'])
            elif 'index' in row:
                timestamps.append(row['index'])
        
        symbol_data = {}
        
        for symbol in self.symbols:
            # Get the symbol value from each row, preserving order and handling missing values
            symbol_values = [row.get(symbol) for row in data_array]
            logger.info(f"DEBUG: Symbol {symbol} first 3 values: {symbol_values[:3]}")
            symbol_data[symbol] = symbol_values
            
        return {
            'timestamps': timestamps,
            'symbol_data': symbol_data,
            'count': len(timestamps)
        }

    def create_plots(self) -> Dict[str, Any]:
        """Create Plotly plots for statistical analysis."""
        plots = {}
        
        try:
            # Import here to avoid circular imports
            from .plotting_utils import TimeSeriesPlotter
            
            # Create plotter with raw results
            plotter = TimeSeriesPlotter(self.raw_results)
            
            # Generate original data plot for statistical tests section
            original_data_plot = self._create_original_data_plot_for_stats()
            if original_data_plot:
                plots['original_data_stats'] = original_data_plot
                logger.info("✓ Created original data plot for statistical tests")
            else:
                logger.warning("✗ Failed to create original data plot for statistical tests")

            # Generate additional data transformation plots
            returns_plot = self._create_returns_plot()
            if returns_plot:
                plots['returns_data_plot'] = returns_plot
                logger.info("✓ Created returns data plot")
            else:
                logger.warning("✗ Failed to create returns data plot")

            scaled_plot = self._create_scaled_data_plot()
            if scaled_plot:
                plots['scaled_data_plot'] = scaled_plot
                logger.info("✓ Created scaled data plot")
            else:
                logger.warning("✗ Failed to create scaled data plot")

            pre_garch_plot = self._create_pre_garch_plot()
            if pre_garch_plot:
                plots['pre_garch_plot'] = pre_garch_plot
                logger.info("✓ Created pre-GARCH data plot")
            else:
                logger.warning("✗ Failed to create pre-GARCH data plot")

            post_garch_plot = self._create_post_garch_plot()
            if post_garch_plot:
                plots['post_garch_plot'] = post_garch_plot
                logger.info("✓ Created post-GARCH data plot")
            else:
                logger.warning("✗ Failed to create post-GARCH data plot")

            # Generate ARIMA analysis plots
            arima_plots = self._create_arima_plots()
            if arima_plots:
                plots.update(arima_plots)
                logger.info(f"✓ Created {len(arima_plots)} ARIMA analysis plots")
            else:
                logger.warning("✗ Failed to create ARIMA analysis plots")
                
        except Exception as e:
            logger.error(f"Error creating plots: {e}")
            
        return plots

    def _create_original_data_plot_for_stats(self) -> Optional[str]:
        """Create an original data plot specifically for the Statistical Tests section."""
        try:
            import plotly.graph_objects as go
            import plotly.express as px
            import plotly.utils
            import json
            
            if 'original_data' not in self.raw_results or not self.raw_results['original_data']:
                print("DEBUG: No original_data found in raw_results")
                logger.error("DEBUG: No original_data found in raw_results")
                return None
                
            fig = go.Figure()
            color_palette = px.colors.qualitative.Set2
            
            # Extract data from the original_data array
            original_data = self.raw_results['original_data']
            print(f"DEBUG: Original data has {len(original_data)} rows")
            print(f"DEBUG: First few rows: {original_data[:3] if len(original_data) >= 3 else original_data}")
            print(f"DEBUG: Detected symbols: {self.symbols}")
            
            # Get timestamps - check for both 'Date' and 'index' fields
            timestamps = []
            for row in original_data:
                if 'Date' in row:
                    timestamps.append(row['Date'])
                elif 'index' in row:
                    timestamps.append(row['index'])
                else:
                    # If neither field exists, we can't create the plot
                    print(f"DEBUG: No timestamp field found in row: {row}")
                    
            print(f"DEBUG: Extracted {len(timestamps)} timestamps")
            print(f"DEBUG: First few timestamps: {timestamps[:5] if len(timestamps) >= 5 else timestamps}")
            
            if not timestamps:
                print("DEBUG: No timestamps found - cannot create plot")
                logger.error("DEBUG: No timestamps found - cannot create plot")
                return None
            
            # Add trace for each symbol
            for i, symbol in enumerate(self.symbols):
                prices = []
                symbol_timestamps = []
                
                for j, row in enumerate(original_data):
                    if row.get(symbol) is not None and j < len(timestamps):
                        prices.append(row[symbol])
                        symbol_timestamps.append(timestamps[j])
                
                print(f"DEBUG: Symbol {symbol} - extracted {len(prices)} prices, {len(symbol_timestamps)} timestamps")
                print(f"DEBUG: Symbol {symbol} first few prices: {prices[:5] if len(prices) >= 5 else prices}")
                
                if prices and symbol_timestamps:
                    color = color_palette[i % len(color_palette)]
                    fig.add_trace(go.Scatter(
                        x=symbol_timestamps,
                        y=prices,
                        mode='lines',
                        name=symbol,
                        line=dict(color=color, width=2),
                        hovertemplate=f'<b>{symbol}</b><br>' +
                                    'Date: %{x}<br>' +
                                    'Price: %{y:.2f}<br>' +
                                    '<extra></extra>'
                    ))
                    print(f"DEBUG: Successfully added trace for {symbol}")
                else:
                    print(f"DEBUG: No data to plot for symbol {symbol}")
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Original Price Data - Statistical Analysis Context",
                    x=0.5,
                    font=dict(size=18)
                ),
                xaxis_title="Date",
                yaxis_title="Price",
                yaxis=dict(rangemode='tozero'),  # Set y-axis minimum to 0
                hovermode='x unified',
                template='plotly_white',
                showlegend=True,
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.02,
                    xanchor="right",
                    x=1
                ),
                height=500,  # Increased height for wider appearance
                margin=dict(l=40, r=40, t=80, b=60)  # Reduced margins and made plot wider
            )
            
            print("DEBUG: Successfully created plot JSON")
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            print(f"ERROR: Error creating original data plot for stats: {e}")
            logger.error(f"Error creating original data plot for stats: {e}")
            import traceback
            traceback.print_exc()
            logger.error(f"DEBUG: Full traceback: {traceback.format_exc()}")
            return None

    def _create_returns_plot(self) -> Optional[str]:
        """Create a returns data plot."""
        try:
            import plotly.graph_objects as go
            import plotly.express as px
            import plotly.utils
            import json
            
            if 'returns_data' not in self.raw_results or not self.raw_results['returns_data']:
                return None
                
            fig = go.Figure()
            color_palette = px.colors.qualitative.Set2
            
            # Extract data from the returns_data array
            returns_data = self.raw_results['returns_data']
            
            # Get timestamps - check for both 'Date' and 'index' fields
            timestamps = []
            for row in returns_data:
                if 'Date' in row:
                    timestamps.append(row['Date'])
                elif 'index' in row:
                    timestamps.append(row['index'])
            
            # Add trace for each symbol
            for i, symbol in enumerate(self.symbols):
                returns = []
                symbol_timestamps = []
                
                for j, row in enumerate(returns_data):
                    if row.get(symbol) is not None and j < len(timestamps):
                        returns.append(row[symbol])
                        symbol_timestamps.append(timestamps[j])
                
                if returns and symbol_timestamps:
                    color = color_palette[i % len(color_palette)]
                    fig.add_trace(go.Scatter(
                        x=symbol_timestamps,
                        y=returns,
                        mode='lines',
                        name=symbol,
                        line=dict(color=color, width=1.5),
                        hovertemplate=f'<b>{symbol}</b><br>' +
                                    'Date: %{x}<br>' +
                                    'Return: %{y:.6f}<br>' +
                                    '<extra></extra>'
                    ))
            
            # Add zero line
            fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Daily Returns - Logarithmic Returns",
                    x=0.5,
                    font=dict(size=18)
                ),
                xaxis_title="Date",
                yaxis_title="Return",
                hovermode='x unified',
                template='plotly_white',
                showlegend=True,
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.02,
                    xanchor="right",
                    x=1
                ),
                height=500,  # Increased height for wider appearance
                margin=dict(l=40, r=40, t=80, b=60)  # Reduced margins and made plot wider
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating returns plot: {e}")
            return None

    def _create_scaled_data_plot(self) -> Optional[str]:
        """Create a scaled data plot."""
        try:
            import plotly.graph_objects as go
            import plotly.express as px
            import plotly.utils
            import json
            
            if 'scaled_data' not in self.raw_results or not self.raw_results['scaled_data']:
                return None
                
            fig = go.Figure()
            color_palette = px.colors.qualitative.Set2
            
            # Extract data from the scaled_data array
            scaled_data = self.raw_results['scaled_data']
            
            # Get timestamps - check for both 'Date' and 'index' fields
            timestamps = []
            for row in scaled_data:
                if 'Date' in row:
                    timestamps.append(row['Date'])
                elif 'index' in row:
                    timestamps.append(row['index'])
            
            # Add trace for each symbol
            for i, symbol in enumerate(self.symbols):
                scaled_values = []
                symbol_timestamps = []
                
                for j, row in enumerate(scaled_data):
                    if row.get(symbol) is not None and j < len(timestamps):
                        scaled_values.append(row[symbol])
                        symbol_timestamps.append(timestamps[j])
                
                if scaled_values and symbol_timestamps:
                    color = color_palette[i % len(color_palette)]
                    fig.add_trace(go.Scatter(
                        x=symbol_timestamps,
                        y=scaled_values,
                        mode='lines',
                        name=symbol,
                        line=dict(color=color, width=1.5),
                        hovertemplate=f'<b>{symbol}</b><br>' +
                                    'Date: %{x}<br>' +
                                    'Scaled Value: %{y:.4f}<br>' +
                                    '<extra></extra>'
                    ))
            
            # Add zero line
            fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Scaled Data - Standardized for GARCH Analysis",
                    x=0.5,
                    font=dict(size=18)
                ),
                xaxis_title="Date",
                yaxis_title="Scaled Value",
                hovermode='x unified',
                template='plotly_white',
                showlegend=True,
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.02,
                    xanchor="right",
                    x=1
                ),
                height=500,  # Increased height for wider appearance
                margin=dict(l=40, r=40, t=80, b=60)  # Reduced margins and made plot wider
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating scaled data plot: {e}")
            return None

    def _create_pre_garch_plot(self) -> Optional[str]:
        """Create a pre-GARCH data plot."""
        try:
            import plotly.graph_objects as go
            import plotly.express as px
            import plotly.utils
            import json
            
            if 'pre_garch_data' not in self.raw_results or not self.raw_results['pre_garch_data']:
                return None
                
            fig = go.Figure()
            color_palette = px.colors.qualitative.Set2
            
            # Extract data from the pre_garch_data array
            pre_garch_data = self.raw_results['pre_garch_data']
            
            # Get timestamps - check for both 'Date' and 'index' fields
            timestamps = []
            for row in pre_garch_data:
                if 'Date' in row:
                    timestamps.append(row['Date'])
                elif 'index' in row:
                    timestamps.append(row['index'])
            
            # Add trace for each symbol
            for i, symbol in enumerate(self.symbols):
                pre_garch_values = []
                symbol_timestamps = []
                
                for j, row in enumerate(pre_garch_data):
                    if row.get(symbol) is not None and j < len(timestamps):
                        pre_garch_values.append(row[symbol])
                        symbol_timestamps.append(timestamps[j])
                
                if pre_garch_values and symbol_timestamps:
                    color = color_palette[i % len(color_palette)]
                    fig.add_trace(go.Scatter(
                        x=symbol_timestamps,
                        y=pre_garch_values,
                        mode='lines',
                        name=symbol,
                        line=dict(color=color, width=1.5),
                        hovertemplate=f'<b>{symbol}</b><br>' +
                                    'Date: %{x}<br>' +
                                    'Pre-GARCH Value: %{y:.4f}<br>' +
                                    '<extra></extra>'
                    ))
            
            # Add zero line
            fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Pre-GARCH Data - Input to GARCH Model",
                    x=0.5,
                    font=dict(size=18)
                ),
                xaxis_title="Date",
                yaxis_title="Pre-GARCH Value",
                hovermode='x unified',
                template='plotly_white',
                showlegend=True,
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.02,
                    xanchor="right",
                    x=1
                ),
                height=500,  # Increased height for wider appearance
                margin=dict(l=40, r=40, t=80, b=60)  # Reduced margins and made plot wider
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating pre-GARCH plot: {e}")
            return None

    def _create_post_garch_plot(self) -> Optional[str]:
        """Create a post-GARCH data plot."""
        try:
            import plotly.graph_objects as go
            import plotly.express as px
            import plotly.utils
            import json
            
            if 'post_garch_data' not in self.raw_results or not self.raw_results['post_garch_data']:
                return None
                
            fig = go.Figure()
            color_palette = px.colors.qualitative.Set2
            
            # Extract data from the post_garch_data array
            post_garch_data = self.raw_results['post_garch_data']
            
            # Get timestamps - check for both 'Date' and 'index' fields
            timestamps = []
            for row in post_garch_data:
                if 'Date' in row:
                    timestamps.append(row['Date'])
                elif 'index' in row:
                    timestamps.append(row['index'])
            
            # Add trace for each symbol
            for i, symbol in enumerate(self.symbols):
                post_garch_values = []
                symbol_timestamps = []
                
                for j, row in enumerate(post_garch_data):
                    if row.get(symbol) is not None and j < len(timestamps):
                        post_garch_values.append(row[symbol])
                        symbol_timestamps.append(timestamps[j])
                
                if post_garch_values and symbol_timestamps:
                    color = color_palette[i % len(color_palette)]
                    fig.add_trace(go.Scatter(
                        x=symbol_timestamps,
                        y=post_garch_values,
                        mode='lines',
                        name=symbol,
                        line=dict(color=color, width=1.5),
                        hovertemplate=f'<b>{symbol}</b><br>' +
                                    'Date: %{x}<br>' +
                                    'Post-GARCH Value: %{y:.4f}<br>' +
                                    '<extra></extra>'
                    ))
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Post-GARCH Data - GARCH Model Output",
                    x=0.5,
                    font=dict(size=18)
                ),
                xaxis_title="Date",
                yaxis_title="Post-GARCH Value",
                hovermode='x unified',
                template='plotly_white',
                showlegend=True,
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.02,
                    xanchor="right",
                    x=1
                ),
                height=500,  # Increased height for wider appearance
                margin=dict(l=40, r=40, t=80, b=60)  # Reduced margins and made plot wider
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating post-GARCH plot: {e}")
            return None
    
    def _create_arima_plots(self) -> Dict[str, str]:
        """Create ARIMA analysis plots for each symbol."""
        arima_plots = {}
        
        try:
            import plotly.graph_objects as go
            import plotly.express as px
            import plotly.utils
            import json
            from plotly.subplots import make_subplots
            
            if 'arima_results' not in self.raw_results or not self.raw_results['arima_results']:
                return {}
                
            arima_results = self.raw_results['arima_results']
            if 'all_symbols_arima' not in arima_results:
                return {}
                
            all_symbols = arima_results['all_symbols_arima']
            color_palette = px.colors.qualitative.Set2
            
            for i, (symbol, arima_data) in enumerate(all_symbols.items()):
                if 'summary' not in arima_data:
                    continue
                    
                summary = arima_data['summary']
                forecast_data = arima_data.get('forecast', {})
                
                # Create subplot figure with 2x2 layout
                fig = make_subplots(
                    rows=2, cols=2,
                    subplot_titles=(
                        f'{symbol} - Fitted Values vs Actual',
                        f'{symbol} - Residuals',
                        f'{symbol} - Filtered Series (Mean Removed)',
                        f'{symbol} - Forecast'
                    ),
                    vertical_spacing=0.12,
                    horizontal_spacing=0.1
                )
                
                color = color_palette[i % len(color_palette)]
                
                # Extract data
                fitted_values = summary.get('fitted_values', {})
                residuals = summary.get('residuals', {})
                conditional_filtering = summary.get('conditional_mean_filtering', {})
                filtered_series = conditional_filtering.get('filtered_series', {})
                point_forecasts = forecast_data.get('point_forecasts', [])
                
                # Get timestamps and data for fitted values
                if fitted_values:
                    timestamps = list(fitted_values.keys())
                    fitted_vals = list(fitted_values.values())
                    
                    # Plot 1: Fitted Values vs Actual (using returns data as actual)
                    if 'returns_data' in self.raw_results and self.raw_results['returns_data']:
                        returns_data = self.raw_results['returns_data']
                        actual_values = [row.get(symbol) for row in returns_data if row.get(symbol) is not None]
                        actual_timestamps = [row.get('index') for row in returns_data if row.get(symbol) is not None]
                        
                        if len(actual_values) >= len(fitted_vals):
                            actual_values = actual_values[:len(fitted_vals)]
                            actual_timestamps = actual_timestamps[:len(fitted_vals)]
                            
                            fig.add_trace(
                                go.Scatter(
                                    x=actual_timestamps,
                                    y=actual_values,
                                    mode='lines',
                                    name='Actual',
                                    line=dict(color='black', width=1),
                                    showlegend=True
                                ),
                                row=1, col=1
                            )
                    
                    fig.add_trace(
                        go.Scatter(
                            x=timestamps,
                            y=fitted_vals,
                            mode='lines',
                            name='Fitted',
                            line=dict(color=color, width=2),
                            showlegend=True
                        ),
                        row=1, col=1
                    )
                
                # Plot 2: Residuals
                if residuals:
                    res_timestamps = list(residuals.keys())
                    res_values = list(residuals.values())
                    
                    fig.add_trace(
                        go.Scatter(
                            x=res_timestamps,
                            y=res_values,
                            mode='lines',
                            name='Residuals',
                            line=dict(color='red', width=1),
                            showlegend=True
                        ),
                        row=1, col=2
                    )
                    
                    # Add zero line for residuals
                    fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5, row=1, col=2)
                
                # Plot 3: Filtered Series (Mean Removed)
                if filtered_series:
                    filt_timestamps = list(filtered_series.keys())
                    filt_values = list(filtered_series.values())
                    
                    fig.add_trace(
                        go.Scatter(
                            x=filt_timestamps,
                            y=filt_values,
                            mode='lines',
                            name='Filtered Series',
                            line=dict(color='green', width=1.5),
                            showlegend=True
                        ),
                        row=2, col=1
                    )
                    
                    # Add zero line for filtered series
                    fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5, row=2, col=1)
                
                # Plot 4: Point Forecasts
                if point_forecasts:
                    # Create forecast timestamps (assuming they follow the last timestamp)
                    if fitted_values:
                        last_timestamp = max(fitted_values.keys())
                        # Simple increment for demo - in practice you'd calculate proper future dates
                        forecast_timestamps = [f"Forecast_{j+1}" for j in range(len(point_forecasts))]
                        
                        fig.add_trace(
                            go.Scatter(
                                x=forecast_timestamps,
                                y=point_forecasts,
                                mode='lines+markers',
                                name='Point Forecasts',
                                line=dict(color='purple', width=2),
                                marker=dict(size=6),
                                showlegend=True
                            ),
                            row=2, col=2
                        )
                
                # Update layout
                fig.update_layout(
                    title=dict(
                        text=f"ARIMA Analysis - {symbol} ({forecast_data.get('model_specification', 'ARIMA')})",
                        x=0.5,
                        font=dict(size=16)
                    ),
                    height=600,
                    showlegend=True,
                    legend=dict(
                        orientation="h",
                        yanchor="bottom",
                        y=-0.1,
                        xanchor="center",
                        x=0.5
                    ),
                    template='plotly_white',
                    margin=dict(l=80, r=80, t=120, b=120)  # Increased padding on all sides
                )
                
                # Update axes labels
                fig.update_xaxes(title_text="Date", row=1, col=1)
                fig.update_xaxes(title_text="Date", row=1, col=2)
                fig.update_xaxes(title_text="Date", row=2, col=1)
                fig.update_xaxes(title_text="Forecast Period", row=2, col=2)
                
                fig.update_yaxes(title_text="Value", row=1, col=1)
                fig.update_yaxes(title_text="Residual", row=1, col=2)
                fig.update_yaxes(title_text="Filtered Value", row=2, col=1)
                fig.update_yaxes(title_text="Forecast Value", row=2, col=2)
                
                arima_plots[f'arima_analysis_{symbol.lower()}'] = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
                
        except Exception as e:
            logger.error(f"Error creating ARIMA plots: {e}")
            
        return arima_plots
    
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
        
        # Handle case where var_results is None or not a dictionary
        if not var or not isinstance(var, dict):
            return {
                'fitted_model': None,
                'selected_lag': None,
                'ic_used': None,
                'coefficients': {},
                'granger_causality': {},
                'fevd_matrix': [],
                'fevd_interpretation': {},
                'interpretation': ''
            }
        
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
        
        # Handle case where spillover_results is None or not a dictionary
        if not spillover or not isinstance(spillover, dict):
            return {
                'total_spillover_index': None,
                'directional_spillover': {},
                'net_spillover': {},
                'pairwise_spillover': {},
                'interpretation': '',
                'pairwise_spillover_table': [],
                'spillover_table_data': []
            }
        
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
        """Process standalone Granger Causality results."""
        if 'granger_causality_results' not in self.raw_results:
            return {}
        
        granger = self.raw_results['granger_causality_results']
        
        # Handle case where granger_causality_results is None or not a dictionary
        if not granger or not isinstance(granger, dict):
            return {
                'causality_results': {},
                'interpretations': {},
                'metadata': {}
            }
        
        return {
            'causality_results': granger.get('causality_results', {}),
            'interpretations': granger.get('interpretations', {}),
            'metadata': granger.get('metadata', {})
        }
    
    def process_all(self) -> Dict[str, Any]:
        """
        Process all results into a complete structured format for templates.
        This is the main method called by views to get all processed data.
        """
        # Force debug output to both console and a file
        import sys
        debug_msg = "DEBUG: Starting process_all() method - THIS SHOULD APPEAR!"
        print(debug_msg, flush=True)
        sys.stdout.flush()
        
        # Also write to a debug file
        try:
            with open('./logs/debug_results_processor.log', 'a') as f:
                f.write(f"{debug_msg}\n")
                f.flush()
        except:
            pass
        
        processed_results = {
            'symbols': self.symbols,
            'execution_configuration': self.process_execution_configuration(),
            'data_arrays': self.process_data_arrays(),
            'stationarity_results': self.process_stationarity_results(),
            'arima_results': self.process_arima_results(),
            'garch_results': self.process_garch_results(),
            'var_results': self.process_var_results(),
            'spillover_results': self.process_spillover_results(),
            'granger_causality_results': self.process_granger_causality_results(),  # Add this line
            'plots': self.create_plots(),  # This will call our plotting methods!
            'executive_summary': self.create_executive_summary()  # Add this for Overview tab
        }
        
        debug_msg2 = "DEBUG: Completed process_all() method - THIS SHOULD ALSO APPEAR!"
        print(debug_msg2, flush=True)
        sys.stdout.flush()
        
        try:
            with open('./logs/debug_results_processor.log', 'a') as f:
                f.write(f"{debug_msg2}\n")
                f.flush()
        except:
            pass
        
        return processed_results

    def create_executive_summary(self) -> Dict[str, Any]:
        """
        Create executive summary data for the Overview tab.
        Extracts key information from each analysis component.
        """
        print("DEBUG: Creating executive summary")
        
        # Also write to debug file
        try:
            with open('./logs/debug_results_processor.log', 'a') as f:
                f.write("DEBUG: Creating executive summary\n")
                f.flush()
        except:
            pass
        
        summary = {}
        
        # Create stationarity summary
        stationarity_data = self.process_stationarity_results()
        if stationarity_data.get('all_symbols_stationarity'):
            stationarity_summary = {}
            for symbol, test_result in stationarity_data['all_symbols_stationarity'].items():
                stationarity_summary[symbol] = {
                    'status': 'Stationary' if test_result.get('is_stationary') else 'Non-Stationary',
                    'test_statistic': f"{test_result.get('adf_statistic', 0):.4f}",
                    'p_value': f"{test_result.get('p_value', 0):.4f}",
                    'interpretation': test_result.get('interpretation', 'No interpretation available')
                }
            summary['stationarity_summary'] = stationarity_summary
        
        # Create ARIMA summary
        arima_data = self.process_arima_results()
        if arima_data:
            arima_summary = {}
            for symbol, arima_result in arima_data.items():
                arima_summary[symbol] = {
                    'model_specification': arima_result.get('summary', {}).get('model_specification', 'N/A'),
                    'aic': f"{arima_result.get('summary', {}).get('aic', 0):.2f}",
                    'bic': f"{arima_result.get('summary', {}).get('bic', 0):.2f}",
                    'forecast_steps': arima_result.get('forecast', {}).get('forecast_steps', 'N/A')
                }
            summary['executive_summary'] = arima_summary  # Template expects this key name
        
        # Create GARCH summary
        garch_data = self.process_garch_results()
        if garch_data:
            garch_summary = {}
            for symbol, garch_result in garch_data.items():
                forecast_data = garch_result.get('forecast', [])
                next_volatility = forecast_data[0] if forecast_data and len(forecast_data) > 0 else 'N/A'
                if isinstance(next_volatility, (int, float)):
                    next_volatility = f"{next_volatility:.6f}"
                
                garch_summary[symbol] = {
                    'model_type': 'GARCH',
                    'forecast_periods': len(forecast_data) if forecast_data else 0,
                    'next_period_volatility': next_volatility,
                    'summary_available': bool(garch_result.get('summary'))
                }
            summary['garch_summary'] = garch_summary
        
        # Create spillover summary if available
        spillover_data = self.process_spillover_results()
        if spillover_data.get('total_spillover_index') is not None:
            summary['spillover_summary'] = {
                'total_spillover_index': f"{spillover_data['total_spillover_index']:.2f}%",
                'interpretation': spillover_data.get('interpretation', 'No interpretation available'),
                'symbols_analyzed': len(self.symbols)
            }
        
        print(f"DEBUG: Created executive summary with keys: {list(summary.keys())}")
        return summary
