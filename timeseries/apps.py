#!/usr/bin/env python3
# timeseries/apps.py

from django.apps import AppConfig


class TimeseriesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "timeseries"
