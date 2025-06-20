# Changelog

All notable changes to the timeseries-frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Commitizen for automated changelog generation and conventional commits
- Comprehensive Makefile commands for changelog management

## [0.1.0] - 2025-06-20

### Added
- **Spillover Analysis Interface**: Complete redesign of analysis and results templates for spillover methodology 
- **Interactive UI Components**: Game-like loading screen with statistical Q&A
- **Server-side API Proxy**: Replace cross-origin API calls to support corporate networks
- **Google Analytics Integration**: Google Tag Manager support for analytics tracking
- **SEO and Social Media**: Open Graph images, meta content, and social media optimization
- **Security Features**: Network security with max values on symbol count and date ranges
- **Documentation**: Comprehensive sequence diagrams and analysis sliders
- **Static Assets**: High-resolution splash screen images, Lottie animations, and background waves
- **Sitemap and Robots**: SEO-friendly sitemap.xml and robots.txt configuration

### Features
- **Spillover Analysis**: Advanced spillover methodology with redesigned templates ⚠️ *BREAKING CHANGE*
- **Performance Optimization**: Max input value validation and improved quiz functionality
- **Responsive Design**: Enhanced styling with improved colors, typography, and layout
- **API Integration**: Updated endpoints to work with api.spilloverlab domain
- **Development Tools**: UV package manager integration replacing pip/venv workflow

### Fixed
- **Null Handling**: Fixed analysis.html to properly handle null significant_lags
- **500 Error Resolution**: Removed duplicate DJANGO_SETTINGS_MODULE in WSGI/ASGI files
- **Image Errors**: Resolved misnamed JPG file issues
- **API Consistency**: Removed trailing slashes from API endpoints for FastAPI compatibility

### Changed
- **Package Management**: Migrated from pip/venv to UV for dependency management
- **Requirements**: Rebuilt requirements.txt using pipreqs for cleaner dependencies
- **API Domain**: Updated all API references to api.spilloverlab
- **Host Configuration**: Updated allowed hosts for spilloverlabs.com deployment
- **Styling**: Improved language, typography, and visual design throughout

### Technical Improvements
- **Build System**: Added Commitizen for conventional commits and automated versioning
- **Logging**: Enhanced proxy logging for better troubleshooting
- **CORS**: Implemented server-side proxy to eliminate CORS issues
- **Documentation**: Improved sequence diagrams and added analysis guidance
- **Dependencies**: Unified requirements.txt across all repositories for monorepo consistency

### Deployment
- **Google Cloud Run**: Configured for Google Cloud Run deployment
- **Domain Setup**: Configured for spilloverlabs.com production environment
- **Static Files**: Optimized image quality and text sizing for production
- **Analytics**: Integrated Google Tag Manager for production analytics

## [0.0.1] - 2025-06-06

### Added
- Initial Django project setup
- Basic spillover analysis interface
- Google Cloud Run deployment configuration