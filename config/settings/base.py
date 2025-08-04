#!/usr/bin/env python3

#
# === FILE META OPENING ===
# file: ./timeseries-frontend/config/settings/base.py
# role: config
# desc: Django base settings configuration including database, logging, and security configurations
# === FILE META CLOSING ===
#

"""
Base settings for the Timeseries Frontend project.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from .security_settings import *

# Load environment variables from .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',  # Add sitemap support
    # Third party apps
    'whitenoise.runserver_nostatic',
    'csp',
    # Local apps
    'timeseries',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',  # Keep this first
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',  # CSP middleware
]

# Add debug toolbar if in debug mode
if os.environ.get('DJANGO_DEBUG', 'False') == 'True':
    INSTALLED_APPS.append('debug_toolbar')
    MIDDLEWARE.append('debug_toolbar.middleware.DebugToolbarMiddleware')

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'timeseries.context_processors.api_url_processor',  # Added this line
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# URL for the backend Timeseries API
# Used by the api_proxy view and other direct server-to-server API calls
TIMESERIES_API_URL_ENV = os.environ.get("API_URL")  # Changed from "API_URL" to use your environment variable
if TIMESERIES_API_URL_ENV:
    if not TIMESERIES_API_URL_ENV.startswith(("http://", "https://")):
        # If it looks like a domain (e.g., contains a dot, not localhost) and has no scheme, assume https
        if "." in TIMESERIES_API_URL_ENV and "localhost" not in TIMESERIES_API_URL_ENV:
            TIMESERIES_API_URL = f"https://{TIMESERIES_API_URL_ENV}"
        # Otherwise (e.g. localhost or something else without a dot), default to http if no scheme
        else:
            TIMESERIES_API_URL = f"http://{TIMESERIES_API_URL_ENV}"
    else:
        TIMESERIES_API_URL = TIMESERIES_API_URL_ENV
else:
    # Default for local development if API_URL is not set
    TIMESERIES_API_URL = "http://localhost:8001"

# Timeout for requests made to the backend Timeseries API
API_TIMEOUT_SECONDS = int(os.environ.get("API_TIMEOUT_SECONDS", 60))

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-timeseries-cache',
        'TIMEOUT': 3600,  # 1 hour default timeout
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# Session configuration - Use database backend for persistence
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Logging configuration
# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'filename': BASE_DIR / 'logs/app.log',
            'formatter': 'verbose',
            'when': 'midnight',
            'backupCount': 7,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'timeseries': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Content Security Policy settings - Updated for django-csp 4.0+
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'style-src': ("'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"),
        'script-src': ("'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.plot.ly", "https://www.googletagmanager.com"),
        'font-src': ("'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"),
        'img-src': ("'self'", "data:"),
        'connect-src': ("'self'", TIMESERIES_API_URL, "https://www.googletagmanager.com", "https://www.google-analytics.com"),
        'frame-src': ("'none'",),
    }
}
