#!/usr/bin/env python3
# config/settings/asgi.py

"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""


import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project directory to path
project_path = Path(__file__).resolve().parent.parent
sys.path.append(str(project_path))

# Load environment variables from .env file
env_path = project_path / '.env'
load_dotenv(dotenv_path=env_path)

# Default to production settings for ASGI
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

from django.core.asgi import get_asgi_application

application = get_asgi_application()
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
