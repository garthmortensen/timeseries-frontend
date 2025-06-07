from django.conf import settings

def api_url_processor(request):
    """
    Makes the TIMESERIES_API_URL setting available in templates.
    """
    return {'TIMESERIES_API_URL': settings.TIMESERIES_API_URL}
