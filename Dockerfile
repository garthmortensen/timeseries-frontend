# Use the official Python image
FROM python:3.13-slim

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

# Copy requirements file (as the user)
COPY --chown=djangoapp:djangoapp requirements.txt ./requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Install gunicorn for production
RUN pip install --no-cache-dir --user gunicorn

# Add .local/bin to PATH to ensure installed executables are found
ENV PATH="/home/djangoapp/.local/bin:${PATH}"

# Copy application files (as the user)
COPY --chown=djangoapp:djangoapp ./ /app

# Expose port 8000 for Django
EXPOSE 8000

# Set environment variable for API URL (example, adjust as needed)
ENV API_URL="http://timeseries-api:8000"

# Collect static files (already present)
RUN python manage.py collectstatic --noinput

# Run Django with gunicorn in production
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]

# Production deployment should use gunicorn:
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
