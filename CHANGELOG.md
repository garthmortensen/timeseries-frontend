# Changelog

All notable changes to the timeseries-frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


### Added
- Initial Django project setup
- Basic spillover analysis interface
- Google Cloud Run deployment configuration
## frontend-v0.4.0 (2025-06-21)

### Feat

- **debug-mode**: prevent development debug mode from interfering with production deployment

## frontend-v0.3.0 (2025-06-21)

### Feat

- **page-title**: update homepage title to match other pages

## frontend-v0.2.0 (2025-06-20)

### Feat

- **api**: add to analysis.html top of page api buttons which are otherwise located in about.html > api"
- **spillover**: finish implementing spillover
- **spillover**: redesign analysis and results templates for spillover methodology rework

### Fix

- **analysis.html**: handle when significant_lags is null
