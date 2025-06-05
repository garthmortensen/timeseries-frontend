#
# === FILE META OPENING ===
# file: ./timeseries-frontend/Makefile
# role: config
# desc: build automation and Docker management commands for the frontend Django application
# === FILE META CLOSING ===
#

# ./Makefile
# Makefile for Timeseries Frontend Project

print-% : ; @echo $* = $($*)

PROJECT_NAME = timeseries-frontend
SHELL = /bin/bash
PYTHON ?= $(shell command -v python3 || command -v python)
COMMIT_HASH = $(shell git log -1 --format=%h || echo "dev")
DJANGO_PORT ?= 8000
API_MOCK_PORT ?= 8001

# Docker commands
.PHONY: docker-clean
docker-clean:
	docker container prune -f
	docker image prune -f
	docker network prune -f
	docker volume prune -f

.PHONY: docker-build
docker-build:
	docker build --build-arg USER_ID=$(shell id -u) --build-arg GROUP_ID=$(shell id -g) -t $(PROJECT_NAME):latest -t $(PROJECT_NAME):$(COMMIT_HASH) .

.PHONY: docker-run
docker-run:
	docker run -d -p $(DJANGO_PORT):$(DJANGO_PORT) --name $(PROJECT_NAME)-container $(PROJECT_NAME):latest

.PHONY: docker-run-interactive
docker-run-interactive:
	docker run -it --user $(shell id -u):$(shell id -g) -v $(shell pwd):/app:Z -p $(DJANGO_PORT):$(DJANGO_PORT) --name $(PROJECT_NAME)-interactive $(PROJECT_NAME):latest /bin/bash

.PHONY: docker-stop
docker-stop:
	docker stop $(PROJECT_NAME)-container || true

.PHONY: docker-rm
docker-rm:
	docker rm $(PROJECT_NAME)-container || true

# Docker Compose commands
.PHONY: compose-up
compose-up:
	docker-compose up -d

.PHONY: compose-down
compose-down:
	docker-compose down

.PHONY: compose-logs
compose-logs:
	docker-compose logs -f

# Django development commands
.PHONY: run-server
run-server:
	$(PYTHON) manage.py runserver 0.0.0.0:$(DJANGO_PORT)

.PHONY: migrations
migrations:
	$(PYTHON) manage.py makemigrations

.PHONY: migrate
migrate:
	$(PYTHON) manage.py migrate

.PHONY: shell
shell:
	$(PYTHON) manage.py shell

.PHONY: test
test:
	$(PYTHON) manage.py test

.PHONY: static
static:
	$(PYTHON) manage.py collectstatic --noinput

# API Mock commands
.PHONY: run-api-mock
run-api-mock:
	cd api_mock && $(PYTHON) -m uvicorn api_mock:app --host 0.0.0.0 --port $(API_MOCK_PORT) --reload

# Application setup commands
.PHONY: setup-dev
setup-dev: venv install migrate static
	@echo "Development environment setup complete!"

# Environment management
.PHONY: create-env-file
create-env-file:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created from template"; \
	else \
		echo ".env file already exists"; \
	fi

# Update dependencies
.PHONY: update-deps
update-deps:
	@echo "Updating dependencies to latest versions..."
	@if [ -d "venv" ]; then \
		echo "Activating virtual environment..."; \
		. venv/bin/activate && \
		$(PYTHON) -m pip install --upgrade pip && \
		$(PYTHON) -m pip install --upgrade -r requirements.txt && \
		echo "Generating new requirements.txt with updated dependencies..." && \
		$(PYTHON) -m pip freeze > requirements.txt && \
		echo "Dependencies updated."; \
	else \
		echo "Virtual environment 'venv' not found."; \
	fi

# Rebuild shortcuts
.PHONY: rebuild
rebuild: docker-stop docker-rm docker-clean docker-build docker-run

.PHONY: rebuild-compose
rebuild-compose: compose-down docker-clean
	docker-compose build
	docker-compose up -d

# Production commands
.PHONY: gunicorn
gunicorn:
	gunicorn --bind 0.0.0.0:$(DJANGO_PORT) config.wsgi:application

.PHONY: deploy-check
deploy-check:
	$(PYTHON) manage.py check --deploy
