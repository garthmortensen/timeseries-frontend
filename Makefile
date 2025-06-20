#
# === FILE META OPENING ===
# file: ./timeseries-frontend/Makefile
# role: config
# desc: build automation and Docker management commands for the frontend Django application with uv support
# === FILE META CLOSING ===
#

# ./Makefile
# Makefile for Timeseries Frontend Project

print-% : ; @echo $* = $($*)

PROJECT_NAME = timeseries-frontend
SHELL = /bin/bash
UV ?= uv
PYTHON ?= $(UV) run python
COMMIT_HASH = $(shell git log -1 --format=%h || echo "dev")
DJANGO_PORT ?= 8000
API_MOCK_PORT ?= 8001

# uv environment management
.PHONY: install
install:
	$(UV) sync

.PHONY: install-dev
install-dev:
	$(UV) sync --extra dev

.PHONY: update
update:
	$(UV) lock --upgrade
	$(UV) sync

.PHONY: add
add:
	$(UV) add $(PKG)

.PHONY: add-dev
add-dev:
	$(UV) add --optional dev $(PKG)

.PHONY: remove
remove:
	$(UV) remove $(PKG)

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
	$(PYTHON) -m pytest

.PHONY: test-coverage
test-coverage:
	$(PYTHON) -m pytest --cov=timeseries --cov-report=html --cov-report=term

.PHONY: static
static:
	$(PYTHON) manage.py collectstatic --noinput

# Code quality commands
.PHONY: format
format:
	$(UV) run black .

.PHONY: format-check
format-check:
	$(UV) run black --check .

.PHONY: lint
lint:
	$(UV) run flake8 .

.PHONY: check
check: format-check lint test

# Changelog and versioning commands
.PHONY: changelog
changelog:
	$(UV) run cz changelog

.PHONY: bump
bump:
	$(UV) run cz bump

.PHONY: commit
commit:
	$(UV) run cz commit

.PHONY: version
version:
	$(UV) run cz version

.PHONY: changelog-dry-run
changelog-dry-run:
	$(UV) run cz changelog --dry-run

# API Mock commands
.PHONY: run-api-mock
run-api-mock:
	cd api_mock && $(PYTHON) -m uvicorn api_mock:app --host 0.0.0.0 --port $(API_MOCK_PORT) --reload

# Application setup commands
.PHONY: setup-dev
setup-dev: install-dev migrate static
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

# Clean commands
.PHONY: clean
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf htmlcov/
	rm -rf .coverage

.PHONY: clean-all
clean-all: clean
	rm -rf .venv/
	rm -f uv.lock

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
	$(UV) run gunicorn --bind 0.0.0.0:$(DJANGO_PORT) config.wsgi:application

.PHONY: deploy-check
deploy-check:
	$(PYTHON) manage.py check --deploy

# Help command
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install          - Install dependencies"
	@echo "  install-dev      - Install dependencies including dev tools"
	@echo "  update           - Update dependencies and lock file"
	@echo "  add PKG=<n>   - Add a new dependency"
	@echo "  add-dev PKG=<n> - Add a new dev dependency"
	@echo "  remove PKG=<n> - Remove a dependency"
	@echo "  run-server       - Start Django development server"
	@echo "  migrate          - Run database migrations"
	@echo "  test             - Run tests with pytest"
	@echo "  test-coverage    - Run tests with coverage report"
	@echo "  format           - Format code with black"
	@echo "  lint             - Lint code with flake8"
	@echo "  check            - Run all code quality checks"
	@echo "  changelog        - Generate/update CHANGELOG.md"
	@echo "  bump             - Bump version and update changelog"
	@echo "  commit           - Interactive commit with conventional format"
	@echo "  version          - Show current version"
	@echo "  changelog-dry-run - Preview changelog changes"
	@echo "  docker-build     - Build Docker image"
	@echo "  docker-run       - Run Docker container"
	@echo "  setup-dev        - Complete development setup"
	@echo "  clean            - Clean Python cache files"
	@echo "  clean-all        - Clean everything including venv"

.PHONY: default
default: help
