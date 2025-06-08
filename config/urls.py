#!/usr/bin/env python3
# config/urls.py

"""
URL Configuration for Timeseries Frontend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.contrib.sitemaps.views import sitemap
from timeseries.sitemap import sitemaps

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('timeseries.urls')),
    path('robots.txt', TemplateView.as_view(template_name="robots.txt", content_type="text/plain"), name='robots'),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
]

# Add debug toolbar URLs in development
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
    ]
    # Serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
