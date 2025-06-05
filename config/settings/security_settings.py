#!/usr/bin/env python3
# config/settings/security_settings.py

"""
Security settings for Timeseries Frontend project.
Automatically detects environment and applies appropriate security settings.
"""
import os

def is_production_environment():
    """
    Determine if the current environment is production.
    
    For Google Cloud Run, looks for GOOGLE_CLOUD_RUN environment variable.
    Also checks for other common production indicators.
    
    Returns:
        bool: True if production environment is detected
    """
    # Check for Google Cloud Run environment
    if os.environ.get('GOOGLE_CLOUD_RUN', '').lower() in ('true', '1', 'yes'):
        return True
    
    # Check for DEBUG flag (production should have DEBUG=False)
    if os.environ.get('DEBUG', '').lower() in ('false', '0', 'no'):
        return True
    
    # Check for specific hostnames that indicate production
    hostname = os.environ.get('HOSTNAME', '')
    if any(prod_indicator in hostname for prod_indicator in ('.appspot.com', '.run.app')):
        return True
    
    # Default to non-production for safety
    return False

# Determine environment
PRODUCTION = is_production_environment()

# Content Security Policy settings - consistent across environments
CSP_DEFAULT_SRC = ("'self'",)
CSP_STYLE_SRC = (
    "'self'", 
    "'unsafe-inline'",  # Required for Bootstrap
    "https://cdn.jsdelivr.net",
    "https://cdnjs.cloudflare.com",
    "https://fonts.googleapis.com"
)
CSP_SCRIPT_SRC = (
    "'self'", 
    "'unsafe-inline'",  # Required for inline scripts
    "https://cdn.jsdelivr.net",
    "https://cdn.plot.ly",
    "https://cdnjs.cloudflare.com",
    # "https://www.googletagmanager.com/gtag/"  # For Google Analytics if needed
)
CSP_FONT_SRC = (
    "'self'", 
    "https://cdn.jsdelivr.net",
    "https://fonts.googleapis.com", 
    "https://fonts.gstatic.com"
)
CSP_IMG_SRC = ("'self'", "data:")
CSP_CONNECT_SRC = (
    "'self'", 
    # Add the Timeseries API URL
    os.environ.get('TIMESERIES_API_URL', 'http://localhost:8001'),
    # "https://www.google-analytics.com"  # For Google Analytics if needed
)
CSP_FRAME_SRC = ("'none'",)  # Prevents the site from being embedded in a frame

# XSS Protection - consistent across environments
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS and Cookie Security - environment dependent
if PRODUCTION:
    # Production settings
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Log security configuration
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Production environment detected. Security settings ENHANCED for production.")
else:
    # Development settings
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    
    # Log security configuration
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Development environment detected. Security settings RELAXED for development.")
