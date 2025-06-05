#!/usr/bin/env python3
# timeseries/models.py

"""
Models for the timeseries app.
"""
from django.db import models
from django.contrib.auth.models import User


class AnalysisConfiguration(models.Model):
    """
    Model to store saved analysis configurations.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analysis_configs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Data source configuration
    source_type = models.CharField(
        max_length=20,
        choices=[('actual', 'Yahoo Finance'), ('synthetic', 'Synthetic Data')],
        default='actual'
    )
    symbols = models.CharField(max_length=255, help_text="Comma-separated list of symbols")
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Synthetic data parameters (optional)
    synthetic_anchor_prices = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Comma-separated list of anchor prices"
    )
    synthetic_random_seed = models.IntegerField(blank=True, null=True)
    
    # Processing parameters
    scaling_method = models.CharField(
        max_length=20,
        choices=[
            ('standardize', 'Standardize (Z-score)'),
            ('minmax', 'Min-Max Scaling'),
            ('none', 'No Scaling')
        ],
        default='standardize'
    )
    
    # ARIMA parameters
    arima_p = models.PositiveSmallIntegerField(default=2)
    arima_d = models.PositiveSmallIntegerField(default=1)
    arima_q = models.PositiveSmallIntegerField(default=4)
    
    # GARCH parameters
    garch_p = models.PositiveSmallIntegerField(default=1)
    garch_q = models.PositiveSmallIntegerField(default=1)
    garch_dist = models.CharField(
        max_length=10,
        choices=[
            ('normal', 'Normal'),
            ('t', 'Student\'s t'),
            ('skewt', 'Skewed t')
        ],
        default='t'
    )
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Analysis Configuration'
        verbose_name_plural = 'Analysis Configurations'
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
    def get_arima_params(self):
        """Get ARIMA parameters as a dictionary."""
        return {
            'p': self.arima_p,
            'd': self.arima_d,
            'q': self.arima_q
        }
    
    def get_garch_params(self):
        """Get GARCH parameters as a dictionary."""
        return {
            'p': self.garch_p,
            'q': self.garch_q,
            'dist': self.garch_dist
        }
    
    def get_symbols_list(self):
        """Get symbols as a list."""
        return [s.strip() for s in self.symbols.split(',')]
    
    def get_synthetic_anchor_prices(self):
        """Get synthetic anchor prices as a list of floats."""
        if not self.synthetic_anchor_prices:
            return []
        return [float(p.strip()) for p in self.synthetic_anchor_prices.split(',')]


class AnalysisResult(models.Model):
    """
    Model to store analysis results.
    """
    configuration = models.ForeignKey(
        AnalysisConfiguration, 
        on_delete=models.CASCADE,
        related_name='results'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Raw API response
    raw_response = models.JSONField()
    
    # Extracted results
    is_stationary = models.BooleanField()
    arima_summary = models.TextField()
    garch_summary = models.TextField()
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Analysis Result'
        verbose_name_plural = 'Analysis Results'
    
    def __str__(self):
        return f"Result for {self.configuration.name} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
