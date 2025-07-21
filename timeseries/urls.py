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
    path('results/test/', views.results_test, name='results_test'),
    path('about/', views.about, name='about'),
    path('iterate/', views.iterate, name='iterate'),
    # API response functionality
    path('download-api-response/', views.download_api_response, name='download_api_response'),
    path('view-api-response/', views.view_api_response_popup, name='view_api_response_popup'),
    # CSV export functionality
    path('export-csv/<str:data_type>/', views.export_csv, name='export_csv'),
    # Generic API proxy - captures the rest of the path and passes it to the view
    path('api_proxy/<path:api_path>', views.api_proxy, name='api_proxy'),
    # HTMX analysis endpoint
    path('api/run_pipeline_htmx', views.run_pipeline_htmx, name='run_pipeline_htmx'),
    # Debug endpoints
    path('debug/api-data', views.debug_data, name='debug_data'),
]
