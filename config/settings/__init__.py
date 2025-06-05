#!/usr/bin/env python3
# config/settings/__init__.py

"""
Settings package initialization.
Determine which settings to use based on environment variable.
"""
import os

# Default to development if DJANGO_SETTINGS_MODULE is not set
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# If DJANGO_SETTINGS_MODULE is not explicitly set, set it now
if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ['DJANGO_SETTINGS_MODULE'] = settings_module

# Import the appropriate settings module
if settings_module == 'config.settings.development':
    from .development import *
elif settings_module == 'config.settings.production':
    from .production import *
else:
    from .base import *
