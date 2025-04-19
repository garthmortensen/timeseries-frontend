#!/usr/bin/env python3
# timeseries/views.py

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
    # API proxy endpoints
    path('api/run_pipeline/', views.run_pipeline, name='run_pipeline'),
]
