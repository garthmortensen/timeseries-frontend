# Use the official Python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

# Install only essential system dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create a non-root user
ARG USER_ID=1000
ARG GROUP_ID=1000
RUN groupadd -g ${GROUP_ID} djangoapp && \
    useradd -m -u ${USER_ID} -g ${GROUP_ID} -s /bin/bash djangoapp

# Set working directory and give our user ownership
WORKDIR /app
RUN mkdir -p /app && chown djangoapp:djangoapp /app

# Create required directories
RUN mkdir -p /app/logs /app/staticfiles /app/media
RUN chown -R djangoapp:djangoapp /app

# Switch to non-root user
USER djangoapp

# Enable bytecode compilation for performance
ENV UV_COMPILE_BYTECODE=1
# Cache optimization for Docker builds
ENV UV_LINK_MODE=copy

# Copy dependency files
COPY --chown=djangoapp:djangoapp pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen --no-dev

# Copy application files (as the user)
COPY --chown=djangoapp:djangoapp ./ /app

# Expose port 8080 for Cloud Run (but use PORT env var at runtime)
EXPOSE 8080

# Set environment variable for API URL (example, adjust as needed)
ENV API_URL="http://timeseries-api:8080"

# Collect static files using uv run
RUN uv run python manage.py collectstatic --noinput

# Run database migrations to ensure tables exist
RUN uv run python manage.py migrate --noinput

# Use gunicorn with configuration file for Cloud Run compatibility
CMD uv run gunicorn --config gunicorn.conf.py config.wsgi:application
