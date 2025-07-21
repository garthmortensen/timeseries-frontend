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

# Ensure ALLOWED_HOSTS is not empty
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['spilloverlab.com', 'www.spilloverlab.com']

# CSRF Trusted Origins - build from ALLOWED_HOSTS
# This ensures any allowed host is also trusted for secure requests.
CSRF_TRUSTED_ORIGINS = [f"https://{host}" for host in ALLOWED_HOSTS]

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
