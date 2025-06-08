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
ALLOWED_HOSTS = ['spilloverlab.com', 'www.spilloverlab.com'] # Add your custom domain
allowed_hosts_env = os.environ.get('ALLOWED_HOSTS')
if allowed_hosts_env:
    ALLOWED_HOSTS.extend([h.strip() for h in allowed_hosts_env.split(',') if h.strip()])

app_host_env = os.environ.get('APP_HOST')
if app_host_env and app_host_env not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(app_host_env)

# Fallback if no hosts are configured via environment variables
if not ALLOWED_HOSTS:
    # This should ideally be configured via environment variables in production
    ALLOWED_HOSTS = ['spilloverlab.com', 'www.spilloverlab.com', 'your-production-domain.com'] # Replace with a sensible default or raise error

# CSRF Trusted Origins - use APP_HOST
CSRF_TRUSTED_ORIGINS = [
    'https://spilloverlab.com',
    'https://www.spilloverlab.com'
]
if app_host_env:
    CSRF_TRUSTED_ORIGINS.append(f"https://{app_host_env}")
elif allowed_hosts_env: # Fallback to the first host in ALLOWED_HOSTS if APP_HOST is not set
    first_allowed_host = ALLOWED_HOSTS[0] if ALLOWED_HOSTS else None
    if first_allowed_host and first_allowed_host != 'localhost' and first_allowed_host != '127.0.0.1':
         CSRF_TRUSTED_ORIGINS.append(f"https://{first_allowed_host}")


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
