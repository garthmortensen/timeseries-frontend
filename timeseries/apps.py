#!/usr/bin/env python3
# timeseries/apps.py

from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class TimeseriesConfig(AppConfig):
    """
    Configuration for the timeseries application.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'timeseries'
    verbose_name = 'Time Series Analysis'
    
    def ready(self):
        """
        Django app ready hook - perform warmup to prevent first-call timeouts.
        """
        # Only run warmup in production (not during migrations, collectstatic, etc.)
        import sys
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv[0]:
            self.warmup_backend()
    
    def warmup_backend(self):
        """
        Warmup the backend API to prevent first-call timeouts.
        """
        try:
            from django.conf import settings
            import requests
            
            # Simple health check to warm up the backend
            backend_url = getattr(settings, 'TIMESERIES_API_URL', None)
            if backend_url:
                logger.info(f"Warming up backend API at {backend_url}")
                
                # Hit the root endpoint (health check) with a short timeout
                try:
                    response = requests.get(f"{backend_url}/", timeout=10)
                    logger.info(f"Backend warmup completed: {response.status_code}")
                except Exception as e:
                    logger.warning(f"Backend warmup failed (non-fatal): {e}")
            else:
                logger.warning("TIMESERIES_API_URL not configured, skipping warmup")
                
        except Exception as e:
            logger.warning(f"Warmup failed (non-fatal): {e}")
