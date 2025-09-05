# Spillover Lab Frontend

## Overview

```ascii
  ███████╗██████╗ ██╗██╗     ██╗      ██████╗ ██╗   ██╗███████╗██████╗ 
  ██╔════╝██╔══██╗██║██║     ██║     ██╔═══██╗██║   ██║██╔════╝██╔══██╗
  ███████╗██████╔╝██║██║     ██║     ██║   ██║██║   ██║█████╗  ██████╔╝
  ╚════██║██╔═══╝ ██║██║     ██║     ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗
  ███████║██║     ██║███████╗███████╗╚██████╔╝ ╚████╔╝ ███████╗██║  ██║
  ╚══════╝╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝
                           ██╗      █████╗ ██████╗
                           ██║     ██╔══██╗██╔══██╗
                           ██║     ███████║██████╔╝
                           ██║     ██╔══██║██╔══██╗
                           ███████╗██║  ██║██████╔╝
                           ╚══════╝╚═╝  ╚═╝╚═════╝
```                   

A Django frontend for spillover analysis and time series modeling.

Implementation hosted at www.spilloverlab.com.

## Features

- User-friendly interface for time series analysis
- Interactive charts with Plotly
- Dropdown selection for different indices
- Display for model statistics and forecasts
- API integration with the backend pipeline
- User authentication and saved analysis

## API Design Lessons Learned

### Monolithic Response Anti-Pattern

I regretably created a single, large API endpoint that returns all analysis results in one massive JSON response.

This is a mistake because:

- It violates the **Single Responsibility Principle** - the endpoint does too much
- Poor **performance** - clients must wait for all data even if they only need specific sections
- **Tight coupling** between frontend tabs and backend data structure

**Better approach:**

```http
# Instead of:
GET /api/analysis/complete  # Returns everything

# Use resource-specific endpoints:
GET /api/analysis/{id}/summary
GET /api/analysis/{id}/forecasts  
GET /api/analysis/{id}/statistics
GET /api/analysis/{id}/diagnostics
```

**Frontend benefits of the improved design:**

- **Lazy loading** - load each tab's data only when needed
- **Parallel requests** - fetch multiple resources simultaneously with Promise.all()

## Usage notes

Use 250, 500 obs for ARCH, GARCH.
> Considering the size of biases and convergence errors, it is proposed that at least 250 observations are needed for ARCH(1) models and 500 observations for GARCH(1,1) models. [Small sample properties of GARCH estimates and persistence](https://www.tandfonline.com/doi/abs/10.1080/13518470500039436)

### Integration Overview

```mermaid
flowchart TB
    %% Styling
    classDef person fill:#7B4B94,color:#fff,stroke:#5D2B6D,stroke-width:1px
    classDef agent fill:#7B4B94,color:#fff,stroke:#5D2B6D,stroke-width:1px
    classDef system fill:#1168BD,color:#fff,stroke:#0B4884,stroke-width:1px
    classDef external fill:#999999,color:#fff,stroke:#6B6B6B,stroke-width:1px
    classDef database fill:#2E7C8F,color:#fff,stroke:#1D4E5E,stroke-width:1px
    classDef publishing fill:#E67E22,color:#fff,stroke:#D35400,stroke-width:1px
    
    %% Actors and Systems
    User((User)):::person
    AIAgent((AI Agent)):::agent
    
    %% Main Systems
    TimeSeriesFrontend["Frontend App"]:::system
    TimeSeriesPipeline["RESTful Pipeline"]:::system
    MCPServer["MCP Server"]:::system
    TimeseriesCompute["Timeseries-Compute 
    Python Package"]:::system
    
    %% Database
    TimeSeriesDB[("Relational database")]:::database
    
    %% External Systems
    ExternalDataSource[(Yahoo Finance / Stooq)]:::external
    
    %% Publishing Platforms
    PublishingPlatforms["
    GitHub
    Docker Hub
    Google Cloud Run
    PyPI
    Read the Docs"]:::publishing
    
    %% Relationships
    User -- "Uses UI" --> TimeSeriesFrontend
    AIAgent -- "Natural language requests" --> MCPServer
    TimeSeriesFrontend -- "Makes API calls to" --> TimeSeriesPipeline
    MCPServer -- "Makes API calls to" --> TimeSeriesPipeline
    TimeSeriesPipeline -- "Inserts results into" --> TimeSeriesDB
    TimeSeriesPipeline -- "imports" --> TimeseriesCompute
    User -- "pip install" --> TimeseriesCompute
    AIAgent -- "pip install" --> TimeseriesCompute
    ExternalDataSource -- "Provides time series data" --> TimeSeriesPipeline
    
    %% Publishing relationships (simplified)
    TimeSeriesFrontend  --> PublishingPlatforms
    TimeSeriesPipeline --> PublishingPlatforms
    TimeseriesCompute --> PublishingPlatforms
```

### Additional (C4) Architectural Diagrams

Each level of a C4 diagram provides a different level of zoom. This helps users understand the frontend project at the most-useful granularity.

#### Level 2: Container Diagram

Zooms in to show the major building blocks/"containers". The frontend is a Django web application that serves HTML/CSS/JS to users and communicates with the backend API. It's containerized for deployment and includes a CI/CD pipeline for automated testing.

```mermaid
flowchart TB
    %% Styling
    classDef person fill:#08427B,color:#fff,stroke:#052E56,stroke-width:1px
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:1px
    classDef external fill:#999999,color:#fff,stroke:#6B6B6B,stroke-width:1px
    classDef system fill:#1168BD,color:#fff,stroke:#0B4884,stroke-width:1px
    
    %% Person
    User((User)):::person
    
    %% System boundary
    subgraph SpilloverLabFrontend["Spillover Lab Frontend System"]
        DjangoApp["Django Web Application<br>[Python]<br>Serves web interface"]:::container
        StaticFiles["Static Assets<br>[CSS/JS/Images]<br>Styling and interactivity"]:::container
        Templates["HTML Templates<br>[Django Templates]<br>Dynamic content rendering"]:::container
        Database["SQLite Database<br>[File]<br>User sessions and data"]:::container
        DockerContainer["Docker Container<br>[Linux]<br>Containerized deployment"]:::container
        CIpipeline["CI/CD Pipeline<br>[GitHub Actions]<br>Automated testing"]:::container
    end
    
    %% External Systems
    TimeSeriesAPI[(Time Series API<br>FastAPI Backend)]:::external
    CloudRun[Google Cloud Run<br>Production Hosting]:::external
    
    %% Relationships
    User -- "Interacts with [HTTPS]" --> DjangoApp
    DjangoApp -- "Serves" --> StaticFiles
    DjangoApp -- "Renders" --> Templates
    DjangoApp -- "Stores sessions in" --> Database
    DjangoApp -- "Makes API calls to [HTTP/JSON]" --> TimeSeriesAPI
    DjangoApp -- "Packaged into" --> DockerContainer
    CIpipeline -- "Builds and tests" --> DockerContainer
    DockerContainer -- "Deployed to" --> CloudRun
```

#### Level 3: Component Diagram

Look inside the Django application to see the key components. We can see the views handling user requests, the API client communicating with the backend, and various utilities for plotting and template processing.

```mermaid
flowchart TB
    %% Styling
    classDef person fill:#08427B,color:#fff,stroke:#052E56,stroke-width:1px
    classDef component fill:#85BBF0,color:#000,stroke:#5D82A8,stroke-width:1px
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:1px
    classDef external fill:#999999,color:#fff,stroke:#6B6B6B,stroke-width:1px
    
    %% Person
    User((User)):::person
    
    %% Django Container
    subgraph DjangoApp["Django Web Application"]
        URLDispatcher["URL Dispatcher<br>[Django URLs]<br>Routes requests"]:::component
        Views["Views Controller<br>[Python]<br>Handles HTTP requests"]:::component
        APIClient["API Client<br>[Python]<br>Communicates with backend"]:::component
        PlottingUtils["Plotting Utilities<br>[Python/Plotly]<br>Generates charts"]:::component
        ContextProcessors["Context Processors<br>[Python]<br>Template context data"]:::component
        TemplateEngine["Template Engine<br>[Django Templates]<br>Renders HTML"]:::component
        StaticFileHandler["Static File Handler<br>[WhiteNoise]<br>Serves CSS/JS/Images"]:::component
        SecurityMiddleware["Security Middleware<br>[Django/CSP]<br>Security headers"]:::component
        
        %% Component relationships
        URLDispatcher --> Views
        Views --> APIClient
        Views --> PlottingUtils
        Views --> ContextProcessors
        Views --> TemplateEngine
        TemplateEngine --> StaticFileHandler
        URLDispatcher --> SecurityMiddleware
    end
    
    %% External
    SettingsConfig[(Django Settings<br>Configuration)]:::external
    TimeSeriesBackend[(Time Series API)]:::external
    
    %% Relationships
    User -- "Sends HTTP requests to" --> URLDispatcher
    ContextProcessors -- "Reads from" --> SettingsConfig
    APIClient -- "Makes REST calls to" --> TimeSeriesBackend
    SecurityMiddleware -- "Enforces policies from" --> SettingsConfig
```

#### Level 4: Code/Class Diagram

Shows the main classes and models involved in the Django frontend, including view classes that handle different pages, the API client for backend communication, and utility classes for data visualization.

```mermaid
classDiagram
    %% Main Django Classes
    class SpilloverLabConfig {
        +name: str
        +default_auto_field: str
        +ready()
    }
    
    %% View Classes
    class TimeSeriesViews {
        +index(request)
        +analysis(request)
        +results(request)
        +about(request)
        +debug_results(request)
    }
    
    %% API Communication
    class APIClient {
        +base_url: str
        +timeout: int
        +session: requests.Session
        +get_health()
        +generate_data(params)
        +fetch_market_data(symbols, dates)
        +test_stationarity(data)
        +run_arima(data, params)
        +run_garch(data, params)
        +run_spillover_analysis(data, params)
        +run_full_pipeline(pipeline_params)
        +_make_request(method, endpoint, data)
        +_handle_response(response)
    }
    
    %% Plotting and Visualization
    class PlottingUtils {
        +create_time_series_plot(data, title)
        +create_spillover_heatmap(spillover_matrix)
        +create_forecast_plot(historical, forecast)
        +create_stationarity_plot(test_results)
        +create_model_diagnostics(model_results)
        +_configure_plot_layout(fig, title)
        +_add_plotly_config()
    }
    
    %% Context Processors
    class ContextProcessors {
        +api_url_processor(request)
        +user_preferences_processor(request)
        +debug_processor(request)
    }
    
    %% Models (if any)
    class UserPreferences {
        +user: ForeignKey
        +default_symbols: JSONField
        +preferred_models: JSONField
        +chart_preferences: JSONField
        +created_at: DateTimeField
        +updated_at: DateTimeField
    }
    
    class AnalysisSession {
        +session_id: CharField
        +parameters: JSONField
        +results: JSONField
        +created_at: DateTimeField
        +expires_at: DateTimeField
    }
    
    %% Template Tags
    class DictExtrasTemplateTags {
        +get_item(dictionary, key)
        +get_nested_item(dictionary, path)
        +format_number(value, decimals)
        +to_json(data)
    }
    
    %% Forms (for analysis input)
    class AnalysisForm {
        +data_source: ChoiceField
        +symbols: CharField
        +start_date: DateField
        +end_date: DateField
        +arima_p: IntegerField
        +arima_d: IntegerField
        +arima_q: IntegerField
        +garch_p: IntegerField
        +garch_q: IntegerField
        +spillover_window: IntegerField
        +clean()
        +save()
    }
    
    %% URL Configuration
    class URLPatterns {
        +app_name: str
        +urlpatterns: List
        +index_url()
        +analysis_url()
        +results_url()
        +about_url()
        +debug_url()
    }
    
    %% Settings Classes
    class BaseSettings {
        +SECRET_KEY: str
        +DEBUG: bool
        +ALLOWED_HOSTS: List
        +INSTALLED_APPS: List
        +MIDDLEWARE: List
        +TEMPLATES: List
        +DATABASES: Dict
        +TIMESERIES_API_URL: str
    }
    
    class SecuritySettings {
        +SECURE_SSL_REDIRECT: bool
        +SESSION_COOKIE_SECURE: bool
        +CSRF_COOKIE_SECURE: bool
        +CSP_DEFAULT_SRC: Tuple
        +CSP_SCRIPT_SRC: Tuple
        +CSP_STYLE_SRC: Tuple
        +is_production_environment()
    }
    
    %% Exception Classes
    class APIClientException {
        +message: str
        +status_code: int
        +response_data: dict
    }
    
    class APIConnectionError {
        +timeout: float
        +endpoint: str
    }
    
    %% Data Transfer Objects
    class PipelineRequest {
        +source_type: str
        +symbols: List[str]
        +date_range: Dict
        +model_params: Dict
        +to_dict()
        +from_form(form_data)
    }
    
    class PipelineResponse {
        +status: str
        +data: Dict
        +stationarity_results: Dict
        +arima_results: Dict
        +garch_results: Dict
        +spillover_results: Dict
        +charts: Dict
        +is_successful()
        +get_chart_data(chart_type)
    }
    
    %% Relationships
    TimeSeriesViews --> APIClient: uses
    TimeSeriesViews --> PlottingUtils: uses
    TimeSeriesViews --> AnalysisForm: processes
    TimeSeriesViews --> PipelineRequest: creates
    TimeSeriesViews --> PipelineResponse: handles
    
    APIClient --> APIClientException: raises
    APIClient --> APIConnectionError: raises
    APIClient --> PipelineRequest: accepts
    APIClient --> PipelineResponse: returns
    
    PlottingUtils --> PipelineResponse: visualizes
    
    ContextProcessors --> BaseSettings: reads
    
    AnalysisForm --> PipelineRequest: converts to
    
    URLPatterns --> TimeSeriesViews: routes to
    
    BaseSettings <|-- SecuritySettings: extends
    
    APIClientException <|-- APIConnectionError: extends
    
    UserPreferences --> AnalysisForm: provides defaults
    AnalysisSession --> PipelineResponse: stores
```

## Architecture

- Django REST and GraphQL Framework
- Plotly for visualizations interactive results
- Responsive Bootstrap design
- Django forms for user input, styled as a wizard

## Project Structure

```text
timeseries-frontend/.................
├── manage.py                       # Django management script
├── requirements.txt                # Python dependencies
├── Makefile                        # Development automation tasks
├── README.md                       # Project documentation
├── .env.example                    # Environment variables template
├── design_decisions.md             # Architecture and design rationale
├── config/..........................
│   ├── __init__.py                 # Makes config module importable
│   ├── settings.py                 # Main Django settings entry point
│   ├── urls.py                     # Root URL configuration
│   ├── wsgi.py                     # WSGI application entry point
│   ├── asgi.py                     # ASGI application entry point
│   └── settings/....................
│       ├── __init__.py             # Settings package initializer
│       ├── base.py                 # Common settings for all environments
│       ├── development.py          # Development-specific settings
│       ├── production.py           # Production-specific settings
│       └── security_settings.py    # Security configurations
├── timeseries/......................
│   ├── __init__.py                 # Makes timeseries app importable
│   ├── admin.py                    # Django admin configuration
│   ├── apps.py                     # Django app configuration
│   ├── models.py                   # Database models
│   ├── views.py                    # View controllers
│   ├── urls.py                     # App-specific URL patterns
│   ├── api_client.py               # Backend API communication
│   ├── context_processors.py       # Template context processors
│   ├── plotting_utils.py           # Chart and visualization utilities
│   ├── tests.py                    # Unit tests
│   ├── migrations/                 # Database migration files
│   └── templatetags/               # Custom template tags
├── templates/.......................
│   ├── base.html                   # Base template with common layout
│   └── timeseries/
│       ├── index.html              # Homepage template
│       ├── analysis.html           # Analysis form template
│       ├── results.html            # Results display template
│       ├── about.html              # About page template
│       └── debug_results.html      # Debug information template
├── static/..........................
│   ├── css/
│   │   └── style.css               # Custom CSS styles
│   ├── js/
│   │   └── main.js                 # Custom JavaScript
│   ├── favicon/                    # Favicon files
│   └── images/                     # Static images
├── logs/............................
│   └── app.log                     # Application logs (rotating)
└── stub.github/workflows/...........
    └── cicd.yml                    # CI/CD pipeline configuration
```

## Getting Started

```bash
# Clone the repository
git https://github.com/garthmortensen/timeseries-frontend
cd timeseries-frontend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

## Deployment

Deploy frontend using:

- Docker containers
- Google Cloud Run


## Design Principles

- Clean, intuitive user interface
- Mobile-responsive design
- Clear presentation of model setup and results
- Simple English guide to model setup and interpretation
- Accessible visualization options
- Efficient API usage to minimize transfers
- Architected using microservices

### Enhanced Spillover Analysis Flow

The spillover analysis process has been significantly enhanced with multi-level significance testing and improved interpretations:

```mermaid
flowchart TD
    %% Styling
    classDef input fill:#E8F4FD,color:#000,stroke:#1E88E5,stroke-width:2px
    classDef process fill:#FFF3E0,color:#000,stroke:#FF9800,stroke-width:2px
    classDef analysis fill:#F3E5F5,color:#000,stroke:#9C27B0,stroke-width:2px
    classDef output fill:#E8F5E8,color:#000,stroke:#4CAF50,stroke-width:2px
    classDef enhanced fill:#FFEBEE,color:#000,stroke:#F44336,stroke-width:3px
    
    %% Input Data
    TimeSeriesData[("Time Series Data<br/>Returns DataFrame")]:::input
    
    %% Data Preparation
    DataValidation["Data Validation<br/>• Check for missing values<br/>• Ensure sufficient observations<br/>• Validate datetime index"]:::process
    
    NumericSelection["Select Numeric Columns<br/>• Filter non-numeric data<br/>• Prepare for VAR modeling"]:::process
    
    %% VAR Model Setup
    LagSelection["Optimal Lag Selection<br/>• Calculate safe max lag<br/>• Use AIC criterion<br/>• Ensure stability"]:::process
    
    VARFitting["VAR Model Fitting<br/>• Fit VAR(p) model<br/>• Validate model stability<br/>• Extract coefficients"]:::analysis
    
    %% Spillover Analysis
    FEVDCalculation["FEVD Calculation<br/>• Forecast Error Variance Decomposition<br/>• Calculate spillover matrix<br/>• Generate directional spillovers"]:::analysis
    
    SpilloverMetrics["Spillover Metrics<br/>• Total Spillover Index<br/>• Directional Spillovers<br/>• Net Spillovers<br/>• Pairwise Spillovers"]:::analysis
    
    %% Enhanced Granger Causality
    GrangerEnhanced["🆕 Enhanced Granger Causality<br/>• Multi-level significance (1%, 5%)<br/>• Optimal lag detection<br/>• Comprehensive p-value analysis<br/>• Robust test statistics"]:::enhanced
    
    %% Results and Interpretations
    SpilloverResults["Spillover Results<br/>• Spillover indices<br/>• FEVD table<br/>• Network effects"]:::output
    
    GrangerResults["🆕 Multi-Level Granger Results<br/>• Highly significant (1% level)<br/>• Significant (5% level)<br/>• Optimal lags per relationship<br/>• Minimum p-values"]:::enhanced
    
    InterpretationEngine["🆕 Enhanced Interpretation Engine<br/>• Business-relevant explanations<br/>• Market context analysis<br/>• Risk assessment insights<br/>• Trading implications"]:::enhanced
    
    %% Final Output
    ComprehensiveReport["Comprehensive Analysis Report<br/>• Spillover analysis<br/>• Causality relationships<br/>• Human-readable interpretations<br/>• Actionable insights"]:::output
    
    %% Flow connections
    TimeSeriesData --> DataValidation
    DataValidation --> NumericSelection
    NumericSelection --> LagSelection
    LagSelection --> VARFitting
    VARFitting --> FEVDCalculation
    VARFitting --> GrangerEnhanced
    FEVDCalculation --> SpilloverMetrics
    SpilloverMetrics --> SpilloverResults
    GrangerEnhanced --> GrangerResults
    SpilloverResults --> InterpretationEngine
    GrangerResults --> InterpretationEngine
    InterpretationEngine --> ComprehensiveReport
```

### Granger Causality Enhancement Details

The enhanced Granger causality testing provides more robust and actionable results:

```mermaid
flowchart LR
    %% Styling
    classDef input fill:#E3F2FD,color:#000,stroke:#2196F3,stroke-width:2px
    classDef test fill:#FFF8E1,color:#000,stroke:#FFC107,stroke-width:2px
    classDef result fill:#E8F5E8,color:#000,stroke:#4CAF50,stroke-width:2px
    classDef enhanced fill:#FFEBEE,color:#000,stroke:#F44336,stroke-width:3px
    
    subgraph "Market Pair Analysis"
        SeriesPair["Market Pair<br/>X → Y"]:::input
    end
    
    subgraph "🆕 Multi-Level Testing"
        Test1pct["1% Significance Test<br/>α = 0.01<br/>High Confidence"]:::enhanced
        Test5pct["5% Significance Test<br/>α = 0.05<br/>Standard Confidence"]:::enhanced
        OptimalLag["Optimal Lag Detection<br/>Best predictive lag<br/>Minimize p-value"]:::enhanced
    end
    
    subgraph "Enhanced Results"
        Result1pct["⭐ Highly Significant<br/>Strong predictive power<br/>Robust relationship"]:::result
        Result5pct["✓ Significant<br/>Meaningful relationship<br/>Standard confidence"]:::result
        ResultNone["✗ No Significance<br/>No predictive power<br/>Independent series"]:::result
    end
    
    subgraph "🆕 Business Interpretation"
        LeadingIndicator["Leading Indicator<br/>X predicts Y movements<br/>Trading opportunity"]:::enhanced
        MarketEfficiency["Market Efficiency<br/>No predictable patterns<br/>Random walk hypothesis"]:::enhanced
        RiskManagement["Risk Management<br/>Contagion effects<br/>Diversification impact"]:::enhanced
    end
    
    %% Connections
    SeriesPair --> Test1pct
    SeriesPair --> Test5pct
    SeriesPair --> OptimalLag
    
    Test1pct --> Result1pct
    Test5pct --> Result5pct
    Test1pct -.-> ResultNone
    Test5pct -.-> ResultNone
    
    Result1pct --> LeadingIndicator
    Result5pct --> LeadingIndicator
    ResultNone --> MarketEfficiency
    Result1pct --> RiskManagement
    Result5pct --> RiskManagement
```
