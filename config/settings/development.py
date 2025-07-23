#!/usr/bin/env python3
# config/settings/development.py

"""
Development settings for the Timeseries Frontend project.
"""
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Hosts for local development
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Debug toolbar settings
INTERNAL_IPS = ['127.0.0.1']

# Disable security features in development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
