#!/usr/bin/env python3
# config/settings/production.py

"""
Production settings for the Timeseries Frontend project.
"""
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Get allowed hosts from environment variable. This is the single source of truth for deployments.
allowed_hosts_str = os.environ.get("ALLOWED_HOSTS")
if allowed_hosts_str:
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_str.split(",")]
else:
    # If ALLOWED_HOSTS is not set, we'll default to an empty list
    # and log a warning, as this should be explicitly set in production.
    # For safety, Django will not run with an empty ALLOWED_HOSTS list if DEBUG is False.
    ALLOWED_HOSTS = []
    # You might want to add logging here to warn that ALLOWED_HOSTS is not set.

# CSRF Trusted Origins - build directly from ALLOWED_HOSTS.
# We filter out empty strings that might result from splitting an empty env var.
CSRF_TRUSTED_ORIGINS = [f"https://{host}" for host in ALLOWED_HOSTS if host]
# Add http origins for local testing if applicable
# This part is more for local testing of production settings.
if "localhost" in ALLOWED_HOSTS:
    CSRF_TRUSTED_ORIGINS.append('http://localhost:8000')
    CSRF_TRUSTED_ORIGINS.append('http://127.0.0.1:8000')


# Trust the X-Forwarded-Host header from the Google Cloud Run proxy
USE_X_FORWARDED_HOST = True

# Trust the X-Forwarded-Proto header from Cloudflare and other proxies
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Auto-detect Google Cloud Run environment
# Cloud Run sets K_SERVICE environment variable
is_cloud_run = bool(os.environ.get('K_SERVICE')) or os.environ.get('GOOGLE_CLOUD_RUN', 'False').lower() == 'true'

if is_cloud_run:
    # Running on Google Cloud Run
    # SECURE_SSL_REDIRECT should be False because Cloud Run handles SSL termination.
    SECURE_SSL_REDIRECT = False
else:
    # For other environments (e.g., local Docker if it's not behind an SSL-terminating proxy)
    # Set to False unless Django itself needs to enforce HTTPS.
    SECURE_SSL_REDIRECT = False

# Database configuration for Cloud Run
# Use persistent SQLite for Cloud Run to maintain session data
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',  # Use persistent file instead of :memory:
    }
}

# Cache configuration - keep for other caching needs
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-session-cache',
    }
}

# Use database sessions instead of cache sessions for persistence
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

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

# API Configuration for Production
# Get the API URL from an environment variable. The base settings already provide a
# default, so we just need to ensure production settings use the env var.
TIMESERIES_API_URL = os.environ.get('API_URL', TIMESERIES_API_URL)


# Update Content Security Policy to include the configured API domain
# We start with the base policy and extend the connect-src directive
csp_connect_src = list(CONTENT_SECURITY_POLICY['DIRECTIVES'].get('connect-src', ("'self'",)))
if TIMESERIES_API_URL not in csp_connect_src:
    csp_connect_src.append(TIMESERIES_API_URL)

CONTENT_SECURITY_POLICY['DIRECTIVES']['connect-src'] = tuple(csp_connect_src)
