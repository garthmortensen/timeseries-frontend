import os

# Gunicorn configuration file for Cloud Run deployment
# This fixes the 30-second worker timeout that was causing 500 errors

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '8080')}"

# Worker processes
workers = 2
threads = 1

# Timeout settings - key fix for the 30s timeout issue
timeout = 180          # Worker timeout (3 minutes)
graceful_timeout = 180 # Graceful shutdown timeout
keepalive = 5         # Keep connections alive

# Application preloading
preload_app = True    # Load application code before forking workers

# Logging
log_level = "info"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "timeseries-frontend"

# Worker class (default sync is fine for Django)
worker_class = "sync"

# Maximum requests per worker before restart
max_requests = 1000  # Maximum number of requests a worker can handle before being restarted
max_requests_jitter = 100  # Random jitter added to max_requests to prevent thundering herd problem, which is when many workers restart simultaneously
