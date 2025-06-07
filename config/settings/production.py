#!/usr/bin/env python3
# config/settings/production.py

"""
Production settings for the Timeseries Frontend project.
"""
import os
from .base import *
from .security_settings import configure_for_production

# Enable production security settings
production_security = configure_for_production(is_production=True)
globals().update(production_security)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Get allowed hosts from environment variable
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Auto-detect Google Cloud Run environment
# Cloud Run sets K_SERVICE environment variable
is_cloud_run = bool(os.environ.get('K_SERVICE'))  # this checks if the K_SERVICE environment variable is set, which is typical for Cloud Run
if is_cloud_run or os.environ.get('GOOGLE_CLOUD_RUN', False):
    # Running on Google Cloud Run
    ALLOWED_HOSTS.append('.run.app')

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
