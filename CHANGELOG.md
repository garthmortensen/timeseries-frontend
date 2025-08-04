# Changelog

All notable changes to the timeseries-frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


### Added
- Initial Django project setup
- Basic spillover analysis interface
- Google Cloud Run deployment configuration
## frontend-v0.12.0 (2025-08-03)

### Feat

- **causality**: populate page with more api content
- **style**: rename tabs, adjust styles
- **cache**: switch from cache to db, ensure pop() not used, while get() is
- **limit**: set frontend and backend parameters limits
- **favicon**: django collectstatic
- **favicon**: add favicon and related base.html change
- **log**: add logging to find root cause
- **logging**: add additional clarity
- **logging**: increase logging details to determine why json response not parsing
- **constraints**: add js constraints for time and symbols
- **analysis**: add input constraints on backend
- **results**: parse and design results tabs
- **overview**: improve garch content
- **overview**: improve arima
- **QA**: add more QA
- **json-download**: add timestamp to filename
- **provenance**: add provenance back in
- **garch**: parse garch api for garch tab
- **logs**: adding logs back in
- **plots**: fix series visualizations
- **loading**: carve loading spinner js out of analysis.html
- **analysis**: restore language, guide-text

### Fix

- **debug**: skip debug toolbar in prod
- **debug**: adjust debug logic for production
- **db**: add migrate to dockerfile for db table support
- **api_url**: update assignments
- **cache**: successfully replace sqlite with in-memory to support stateless cloud containers
- **logs**: greater clarity
- **db**: replace sqlite with in-memory
- **proxy**: remove proxy
- **plots**: extend plots to fill horizontal width
- **Export-CSV**: fix button functionality
- **results**: fix Export CSV spinner so it doesnt spin automatically
- **settings**: adjust for localhost and dev.spillover and www.spillover
- **production**: still not working
- **production**: working on dev
- **production**: adjust code to allow dev

## frontend-v0.11.1 (2025-07-21)

### Fix

- **production**: make config more flexible for dev.spilloverlab.com
- **x_forward_host**: setup x_forwarded_host to enable dev.spilloverlab.com
- **config**: adjust comment

## frontend-v0.11.0 (2025-07-21)

### Feat

- **htmx**: update htmx version and crossorigin and integrity

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
