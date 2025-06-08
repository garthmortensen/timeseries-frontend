#!/usr/bin/env python3
# timeseries/sitemap.py

"""
Sitemap configuration for the timeseries application.
"""

from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone


class StaticViewSitemap(Sitemap):
    """Sitemap for static pages."""
    priority = 0.5
    changefreq = 'weekly'
    protocol = 'https'

    def items(self):
        return [
            'timeseries:index',
            'timeseries:analysis', 
            'timeseries:about',
        ]

    def location(self, item):
        return reverse(item)

    def lastmod(self, item):
        # Return current date for static pages
        return timezone.now().date()

    def priority(self, item):
        # Set different priorities for different pages
        priorities = {
            'timeseries:index': 1.0,       # Homepage - highest priority
            'timeseries:analysis': 0.9,    # Main functionality - high priority
            'timeseries:about': 0.3,       # About page - lower priority
        }
        return priorities.get(item, 0.5)

    def changefreq(self, item):
        # Set different change frequencies
        frequencies = {
            'timeseries:index': 'weekly',
            'timeseries:analysis': 'monthly', 
            'timeseries:about': 'yearly',
        }
        return frequencies.get(item, 'monthly')


# Dictionary of all sitemaps for easy import
sitemaps = {
    'static': StaticViewSitemap,
}