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

# Add .local/bin to PATH to ensure installed executables are found
ENV PATH="/home/djangoapp/.local/bin:${PATH}"

# Copy application files (as the user)
COPY --chown=djangoapp:djangoapp ./ /app

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Command to run the Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Production deployment should use gunicorn:
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
