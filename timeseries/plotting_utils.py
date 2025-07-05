#!/usr/bin/env python3
# timeseries-frontend/timeseries/plotting_utils.py

"""
Plotting utilities for time series analysis visualization using Plotly.
Generates interactive charts server-side to reduce client-side JavaScript dependencies.
"""

import logging
import json
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.utils
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union

logger = logging.getLogger(__name__)


class TimeSeriesPlotter:
    """
    Class for generating Plotly charts from time series analysis results.
    """
    
    def __init__(self, analysis_results: Dict[str, Any]):
        """
        Initialize the plotter with analysis results.
        
        Args:
            analysis_results: Dictionary containing analysis results from the API
        """
        self.results = analysis_results
        self.symbols = self._extract_symbols()
        self.color_palette = px.colors.qualitative.Set2
        
    def _extract_symbols(self) -> List[str]:
        """Extract symbol names from the analysis results."""
        if 'data' in self.results and isinstance(self.results['data'], dict):
            return list(self.results['data'].keys())
        return []
    
    def _safe_get_data(self, symbol: str) -> Dict[str, Any]:
        """Safely extract data for a symbol."""
        try:
            if 'data' in self.results and symbol in self.results['data']:
                return self.results['data'][symbol]
            return {}
        except Exception as e:
            logger.error(f"Error extracting data for {symbol}: {e}")
            return {}
    
    def _create_date_range(self, n_points: int, start_date: Optional[str] = None) -> List[str]:
        """Create a date range for plotting."""
        if start_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
            except:
                start = datetime.now()
        else:
            start = datetime.now()
        
        return [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(n_points)]
    
    def create_time_series_plot(self) -> Optional[str]:
        """
        Create an interactive time series plot showing price movements for all symbols.
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            fig = go.Figure()
            
            for i, symbol in enumerate(self.symbols):
                data = self._safe_get_data(symbol)
                
                if not data:
                    continue
                
                # Handle different data formats
                if isinstance(data, dict):
                    if 'dates' in data and 'prices' in data:
                        # Format: {'dates': [...], 'prices': [...]}
                        dates = data['dates']
                        prices = data['prices']
                    elif all(isinstance(v, (int, float)) for v in data.values()):
                        # Format: {'2023-01-01': 100.0, '2023-01-02': 101.0, ...}
                        dates = list(data.keys())
                        prices = list(data.values())
                    else:
                        logger.warning(f"Unexpected data format for {symbol}")
                        continue
                else:
                    logger.warning(f"Unexpected data type for {symbol}: {type(data)}")
                    continue
                
                # Add trace
                color = self.color_palette[i % len(self.color_palette)]
                fig.add_trace(go.Scatter(
                    x=dates,
                    y=prices,
                    mode='lines',
                    name=symbol,
                    line=dict(color=color, width=2),
                    hovertemplate=f'<b>{symbol}</b><br>' +
                                'Date: %{x}<br>' +
                                'Price: %{y:.2f}<br>' +
                                '<extra></extra>'
                ))
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Time Series Data - Price Movements",
                    x=0.5,
                    font=dict(size=20)
                ),
                xaxis_title="Date",
                yaxis_title="Price",
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
                height=500,
                margin=dict(l=50, r=50, t=80, b=50)
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating time series plot: {e}")
            return None
    
    def create_returns_plot(self) -> Optional[str]:
        """
        Create a returns plot showing daily returns for all symbols.
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            fig = go.Figure()
            
            for i, symbol in enumerate(self.symbols):
                data = self._safe_get_data(symbol)
                
                if not data:
                    continue
                
                # Extract returns data
                returns = None
                dates = None
                
                if isinstance(data, dict):
                    if 'dates' in data and 'returns' in data:
                        dates = data['dates']
                        returns = data['returns']
                    elif 'dates' in data and 'prices' in data:
                        # Calculate returns from prices
                        dates = data['dates']
                        prices = data['prices']
                        returns = [0] + [((prices[i] - prices[i-1]) / prices[i-1]) for i in range(1, len(prices))]
                    else:
                        logger.warning(f"No returns data available for {symbol}")
                        continue
                
                if returns is None or dates is None:
                    continue
                
                # Add trace
                color = self.color_palette[i % len(self.color_palette)]
                fig.add_trace(go.Scatter(
                    x=dates,
                    y=returns,
                    mode='lines',
                    name=symbol,
                    line=dict(color=color, width=1.5),
                    hovertemplate=f'<b>{symbol}</b><br>' +
                                'Date: %{x}<br>' +
                                'Return: %{y:.4f}<br>' +
                                '<extra></extra>'
                ))
            
            # Add zero line
            fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Daily Returns",
                    x=0.5,
                    font=dict(size=20)
                ),
                xaxis_title="Date",
                yaxis_title="Returns",
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
                height=400,
                margin=dict(l=50, r=50, t=80, b=50)
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating returns plot: {e}")
            return None
    
    def create_arima_forecast_plot(self) -> Optional[str]:
        """
        Create ARIMA forecast visualization with confidence intervals.
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            fig = make_subplots(
                rows=len(self.symbols),
                cols=1,
                subplot_titles=[f"{symbol} - ARIMA Forecast" for symbol in self.symbols],
                vertical_spacing=0.08
            )
            
            for i, symbol in enumerate(self.symbols, 1):
                # Get historical data
                data = self._safe_get_data(symbol)
                arima_results = self.results.get('arima_results', {}).get(symbol, {})
                
                if not data or not arima_results:
                    continue
                
                # Extract historical prices
                if 'dates' in data and 'prices' in data:
                    hist_dates = data['dates']
                    hist_prices = data['prices']
                elif isinstance(data, dict) and all(isinstance(v, (int, float)) for v in data.values()):
                    hist_dates = list(data.keys())
                    hist_prices = list(data.values())
                else:
                    continue
                
                # Add historical data
                color = self.color_palette[(i-1) % len(self.color_palette)]
                fig.add_trace(
                    go.Scatter(
                        x=hist_dates,
                        y=hist_prices,
                        mode='lines',
                        name=f'{symbol} Historical',
                        line=dict(color=color, width=2),
                        showlegend=(i == 1)
                    ),
                    row=i, col=1
                )
                
                # Add forecast
                forecast = arima_results.get('forecast', [])
                forecast_se = arima_results.get('forecast_se', [])
                
                if forecast:
                    # Create forecast dates
                    last_date = hist_dates[-1] if hist_dates else "2023-01-01"
                    try:
                        last_dt = datetime.strptime(last_date, "%Y-%m-%d")
                        forecast_dates = [(last_dt + timedelta(days=j+1)).strftime("%Y-%m-%d") 
                                        for j in range(len(forecast))]
                    except:
                        forecast_dates = [f"Day {j+1}" for j in range(len(forecast))]
                    
                    # Add forecast line
                    fig.add_trace(
                        go.Scatter(
                            x=forecast_dates,
                            y=forecast,
                            mode='lines+markers',
                            name=f'{symbol} Forecast',
                            line=dict(color=color, width=2, dash='dash'),
                            marker=dict(size=6),
                            showlegend=(i == 1)
                        ),
                        row=i, col=1
                    )
                    
                    # Add confidence intervals if available
                    if forecast_se:
                        upper_bound = [f + 1.96 * se for f, se in zip(forecast, forecast_se)]
                        lower_bound = [f - 1.96 * se for f, se in zip(forecast, forecast_se)]
                        
                        # Convert hex color to rgba properly
                        try:
                            rgb_vals = px.colors.hex_to_rgb(color)
                            rgba_color = f'rgba({rgb_vals[0]}, {rgb_vals[1]}, {rgb_vals[2]}, 0.2)'
                        except:
                            rgba_color = 'rgba(128, 128, 128, 0.2)'  # fallback color
                        
                        fig.add_trace(
                            go.Scatter(
                                x=forecast_dates + forecast_dates[::-1],
                                y=upper_bound + lower_bound[::-1],
                                fill='toself',
                                fillcolor=rgba_color,
                                line=dict(color='rgba(255,255,255,0)'),
                                name=f'{symbol} 95% CI',
                                showlegend=(i == 1)
                            ),
                            row=i, col=1
                        )
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="ARIMA Forecasts with Confidence Intervals",
                    x=0.5,
                    font=dict(size=20)
                ),
                template='plotly_white',
                showlegend=True,
                height=300 * len(self.symbols),
                margin=dict(l=50, r=50, t=80, b=50)
            )
            
            # Update axis labels
            for i in range(len(self.symbols)):
                fig.update_xaxes(title_text="Date", row=i+1, col=1)
                fig.update_yaxes(title_text="Price", row=i+1, col=1)
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating ARIMA forecast plot: {e}")
            return None
    
    def create_garch_volatility_plot(self) -> Optional[str]:
        """
        Create GARCH volatility forecast visualization.
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            fig = make_subplots(
                rows=len(self.symbols),
                cols=1,
                subplot_titles=[f"{symbol} - GARCH Volatility Forecast" for symbol in self.symbols],
                vertical_spacing=0.08
            )
            
            for i, symbol in enumerate(self.symbols, 1):
                garch_results = self.results.get('garch_results', {}).get(symbol, {})
                
                if not garch_results:
                    continue
                
                volatility_forecast = garch_results.get('volatility_forecast', [])
                
                if volatility_forecast:
                    # Create forecast dates
                    forecast_dates = [f"Day {j+1}" for j in range(len(volatility_forecast))]
                    
                    color = self.color_palette[(i-1) % len(self.color_palette)]
                    
                    # Add volatility forecast
                    fig.add_trace(
                        go.Scatter(
                            x=forecast_dates,
                            y=volatility_forecast,
                            mode='lines+markers',
                            name=f'{symbol} Volatility',
                            line=dict(color=color, width=2),
                            marker=dict(size=6),
                            showlegend=(i == 1),
                            hovertemplate=f'<b>{symbol}</b><br>' +
                                        'Period: %{x}<br>' +
                                        'Volatility: %{y:.4f}<br>' +
                                        '<extra></extra>'
                        ),
                        row=i, col=1
                    )
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="GARCH Volatility Forecasts",
                    x=0.5,
                    font=dict(size=20)
                ),
                template='plotly_white',
                showlegend=True,
                height=250 * len(self.symbols),
                margin=dict(l=50, r=50, t=80, b=50)
            )
            
            # Update axis labels
            for i in range(len(self.symbols)):
                fig.update_xaxes(title_text="Forecast Period", row=i+1, col=1)
                fig.update_yaxes(title_text="Volatility", row=i+1, col=1)
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating GARCH volatility plot: {e}")
            return None
    
    def create_spillover_heatmap(self) -> Optional[str]:
        """
        Create spillover matrix heatmap visualization.
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            spillover_results = self.results.get('spillover_results', {})
            
            if not spillover_results:
                return None
            
            # Extract spillover matrix
            spillover_matrix = spillover_results.get('spillover_matrix', {})
            
            if not spillover_matrix:
                return None
            
            # Convert to matrix format
            symbols = list(spillover_matrix.keys())
            matrix_data = []
            
            for from_symbol in symbols:
                row = []
                for to_symbol in symbols:
                    value = spillover_matrix.get(from_symbol, {}).get(to_symbol, 0)
                    row.append(value)
                matrix_data.append(row)
            
            # Create heatmap
            fig = go.Figure(data=go.Heatmap(
                z=matrix_data,
                x=symbols,
                y=symbols,
                colorscale='RdYlBu_r',
                showscale=True,
                colorbar=dict(title="Spillover %"),
                hovertemplate='From: %{y}<br>To: %{x}<br>Spillover: %{z:.1f}%<extra></extra>'
            ))
            
            # Add text annotations
            annotations = []
            for i, from_symbol in enumerate(symbols):
                for j, to_symbol in enumerate(symbols):
                    annotations.append(
                        dict(
                            x=to_symbol,
                            y=from_symbol,
                            text=f"{matrix_data[i][j]:.1f}%",
                            showarrow=False,
                            font=dict(color="white" if matrix_data[i][j] > 50 else "black")
                        )
                    )
            
            fig.update_layout(
                title=dict(
                    text="Spillover Matrix Heatmap",
                    x=0.5,
                    font=dict(size=20)
                ),
                xaxis_title="To (Receiving)",
                yaxis_title="From (Transmitting)",
                template='plotly_white',
                annotations=annotations,
                height=400,
                margin=dict(l=100, r=50, t=80, b=100)
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating spillover heatmap: {e}")
            return None
    
    def create_stationarity_plot(self) -> Optional[str]:
        """
        Create stationarity test results visualization.
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            stationarity_results = self.results.get('stationarity_results', {})
            
            if not stationarity_results:
                return None
            
            symbols = []
            p_values = []
            adf_statistics = []
            is_stationary = []
            
            for symbol, result in stationarity_results.items():
                symbols.append(symbol)
                p_values.append(result.get('p_value', 1.0))
                adf_statistics.append(result.get('adf_statistic', 0.0))
                is_stationary.append(result.get('is_stationary', False))
            
            # Create subplot
            fig = make_subplots(
                rows=1, cols=2,
                subplot_titles=('P-Values', 'ADF Statistics'),
                specs=[[{"secondary_y": False}, {"secondary_y": False}]]
            )
            
            # P-values bar chart
            colors_p = ['green' if stat else 'red' for stat in is_stationary]
            fig.add_trace(
                go.Bar(
                    x=symbols,
                    y=p_values,
                    name='P-Value',
                    marker_color=colors_p,
                    hovertemplate='Symbol: %{x}<br>P-Value: %{y:.4f}<extra></extra>'
                ),
                row=1, col=1
            )
            
            # Add significance line
            fig.add_hline(y=0.05, line_dash="dash", line_color="red", 
                         annotation_text="α = 0.05")
            
            # ADF statistics bar chart
            colors_adf = ['green' if stat else 'red' for stat in is_stationary]
            fig.add_trace(
                go.Bar(
                    x=symbols,
                    y=adf_statistics,
                    name='ADF Statistic',
                    marker_color=colors_adf,
                    hovertemplate='Symbol: %{x}<br>ADF: %{y:.4f}<extra></extra>'
                ),
                row=1, col=2
            )
            
            # Update layout
            fig.update_layout(
                title=dict(
                    text="Stationarity Test Results (ADF Test)",
                    x=0.5,
                    font=dict(size=20)
                ),
                template='plotly_white',
                showlegend=False,
                height=400,
                margin=dict(l=50, r=50, t=80, b=50)
            )
            
            # Update axis labels
            fig.update_xaxes(title_text="Symbol", row=1, col=1)
            fig.update_yaxes(title_text="P-Value", row=1, col=1)
            fig.update_xaxes(title_text="Symbol", row=1, col=2)
            fig.update_yaxes(title_text="ADF Statistic", row=1, col=2)
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating stationarity plot: {e}")
            return None
    
    def create_correlation_matrix(self) -> Optional[str]:
        """
        Create correlation matrix heatmap from time series data.
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            # Extract returns data for correlation calculation
            returns_data = {}
            
            for symbol in self.symbols:
                data = self._safe_get_data(symbol)
                
                if isinstance(data, dict):
                    if 'returns' in data:
                        returns_data[symbol] = data['returns']
                    elif 'prices' in data:
                        prices = data['prices']
                        returns = [0] + [((prices[i] - prices[i-1]) / prices[i-1]) for i in range(1, len(prices))]
                        returns_data[symbol] = returns
            
            if len(returns_data) < 2:
                return None
            
            # Create DataFrame and calculate correlation
            df = pd.DataFrame(returns_data)
            correlation_matrix = df.corr()
            
            # Create heatmap
            fig = go.Figure(data=go.Heatmap(
                z=correlation_matrix.values,
                x=correlation_matrix.columns,
                y=correlation_matrix.index,
                colorscale='RdBu',
                zmid=0,
                showscale=True,
                colorbar=dict(title="Correlation"),
                hovertemplate='%{y} vs %{x}<br>Correlation: %{z:.3f}<extra></extra>'
            ))
            
            # Add text annotations
            annotations = []
            for i, row in enumerate(correlation_matrix.index):
                for j, col in enumerate(correlation_matrix.columns):
                    value = correlation_matrix.iloc[i, j]
                    # Handle pandas scalar types more robustly
                    if pd.isna(value):
                        numeric_value = 0.0
                    else:
                        # Use numpy conversion which handles pandas scalars better
                        numeric_value = float(np.asarray(value).item())
                    
                    annotations.append(
                        dict(
                            x=col,
                            y=row,
                            text=f"{numeric_value:.3f}",
                            showarrow=False,
                            font=dict(color="white" if abs(numeric_value) > 0.5 else "black")
                        )
                    )
            
            fig.update_layout(
                title=dict(
                    text="Returns Correlation Matrix",
                    x=0.5,
                    font=dict(size=20)
                ),
                template='plotly_white',
                annotations=annotations,
                height=400,
                margin=dict(l=100, r=50, t=80, b=100)
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating correlation matrix: {e}")
            return None
    
    def create_scaled_data_plot(self) -> Optional[str]:
        """
        Create a scaled data plot (typically used for GARCH preprocessing).
        
        Returns:
            JSON string of the Plotly figure or None if error
        """
        try:
            fig = go.Figure()
            
            for i, symbol in enumerate(self.symbols):
                data = self._safe_get_data(symbol)
                
                if not data:
                    continue
                
                # Look for scaled data, fall back to returns if not available
                scaled_data = None
                dates = None
                
                if isinstance(data, dict):
                    if 'dates' in data and 'scaled_data' in data:
                        dates = data['dates']
                        scaled_data = data['scaled_data']
                    elif 'dates' in data and 'returns' in data:
                        # Use returns as proxy for scaled data
                        dates = data['dates']
                        scaled_data = data['returns']
                    elif 'dates' in data and 'prices' in data:
                        # Calculate returns as scaled data
                        dates = data['dates']
                        prices = data['prices']
                        scaled_data = [0] + [((prices[i] - prices[i-1]) / prices[i-1]) for i in range(1, len(prices))]
                    else:
                        logger.warning(f"No scaled data available for {symbol}")
                        continue
                
                if scaled_data is None or dates is None:
                    continue
                
                # Add trace
                color = self.color_palette[i % len(self.color_palette)]
                fig.add_trace(go.Scatter(
                    x=dates,
                    y=scaled_data,
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
                    text="Scaled Data (for GARCH Analysis)",
                    x=0.5,
                    font=dict(size=20)
                ),
                xaxis_title="Date",
                yaxis_title="Scaled Values",
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
                height=400,
                margin=dict(l=50, r=50, t=80, b=50)
            )
            
            return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Error creating scaled data plot: {e}")
            return None
    
    def create_all_plots(self) -> Dict[str, Optional[str]]:
        """
        Create all available plots and return as dictionary.
        
        Returns:
            Dictionary mapping plot names to JSON strings (using template-expected names)
        """
        plots = {}
        
        logger.info("Creating time series plots...")
        
        # Create each plot type with template-expected names
        plot_functions = {
            'original_data': self.create_time_series_plot,  # Template expects 'original_data'
            'returns_data': self.create_returns_plot,       # Template expects 'returns_data' 
            'scaled_data': self.create_scaled_data_plot,    # Template expects 'scaled_data'
            'arima_forecast': self.create_arima_forecast_plot,
            'garch_volatility': self.create_garch_volatility_plot,
            'spillover_heatmap': self.create_spillover_heatmap,
            'stationarity': self.create_stationarity_plot,
            'correlation_matrix': self.create_correlation_matrix
        }
        
        for plot_name, plot_function in plot_functions.items():
            try:
                plots[plot_name] = plot_function()
                status = "✓" if plots[plot_name] else "✗"
                logger.info(f"{status} {plot_name}")
            except Exception as e:
                logger.error(f"✗ {plot_name}: {e}")
                plots[plot_name] = None
        
        successful_plots = len([p for p in plots.values() if p is not None])
        logger.info(f"Successfully created {successful_plots}/{len(plots)} plots")
        
        return plots


def create_summary_statistics_table(analysis_results: Dict[str, Any]) -> Optional[str]:
    """
    Create a summary statistics table as HTML.
    
    Args:
        analysis_results: Analysis results dictionary
        
    Returns:
        HTML string for the table or None if error
    """
    try:
        data = analysis_results.get('data', {})
        if not data:
            return None
        
        # Prepare statistics
        stats = []
        for symbol, symbol_data in data.items():
            if isinstance(symbol_data, dict):
                if 'prices' in symbol_data:
                    prices = symbol_data['prices']
                    if prices:
                        stats.append({
                            'Symbol': symbol,
                            'Count': len(prices),
                            'Mean': f"{np.mean(prices):.2f}",
                            'Std': f"{np.std(prices):.2f}",
                            'Min': f"{np.min(prices):.2f}",
                            'Max': f"{np.max(prices):.2f}"
                        })
        
        if not stats:
            return None
        
        # Create HTML table
        df = pd.DataFrame(stats)
        html = df.to_html(classes='table table-striped table-hover', 
                         table_id='summary-stats-table',
                         escape=False, index=False)
        
        return html
        
    except Exception as e:
        logger.error(f"Error creating summary statistics table: {e}")
        return None