#!/usr/bin/env python3
# config/settings/production.py

"""
Production settings for the Timeseries Frontend project.
"""
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Get allowed hosts from environment variable
allowed_hosts_env = os.environ.get('ALLOWED_HOSTS')
if allowed_hosts_env:
    # Split and filter out empty strings that might result from "foo,,bar"
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = []

# Add localhost and 127.0.0.1 for local Docker access if not already present.
# These are common for development and local testing scenarios.
if 'localhost' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('localhost')
if '127.0.0.1' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('127.0.0.1')

# Ensure ALLOWED_HOSTS is not empty if it started as [] and nothing was added from env.
# This can happen if ALLOWED_HOSTS env var is not set or is an empty string.
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Auto-detect Google Cloud Run environment
# Cloud Run sets K_SERVICE environment variable
is_cloud_run = bool(os.environ.get('K_SERVICE'))  # this checks if the K_SERVICE environment variable is set, which is typical for Cloud Run
if is_cloud_run or os.environ.get('GOOGLE_CLOUD_RUN', False):
    # Running on Google Cloud Run
    ALLOWED_HOSTS.append('.run.app')
    SECURE_SSL_REDIRECT = True  # Enable SSL redirect only for Cloud Run
else:
    SECURE_SSL_REDIRECT = False # Disable SSL redirect for local Docker and other environments

# Security settings
SESSION_COOKIE_SECURE = True # Consider making this conditional if issues arise in local HTTP
CSRF_COOKIE_SECURE = True    # Consider making this conditional if issues arise in local HTTP
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
