#!/usr/bin/env python3
# timeseries/urls.py

"""
URL patterns for the timeseries app.
"""
from django.urls import path
from . import views

app_name = 'timeseries'

urlpatterns = [
    path('', views.index, name='index'),
    path('analysis/', views.analysis, name='analysis'),
    path('results/', views.results, name='results'),
    path('about/', views.about, name='about'),
    # Generic API proxy - captures the rest of the path and passes it to the view
    path('api_proxy/<path:api_path>', views.api_proxy, name='api_proxy'),
    # Specific API proxy endpoints (if you want to keep them for non-JS or specific logic)
    # Ensure no trailing slash for consistency with FastAPI backend
    path('api/run_pipeline', views.run_pipeline, name='run_pipeline'),
    # Debug endpoints
    path('debug/api-data', views.debug_data, name='debug_data'), # Removed trailing slash
    path('debug/results', views.debug_results, name='debug_results'), # Removed trailing slash
]
