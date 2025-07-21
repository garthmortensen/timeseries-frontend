# Changelog

All notable changes to the timeseries-frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


### Added
- Initial Django project setup
- Basic spillover analysis interface
- Google Cloud Run deployment configuration
## frontend-v0.10.0 (2025-07-21)

### Feat

- **static**: add static files

## frontend-v0.9.0 (2025-07-21)

### Feat

- **Background**: add api content to Background tab
- **arima**: add content to ARIMA tab
- **results-overview**: follow principles pyramid to restructure overview
- **results.html**: reworking results parsing from scratch
- **results**: quicksave before adding to api outputs all the config inputs

### Fix

- **pydantic**: update pydantic model with missing components so backend returns all expected keys
- **api-parse**: parse basic api content using jsonpaths
- **redirect**: analysis.html run analysis button starting loading spinner which redirects immediately to results.html
- **POST**: adjust post request for nested data
- **POST**: transform post request into nested structure with correct fields"
- **everything**: trying to make this thing work

## frontend-v0.8.0 (2025-07-05)

### Feat

- **results**: add model interpretations

## frontend-v0.7.0 (2025-07-03)

### Feat

- **results**: outline shell setup to populate with api return

## frontend-v0.6.0 (2025-07-01)

### Feat

- **results**: update interpretations, plots, data lineage

## frontend-v0.5.0 (2025-06-21)

### Feat

- **collapsible-results**: make results.html cards collapsible for easier review

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
