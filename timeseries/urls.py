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
    # API proxy endpoints
    path('api/run_pipeline/', views.run_pipeline, name='run_pipeline'),
    # Debug endpoints
    path('debug/api-data/', views.debug_data, name='debug_data'),
    path('debug/results/', views.debug_results, name='debug_results'),
]