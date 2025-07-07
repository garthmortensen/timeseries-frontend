/*
# === FILE META OPENING ===
# file: ./timeseries-frontend/static/js/results.js
# role: frontend
# desc: This file is responsible for fetching and rendering the analysis results on the results page.
# === FILE META CLOSING ===
*/

console.log("Results page JavaScript starting...");

// Global variables
let processedResults = null;
let rawApiResponse = null;

// Download API Response Button
document.getElementById('download-api-response-btn').addEventListener('click', function() {
    const resultsJson = sessionStorage.getItem('analysisResults');
    if (!resultsJson) {
        alert('No analysis results found in session storage. Please run an analysis first.');
        return;
    }
    
    try {
        const results = JSON.parse(resultsJson);
        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const now = new Date();
        const timestamp = now.getFullYear() + '-' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(now.getDate()).padStart(2, '0') + ' ' +
                         String(now.getHours()).padStart(2, '0') + ':' +
                         String(now.getMinutes()).padStart(2, '0') + ':' +
                         String(now.getSeconds()).padStart(2, '0') + ' UTC';
        const exportName = `api_response_${timestamp.replace(/[: ]/g, '_')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        console.log('API response downloaded:', exportName);
        
        // Show success message
        const button = document.getElementById('download-api-response-btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i> Downloaded!';
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-primary');
        }, 2000);
        
    } catch (error) {
        console.error('Error downloading API response:', error);
        alert('Error downloading API response: ' + error.message);
    }
});

// View API Response Button
document.getElementById('view-api-response-btn').addEventListener('click', function() {
    const resultsJson = sessionStorage.getItem('analysisResults');
    if (!resultsJson) {
        alert('No analysis results found in session storage. Please run an analysis first.');
        return;
    }
    
    try {
        const results = JSON.parse(resultsJson);
        const formattedJson = JSON.stringify(results, null, 2);
        
        document.getElementById('json-content').textContent = formattedJson;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('jsonModal'));
        modal.show();
        
        console.log('API response keys:', Object.keys(results));
        
    } catch (error) {
        console.error('Error displaying API response:', error);
        alert('Error displaying API response: ' + error.message);
    }
});

// Copy JSON to Clipboard Button
document.getElementById('copy-json-btn').addEventListener('click', function() {
    const jsonContent = document.getElementById('json-content').textContent;
    
    navigator.clipboard.writeText(jsonContent).then(function() {
        const button = document.getElementById('copy-json-btn');
        const originalText = button.innerHTML;
        button.innerHTML = 'Copied!';
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
            button.classList.add('btn-primary');
        }, 2000);
        
    }).catch(function(err) {
        console.error('Error copying to clipboard:', err);
        alert('Error copying to clipboard. Please select and copy manually.');
    });
});

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
    console.log("Results page loaded, checking for analysis results...");
    
    // Check if results exist in sessionStorage
    const resultsJson = sessionStorage.getItem('analysisResults');
    if (!resultsJson) {
        console.log("No analysis results found in sessionStorage");
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('results-container').style.display = 'none';
        return;
    }
    
    let results;
    try {
        results = JSON.parse(resultsJson);
        rawApiResponse = results;
        console.log("Results data loaded:", Object.keys(results));
    } catch (error) {
        console.error("Error parsing JSON:", error);
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('results-container').style.display = 'none';
        return;
    }
    
    // Show results container
    document.getElementById('no-results').style.display = 'none';
    document.getElementById('results-container').style.display = 'block';
    
    // Use server-processed results if available, otherwise fall back to client-side processing
    if (results.processed_results) {
        console.log("Using server-processed results");
        processedResults = results.processed_results;
        
        // Add compatibility layer for models tab
        if (processedResults.arima_results && !processedResults.models) {
            processedResults.models = {
                arima: processedResults.arima_results.results || {},
                garch: processedResults.garch_results?.results || {},
                var: results.var_results || {}
            };
        }
    } else {
        console.log("Server-processed results not available, using client-side processing");
        processedResults = processResultsClientSide(results);
    }
    
    initializeResultsDisplay();
});

function initializeResultsDisplay() {
    if (!processedResults) {
        console.error("No processed results available");
        return;
    }
    
    console.log("Initializing results display with processed data");
    
    // Initialize each tab
    initializeOverviewTab();
    initializeExecutionConfigTab();
    initializePlotsTab();
    initializeStatisticalTestsTab();
    initializeModelsTab();
    initializeSpilloverAnalysisTab();
    initializeRawDataTab();
    initializeNextStepTab();
    
    // Handle URL parameters for direct tab navigation
    handleUrlNavigation();
    
    console.log("Results display initialization complete");
}

function initializeOverviewTab() {
    if (!processedResults.overview) return;
    
    const overview = processedResults.overview;
    
    // Populate executive summary
    const executiveSummaryContent = document.getElementById('executive-summary-content');
    if (overview.executive_summary && executiveSummaryContent) {
        let summaryHtml = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Symbols Analyzed:</strong> ${overview.executive_summary.symbols_analyzed || 0}
                </div>
                <div class="col-md-6">
                    <strong>Analysis Date:</strong> ${overview.executive_summary.analysis_date || 'Unknown'}
                </div>
            </div>
            <div class="mb-3">
                <strong>Symbols:</strong> ${overview.executive_summary.symbols_list || 'None'}
            </div>
        `;
        
        if (overview.executive_summary.key_findings && overview.executive_summary.key_findings.length > 0) {
            summaryHtml += '<div class="mb-3"><strong>Key Findings:</strong><ul class="mt-2">';
            overview.executive_summary.key_findings.forEach(finding => {
                summaryHtml += `<li>${finding}</li>`;
            });
            summaryHtml += '</ul></div>';
        }
        
        executiveSummaryContent.innerHTML = summaryHtml;
    }
    
    // Populate key insights
    const keyInsightsContent = document.getElementById('key-insights-content');
    if (overview.key_insights && keyInsightsContent) {
        if (overview.key_insights.length > 0) {
            let insightsHtml = '<ul class="list-unstyled">';
            overview.key_insights.forEach(insight => {
                insightsHtml += `<li class="mb-2"><i class="bi bi-lightbulb text-warning me-2"></i>${insight}</li>`;
            });
            insightsHtml += '</ul>';
            keyInsightsContent.innerHTML = insightsHtml;
        } else {
            keyInsightsContent.innerHTML = '<p class="text-muted">No specific insights available.</p>';
        }
    }
    
    // Populate analysis summary
    const analysisSummaryContent = document.getElementById('analysis-summary-content');
    if (overview.analysis_summary && analysisSummaryContent) {
        const summary = overview.analysis_summary;
        let summaryHtml = `
            <div class="mb-2"><strong>Data Points:</strong> ${summary.data_points || 0}</div>
        `;
        
        if (summary.models_fitted && summary.models_fitted.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Models Fitted:</strong> ${summary.models_fitted.join(', ')}</div>`;
        }
        
        if (summary.tests_performed && summary.tests_performed.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Tests Performed:</strong> ${summary.tests_performed.join(', ')}</div>`;
        }
        
        analysisSummaryContent.innerHTML = summaryHtml;
    }
}

function initializeExecutionConfigTab() {
    // Check if we have execution configuration data in the raw API response
    if (!rawApiResponse || !rawApiResponse.execution_configuration) {
        console.log("No execution configuration data found");
        // Show placeholder message for all sections
        const configSections = [
            'data-source-config-content',
            'data-processing-config-content', 
            'arima-config-content',
            'garch-config-content',
            'spillover-config-content',
            'execution-metadata-content'
        ];
        
        configSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.innerHTML = '<p class="text-muted">Configuration data not available</p>';
            }
        });
        return;
    }
    
    const config = rawApiResponse.execution_configuration;
    console.log("Initializing execution configuration tab with data:", Object.keys(config));
    
    // Data Source Configuration
    const dataSourceContent = document.getElementById('data-source-config-content');
    if (config.data_source && dataSourceContent) {
        const ds = config.data_source;
        let dataSourceHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Source Type:</strong>
                        <span class="badge bg-primary ms-2">${ds.source_type || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Date Range:</strong> ${ds.start_date || 'N/A'} to ${ds.end_date || 'N/A'}
                    </div>
                    <div class="mb-3">
                        <strong>Symbols:</strong> ${Array.isArray(ds.symbols) ? ds.symbols.join(', ') : 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
        `;
        
        if (ds.source_type === 'synthetic' && ds.synthetic_anchor_prices) {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Synthetic Parameters:</strong>
                    <div class="bg-light p-2 rounded mt-2">
                        <small><strong>Anchor Prices:</strong></small><br>
            `;
            if (typeof ds.synthetic_anchor_prices === 'object') {
                Object.entries(ds.synthetic_anchor_prices).forEach(([symbol, price]) => {
                    dataSourceHtml += `<small>${symbol}: $${price}</small><br>`;
                });
            }
            dataSourceHtml += `
                        <small><strong>Random Seed:</strong> ${ds.synthetic_random_seed || 'N/A'}</small>
                    </div>
                </div>
            `;
        } else {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Data Source:</strong> Real market data
                    <div class="text-muted">
                        <small>Fetched from external API</small>
                    </div>
                </div>
            `;
        }
        
        dataSourceHtml += '</div></div>';
        dataSourceContent.innerHTML = dataSourceHtml;
    }
    
    // Data Processing Configuration
    const dataProcessingContent = document.getElementById('data-processing-config-content');
    if (config.data_processing && dataProcessingContent) {
        const dp = config.data_processing;
        let processingHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Scaling Method:</strong>
                        <span class="badge bg-info ms-2">${dp.scaling_method || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Missing Values Handling:</strong>
                        ${dp.missing_values_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">Strategy: ${dp.missing_values_strategy || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Stationarity Testing:</strong>
                        ${dp.stationarity_test_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">P-value threshold: ${dp.stationarity_test_p_value_threshold || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
            </div>
        `;
        dataProcessingContent.innerHTML = processingHtml;
    }
    
    // ARIMA Configuration
    const arimaConfigContent = document.getElementById('arima-config-content');
    if (config.model_configurations && config.model_configurations.arima_params && arimaConfigContent) {
        const arima = config.model_configurations.arima_params;
        let arimaHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> ARIMA(${arima.p || 'N/A'}, ${arima.d || 'N/A'}, ${arima.q || 'N/A'})</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${arima.forecast_steps || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${arima.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
            </div>
        `;
        arimaConfigContent.innerHTML = arimaHtml;
    }
    
    // GARCH Configuration
    const garchConfigContent = document.getElementById('garch-config-content');
    if (config.model_configurations && config.model_configurations.garch_params && garchConfigContent) {
        const garch = config.model_configurations.garch_params;
        let garchHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> GARCH(${garch.p || 'N/A'}, ${garch.q || 'N/A'})</div>
                <div class="mb-2"><strong>Distribution:</strong> ${garch.dist || 'N/A'}</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${garch.forecast_steps || 'N/A'}</div>
                <div class="mb-2"><strong>Volatility Format:</strong> ${garch.volatility_format || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${garch.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
                <div class="mb-2">
                    <strong>ARIMA Residuals Input:</strong> 
                    ${garch.residuals_as_input ? '<span class="badge bg-info">Yes</span>' : '<span class="badge bg-secondary">No</span>'}
                </div>
            </div>
        `;
        garchConfigContent.innerHTML = garchHtml;
    }
    
    // Spillover Configuration
    const spilloverConfigContent = document.getElementById('spillover-config-content');
    if (config.spillover_configuration && spilloverConfigContent) {
        const spillover = config.spillover_configuration;
        let spilloverHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Spillover Analysis:</strong>
                        ${spillover.spillover_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.spillover_enabled && spillover.spillover_params) {
            const params = spillover.spillover_params;
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Method:</strong> ${params.method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${params.forecast_horizon || 'N/A'}</small><br>
                        <small><strong>Max Lags:</strong> ${params.max_lags || 'N/A'}</small><br>
                        <small><strong>VAR Lag Selection:</strong> ${params.var_lag_selection_method || 'N/A'}</small><br>
                        <small><strong>Granger Significance:</strong> ${params.granger_significance_level || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += `
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Granger Causality:</strong>
                        ${spillover.granger_causality_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.granger_causality_enabled) {
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Max Lag:</strong> ${spillover.granger_causality_max_lag || 'N/A'}</small><br>
                        <small><strong>Analysis Method:</strong> ${spillover.spillover_analysis_method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${spillover.spillover_forecast_horizon || 'N/A'}</small><br>
                        <small><strong>VAR Max Lags:</strong> ${spillover.var_max_lags || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += '</div></div>';
        spilloverConfigContent.innerHTML = spilloverHtml;
    }
    
    // Execution Metadata
    const executionMetadataContent = document.getElementById('execution-metadata-content');
    if (config.execution_metadata && executionMetadataContent) {
        const meta = config.execution_metadata;
        
        // Format execution timestamp with consistent timezone format
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            const timeZoneShort = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0') + ' ' +
                   String(date.getHours()).padStart(2, '0') + ':' +
                   String(date.getMinutes()).padStart(2, '0') + ':' +
                   String(date.getSeconds()).padStart(2, '0') + ' ' + timeZoneShort;
        };
        
        let metadataHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Execution Time:</strong>
                        <div class="text-muted">
                            ${formatTimestamp(meta.execution_timestamp)}
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong>Processing Duration:</strong>
                        <span class="badge bg-info ms-2">${meta.execution_time_seconds ? `${meta.execution_time_seconds.toFixed(2)}s` : 'N/A'}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Configuration Source:</strong>
                        <div class="text-muted">${meta.configuration_source || 'N/A'}</div>
                    </div>
                    <div class="mb-3">
                        <strong>API Version:</strong> <span class="badge bg-secondary">${meta.api_version || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Pipeline Version:</strong> <span class="badge bg-secondary">${meta.pipeline_version || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        executionMetadataContent.innerHTML = metadataHtml;
    }
    
    console.log("Execution configuration tab initialized successfully");
}

function initializePlotsTab() {
    if (!processedResults.data_lineage) return;
    
    const lineage = processedResults.data_lineage;
    
    // Create data pipeline visualization placeholder
    const pipelineViz = document.getElementById('data-pipeline-visualization');
    if (pipelineViz && lineage.pipeline_stages) {
        let vizHtml = '<div class="d-flex justify-content-between align-items-center">';
        lineage.pipeline_stages.forEach((stage, index) => {
            const isAvailable = stage.data_available;
            const badgeClass = isAvailable ? 'bg-success' : 'bg-secondary';
            const iconClass = isAvailable ? 'bi-check-circle' : 'bi-x-circle';
            
            vizHtml += `
                <div class="text-center ${index > 0 ? 'ms-3' : ''}">
                    <div class="badge ${badgeClass} p-3 mb-2">
                        <i class="bi ${iconClass} me-2"></i>${stage.name}
                    </div>
                    <div class="small text-muted">${stage.record_count} records</div>
                </div>
            `;
            
            if (index < lineage.pipeline_stages.length - 1) {
                vizHtml += '<div class="flex-grow-1"><hr class="border-2"></div>';
            }
        });
        vizHtml += '</div>';
        pipelineViz.innerHTML = vizHtml;
    }
    
    // Initialize plot containers for each data stage
    const plotContainers = [
        'original-data-plot',
        'returns-data-plot', 
        'scaled-data-plot',
        'pre-garch-data-plot',
        'post-garch-data-plot'
    ];
    
    plotContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="text-center text-muted p-4">Data visualization will be rendered here</div>';
        }
    });
}

function initializeStatisticalTestsTab() {
    if (!processedResults.statistical_tests) return;
    
    const tests = processedResults.statistical_tests;
    
    // Initialize stationarity results
    const stationarityContainer = document.getElementById('stationarity-results-container');
    if (tests.stationarity && stationarityContainer) {
        let stationarityHtml = '';
        
        Object.keys(tests.stationarity).forEach(symbol => {
            const result = tests.stationarity[symbol];
            const isStationary = result.is_stationary;
            const badgeClass = isStationary ? 'bg-success' : 'bg-warning';
            const statusText = isStationary ? 'Stationary' : 'Non-Stationary';
            
            stationarityHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${symbol}</h6>
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>ADF Statistic:</strong> ${result.adf_statistic?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>P-Value:</strong> ${result.p_value?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>Critical Value (5%):</strong> ${result.critical_values?.['5%']?.toFixed(4) || 'N/A'}
                            </div>
                        </div>
                        ${result.interpretation ? `<div class="mt-3"><small class="text-muted">${JSON.stringify(result.interpretation)}</small></div>` : ''}
                    </div>
                </div>
            `;
        });
        
        stationarityContainer.innerHTML = stationarityHtml || '<p class="text-muted">No stationarity test results available.</p>';
    }
    
    // Initialize series statistics
    const seriesStatsContainer = document.getElementById('series-statistics-container');
    if (tests.series_statistics && seriesStatsContainer) {
        let statsHtml = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
        statsHtml += '<th>Symbol</th><th>Count (n)</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Variance</th><th>Skewness</th><th>Kurtosis</th><th>Annualized Vol</th><th>Annualized Return</th><th>Sharpe Approx</th></tr></thead><tbody>';
        
        Object.keys(tests.series_statistics).forEach(symbol => {
            const stats = tests.series_statistics[symbol];
            statsHtml += `
                <tr>
                    <td><strong>${symbol}</strong></td>
                    <td>${stats.n || 'N/A'}</td>
                    <td>${stats.mean?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.median?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.min?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.max?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.std?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.var?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.skew?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.kurt?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_vol?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_return?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.sharpe_approx?.toFixed(4) || 'N/A'}</td>
                </tr>
            `;
        });
        
        statsHtml += '</tbody></table></div>';
        seriesStatsContainer.innerHTML = statsHtml;
    }
}

function initializeModelsTab() {
    if (!processedResults.models) {
        console.log("No model data available");
        return;
    }

    const arimaModels = processedResults.models.arima;
    const garchModels = processedResults.models.garch;
    const varModel = processedResults.models.var;

    // Initialize ARIMA statistics table
    const arimaStatsContainer = document.getElementById('arima-statistics-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let statsHtml = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Symbol</th>
                            <th>AIC</th>
                            <th>BIC</th>
                            <th>HQIC</th>
                            <th>Log-Likelihood</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        for (const symbol in arimaModels) {
            if (arimaModels[symbol].summary_stats) {
                const stats = arimaModels[symbol].summary_stats;
                statsHtml += `
                    <tr>
                        <td><strong>${symbol}</strong></td>
                        <td>${stats.aic !== undefined ? stats.aic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.bic !== undefined ? stats.bic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.hqic !== undefined ? stats.hqic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.log_likelihood !== undefined ? stats.log_likelihood.toFixed(4) : 'N/A'}</td>
                    </tr>
                `;
            }
        }
        statsHtml += '</tbody></table></div>';
        arimaStatsContainer.innerHTML = statsHtml;
    } else {
        arimaStatsContainer.innerHTML = '<p class="text-muted">No ARIMA model statistics available.</p>';
    }

    // Initialize ARIMA results (existing logic)
    const arimaContainer = document.getElementById('arima-results-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let arimaHtml = '';
        
        Object.keys(arimaModels).forEach(symbol => {
            const result = arimaModels[symbol];
            let interpretation = {};
            
            // Handle interpretation data based on source
            if (result.interpretation) {
                interpretation = result.interpretation;
            }
            
            // Extract model specification - try different sources
            let modelSpec = 'Model specification not available';
            if (result.model_specification) {
                modelSpec = result.model_specification;
            } else if (result.summary && result.summary.model_specification) {
                modelSpec = result.summary.model_specification;
            } else if (result.model_specification) {
                modelSpec = result.model_specification;
            }
            
            // Extract parameters - try different sources
            let parameters = {};
            let parameterPValues = {};
            let parameterSignificance = {};
            
            if (result.parameters) {
                parameters = result.parameters || {};
                parameterPValues = result.parameter_pvalues || {};
                parameterSignificance = result.parameter_significance || {};
            } else if (result.summary) {
                parameters = result.summary.parameters || {};
                parameterPValues = result.summary.parameter_pvalues || {};
                parameterSignificance = result.summary.parameter_significance || {};
            }
            
            // Extract forecast information
            let forecastInfo = 'No forecast available';
            let forecastData = null;
            
            if (result.forecast) {
                forecastData = result.forecast;
            }
            
            if (forecastData) {
                if (forecastData.point_forecasts && forecastData.point_forecasts.length > 0) {
                    forecastInfo = `${forecastData.point_forecasts.length} forecast points`;
                    if (forecastData.forecast_method) {
                        forecastInfo += ` (${forecastData.forecast_method})`;
                    }
                } else if (Array.isArray(forecastData) && forecastData.length > 0) {
                    forecastInfo = `${forecastData.length} forecast points`;
                }
            }
            
            // Extract model statistics
            let modelStats = {};
            if (result.summary) {
                modelStats = {
                    sample_size: result.summary.sample_size,
                    log_likelihood: result.summary.log_likelihood,
                    aic: result.summary.aic,
                    bic: result.summary.bic,
                    hqic: result.summary.hqic
                };
            }
            
            // Extract residual statistics
            let residualStats = {};
            if (result.residual_statistics) {
                residualStats = result.residual_statistics;
            } else if (result.summary && result.summary.residual_statistics) {
                residualStats = result.summary.residual_statistics;
            }
            
            // Build comprehensive model information
            arimaHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">ARIMA Model - ${symbol}</h6>
                        <span class="badge bg-primary">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-gear"></i> Model Specification</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <code>${modelSpec}</code>
                                </div>
                                
                                <h6><i class="bi bi-info-circle"></i> Model Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Sample Size:</strong> ${modelStats.sample_size || 'N/A'}</div>
                                    <div class="col-6"><strong>Log Likelihood:</strong> ${modelStats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>AIC:</strong> ${modelStats.aic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>BIC:</strong> ${modelStats.bic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>HQIC:</strong> ${modelStats.hqic?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-sliders"></i> Model Parameters</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameters).length > 0 ? Object.entries(parameters).map(([param, value]) => 
                                        `<div class="d-flex justify-content-between">
                                            <span><strong>${param}:</strong></span>
                                            <span>${value?.toFixed(4) || 'N/A'}</span>
                                        </div>`
                                    ).join('') : '<div class="text-muted">No parameters available</div>'}
                                </div>
                                
                                <h6><i class="bi bi-check-circle"></i> Parameter Significance</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameterPValues).length > 0 && Object.keys(parameterSignificance).length > 0 ? 
                                        Object.entries(parameterPValues).map(([param, pvalue]) => {
                                            const significance = parameterSignificance[param];
                                            const badgeClass = significance === 'Not significant' ? 'bg-warning' : 'bg-success';
                                            return `<div class="d-flex justify-content-between align-items-center mb-1">
                                                <span><strong>${param}:</strong></span>
                                                <div>
                                                    <span class="me-2">p=${pvalue?.toFixed(4) || 'N/A'}</span>
                                                    <span class="badge ${badgeClass}">${significance || 'N/A'}</span>
                                                </div>
                                            </div>`;
                                        }).join('') : 
                                        '<div class="text-muted">No significance data available</div>'
                                    }
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <h6><i class="bi bi-graph-up-arrow"></i> Forecast Information</h6>
                                <p>${forecastInfo}</p>
                                ${forecastData && forecastData.confidence_intervals ? 
                                    '<p><small class="text-muted">Includes confidence intervals</small></p>' : 
                                    ''
                                }
                                
                                <h6><i class="bi bi-bar-chart"></i> Residual Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Mean:</strong> ${residualStats.mean?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Variance:</strong> ${residualStats.variance?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Min:</strong> ${residualStats.min?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Max:</strong> ${residualStats.max?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Autocorr Lag1:</strong> ${residualStats.autocorrelation_lag1?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-clipboard-check"></i> Diagnostic Tests</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <div><strong>Ljung-Box Test:</strong> ${residualStats.ljung_box_test || 'See full summary'}</div>
                                    <div><strong>Jarque-Bera Test:</strong> ${residualStats.jarque_bera_test || 'See full summary'}</div>
                                </div>
                                
                                ${forecastData && ((forecastData.point_forecasts && forecastData.point_forecasts.length > 0) || (Array.isArray(forecastData) && forecastData.length > 0)) ? `
                                    <h6><i class="bi bi-graph-up"></i> Latest Forecasts</h6>
                                    <div class="bg-light p-2 rounded">
                                        ${(() => {
                                            const forecasts = forecastData.point_forecasts || forecastData;
                                            if (Array.isArray(forecasts)) {
                                                return forecasts.slice(0, 3).map((forecast, index) => 
                                                    `<div>Step ${index + 1}: ${forecast.toFixed(6)}</div>`
                                                ).join('') + 
                                                (forecasts.length > 3 ? 
                                                    `<small class="text-muted">... and ${forecasts.length - 3} more</small>` : 
                                                    ''
                                                );
                                            }
                                            return '<div class="text-muted">No forecast data</div>';
                                        })()}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${interpretation.executive_summary ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="alert alert-info mb-2">
                                            <strong>Bottom Line:</strong> ${interpretation.executive_summary.bottom_line || 'No summary available'}
                                        </div>
                                        <div class="alert alert-secondary mb-2">
                                            <strong>Business Impact:</strong> ${interpretation.executive_summary.business_impact || 'No impact assessment'}
                                        </div>
                                        <div class="alert alert-primary mb-2">
                                            <strong>Recommendation:</strong> ${interpretation.executive_summary.recommendation || 'No recommendations'}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        ${interpretation.key_findings ? `
                                            <div class="mb-2">
                                                <strong>Key Findings:</strong>
                                                <ul class="small mt-1">
                                                    ${interpretation.key_findings.forecast_trend ? `<li><strong>Trend:</strong> ${interpretation.key_findings.forecast_trend}</li>` : ''}
                                                    ${interpretation.key_findings.model_performance ? `<li><strong>Performance:</strong> ${interpretation.key_findings.model_performance}</li>` : ''}
                                                    ${interpretation.key_findings.forecast_statistics ? `<li><strong>Statistics:</strong> ${interpretation.key_findings.forecast_statistics}</li>` : ''}
                                                </ul>
                                            </div>
                                        ` : ''}
                                        ${interpretation.business_context && interpretation.business_context.what_is_arima ? `
                                            <div class="mb-2">
                                                <small class="text-muted">
                                                    <strong>About ARIMA:</strong> ${interpretation.business_context.what_is_arima.substring(0, 150)}...
                                                </small>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : interpretation.executive_summary && typeof interpretation.executive_summary === 'string' ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation.executive_summary}</small>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        arimaContainer.innerHTML = arimaHtml;
        console.log(`ARIMA models displayed: ${Object.keys(arimaModels).length} symbols`);
    } else {
        arimaContainer.innerHTML = '<div class="alert alert-warning">No ARIMA results available.</div>';
        console.log("No ARIMA results found in any data source");
    }
    
    // Initialize GARCH results
    const garchContainer = document.getElementById('garch-results-container');
    if (garchModels && Object.keys(garchModels).length > 0) {
        let garchHtml = '';
        
        Object.keys(garchModels).forEach(symbol => {
            const result = garchModels[symbol];
            
            // Extract model specification from fitted_model summary text
            let modelSpec = 'Model specification not available';
            if (result.fitted_model && typeof result.fitted_model === 'string') {
                // Parse GARCH model specification from the fitted_model summary
                const summaryLines = result.fitted_model.split('\n');
                
                // Look for GARCH model specification in various formats
                const garchLine = summaryLines.find(line => 
                    line.includes('GARCH') || 
                    line.includes('Constant Variance') ||
                    line.includes('Model:')
                );
                
                if (garchLine) {
                    // Extract GARCH(p,q) pattern
                    const garchMatch = garchLine.match(/GARCH\(\d+,\d+\)/);
                    if (garchMatch) {
                        modelSpec = garchMatch[0];
                    } else {
                        // Look for other patterns like "GARCH Model Results"
                        if (garchLine.includes('GARCH')) {
                            modelSpec = garchLine.trim();
                        } else {
                            // Fallback: construct from the fact it's a GARCH model
                            modelSpec = 'GARCH Model';
                        }
                    }
                } else {
                    // If no specific GARCH line found, assume it's a GARCH(1,1)
                    modelSpec = 'GARCH(1,1)';
                }
            }
            
            // Extract volatility forecast information
            let volForecastInfo = 'No volatility forecast available';
            if (result.forecast) {
                if (Array.isArray(result.forecast) && result.forecast.length > 0) {
                    volForecastInfo = `${result.forecast.length} volatility forecast points`;
                } else if (result.forecast.volatility_forecast) {
                    volForecastInfo = `Volatility forecast available`;
                }
            }
            
            // Extract model parameters
            let parameters = '';
            if (result.model_summary && result.model_summary.parameters) {
                const params = result.model_summary.parameters;
                parameters = `
                    <div class="row mt-3">
                        ${Object.keys(params).map(param => 
                            `<div class="col-6"><strong>${param}:</strong> ${params[param]?.toFixed(4) || 'N/A'}</div>`
                        ).join('')}
                    </div>
                `;
            }
            
            // Extract fit statistics
            let fitStats = '';
            if (result.model_summary && result.model_summary.fit_statistics) {
                const stats = result.model_summary.fit_statistics;
                fitStats = `
                    <div class="row mt-3">
                        <div class="col-6"><strong>Log Likelihood:</strong> ${stats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>AIC:</strong> ${stats.aic?.toFixed(4) || 'N/A'}</div>
                    </div>
                `;
            }
            
            // Extract interpretation
            let interpretation = '';
            if (result.interpretation) {
                if (typeof result.interpretation === 'string') {
                    interpretation = result.interpretation;
                } else if (result.interpretation.executive_summary) {
                    interpretation = typeof result.interpretation.executive_summary === 'string' ? 
                        result.interpretation.executive_summary : 
                        JSON.stringify(result.interpretation.executive_summary);
                }
            }
            
            garchHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">GARCH Model - ${symbol}</h6>
                        <span class="badge bg-success">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Specification</h6>
                                <div class="bg-light p-2 rounded">
                                    <code>${modelSpec}</code>
                                </div>
                                ${parameters}
                                ${fitStats}
                            </div>
                            <div class="col-md-6">
                                <h6>Volatility Forecast</h6>
                                <p>${volForecastInfo}</p>
                                ${result.forecast && result.forecast.length > 0 ? 
                                    `<p><small class="text-muted">Latest forecast: ${result.forecast[result.forecast.length - 1]?.toFixed(6) || 'N/A'}</small></p>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ${interpretation ? 
                            `<div class="mt-3">
                                <h6>Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation}</small>
                                </div>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        });
        
        garchContainer.innerHTML = garchHtml || '<div class="alert alert-warning">No GARCH results available.</div>';
    }
    
    // Initialize VAR results
    const varContainer = document.getElementById('var-results-container');
    if (varModel && Object.keys(varModel).length > 0) {
        initializeVarResults(varModel);
    } else {
        varContainer.innerHTML = '<p class="text-muted">VAR model results not available.</p>';
    }
}

function initializeNextStepTab() {
    const iterateButton = document.getElementById('iterate-analysis-btn');
    if (iterateButton) {
        iterateButton.addEventListener('click', function() {
            console.log("'Continue to iterate?' button clicked.");
            
            if (!rawApiResponse || !rawApiResponse.execution_configuration) {
                alert('Could not find the original execution configuration to iterate upon.');
                return;
            }
            
            // Add the filename to the configuration to be stored
            const config = rawApiResponse.execution_configuration;
            if (rawApiResponse.processed_results && rawApiResponse.processed_results.overview) {
                config.filename = rawApiResponse.processed_results.overview.filename || 'Previously used file';
            }

            // Store the execution configuration for the analysis page to use
            sessionStorage.setItem('analysisIterationConfig', JSON.stringify(config));
            console.log("Stored execution configuration for iteration:", config);
            
            // Redirect to the analysis page
            window.location.href = '/analysis/'; 
        });
    }
}

function initializeOverviewTab() {
    if (!processedResults.overview) return;
    
    const overview = processedResults.overview;
    
    // Populate executive summary
    const executiveSummaryContent = document.getElementById('executive-summary-content');
    if (overview.executive_summary && executiveSummaryContent) {
        let summaryHtml = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Symbols Analyzed:</strong> ${overview.executive_summary.symbols_analyzed || 0}
                </div>
                <div class="col-md-6">
                    <strong>Analysis Date:</strong> ${overview.executive_summary.analysis_date || 'Unknown'}
                </div>
            </div>
            <div class="mb-3">
                <strong>Symbols:</strong> ${overview.executive_summary.symbols_list || 'None'}
            </div>
        `;
        
        if (overview.executive_summary.key_findings && overview.executive_summary.key_findings.length > 0) {
            summaryHtml += '<div class="mb-3"><strong>Key Findings:</strong><ul class="mt-2">';
            overview.executive_summary.key_findings.forEach(finding => {
                summaryHtml += `<li>${finding}</li>`;
            });
            summaryHtml += '</ul></div>';
        }
        
        executiveSummaryContent.innerHTML = summaryHtml;
    }
    
    // Populate key insights
    const keyInsightsContent = document.getElementById('key-insights-content');
    if (overview.key_insights && keyInsightsContent) {
        if (overview.key_insights.length > 0) {
            let insightsHtml = '<ul class="list-unstyled">';
            overview.key_insights.forEach(insight => {
                insightsHtml += `<li class="mb-2"><i class="bi bi-lightbulb text-warning me-2"></i>${insight}</li>`;
            });
            insightsHtml += '</ul>';
            keyInsightsContent.innerHTML = insightsHtml;
        } else {
            keyInsightsContent.innerHTML = '<p class="text-muted">No specific insights available.</p>';
        }
    }
    
    // Populate analysis summary
    const analysisSummaryContent = document.getElementById('analysis-summary-content');
    if (overview.analysis_summary && analysisSummaryContent) {
        const summary = overview.analysis_summary;
        let summaryHtml = `
            <div class="mb-2"><strong>Data Points:</strong> ${summary.data_points || 0}</div>
        `;
        
        if (summary.models_fitted && summary.models_fitted.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Models Fitted:</strong> ${summary.models_fitted.join(', ')}</div>`;
        }
        
        if (summary.tests_performed && summary.tests_performed.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Tests Performed:</strong> ${summary.tests_performed.join(', ')}</div>`;
        }
        
        analysisSummaryContent.innerHTML = summaryHtml;
    }
}

function initializeExecutionConfigTab() {
    // Check if we have execution configuration data in the raw API response
    if (!rawApiResponse || !rawApiResponse.execution_configuration) {
        console.log("No execution configuration data found");
        // Show placeholder message for all sections
        const configSections = [
            'data-source-config-content',
            'data-processing-config-content', 
            'arima-config-content',
            'garch-config-content',
            'spillover-config-content',
            'execution-metadata-content'
        ];
        
        configSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.innerHTML = '<p class="text-muted">Configuration data not available</p>';
            }
        });
        return;
    }
    
    const config = rawApiResponse.execution_configuration;
    console.log("Initializing execution configuration tab with data:", Object.keys(config));
    
    // Data Source Configuration
    const dataSourceContent = document.getElementById('data-source-config-content');
    if (config.data_source && dataSourceContent) {
        const ds = config.data_source;
        let dataSourceHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Source Type:</strong>
                        <span class="badge bg-primary ms-2">${ds.source_type || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Date Range:</strong> ${ds.start_date || 'N/A'} to ${ds.end_date || 'N/A'}
                    </div>
                    <div class="mb-3">
                        <strong>Symbols:</strong> ${Array.isArray(ds.symbols) ? ds.symbols.join(', ') : 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
        `;
        
        if (ds.source_type === 'synthetic' && ds.synthetic_anchor_prices) {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Synthetic Parameters:</strong>
                    <div class="bg-light p-2 rounded mt-2">
                        <small><strong>Anchor Prices:</strong></small><br>
            `;
            if (typeof ds.synthetic_anchor_prices === 'object') {
                Object.entries(ds.synthetic_anchor_prices).forEach(([symbol, price]) => {
                    dataSourceHtml += `<small>${symbol}: $${price}</small><br>`;
                });
            }
            dataSourceHtml += `
                        <small><strong>Random Seed:</strong> ${ds.synthetic_random_seed || 'N/A'}</small>
                    </div>
                </div>
            `;
        } else {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Data Source:</strong> Real market data
                    <div class="text-muted">
                        <small>Fetched from external API</small>
                    </div>
                </div>
            `;
        }
        
        dataSourceHtml += '</div></div>';
        dataSourceContent.innerHTML = dataSourceHtml;
    }
    
    // Data Processing Configuration
    const dataProcessingContent = document.getElementById('data-processing-config-content');
    if (config.data_processing && dataProcessingContent) {
        const dp = config.data_processing;
        let processingHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Scaling Method:</strong>
                        <span class="badge bg-info ms-2">${dp.scaling_method || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Missing Values Handling:</strong>
                        ${dp.missing_values_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">Strategy: ${dp.missing_values_strategy || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Stationarity Testing:</strong>
                        ${dp.stationarity_test_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">P-value threshold: ${dp.stationarity_test_p_value_threshold || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
            </div>
        `;
        dataProcessingContent.innerHTML = processingHtml;
    }
    
    // ARIMA Configuration
    const arimaConfigContent = document.getElementById('arima-config-content');
    if (config.model_configurations && config.model_configurations.arima_params && arimaConfigContent) {
        const arima = config.model_configurations.arima_params;
        let arimaHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> ARIMA(${arima.p || 'N/A'}, ${arima.d || 'N/A'}, ${arima.q || 'N/A'})</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${arima.forecast_steps || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${arima.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
            </div>
        `;
        arimaConfigContent.innerHTML = arimaHtml;
    }
    
    // GARCH Configuration
    const garchConfigContent = document.getElementById('garch-config-content');
    if (config.model_configurations && config.model_configurations.garch_params && garchConfigContent) {
        const garch = config.model_configurations.garch_params;
        let garchHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> GARCH(${garch.p || 'N/A'}, ${garch.q || 'N/A'})</div>
                <div class="mb-2"><strong>Distribution:</strong> ${garch.dist || 'N/A'}</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${garch.forecast_steps || 'N/A'}</div>
                <div class="mb-2"><strong>Volatility Format:</strong> ${garch.volatility_format || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${garch.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
                <div class="mb-2">
                    <strong>ARIMA Residuals Input:</strong> 
                    ${garch.residuals_as_input ? '<span class="badge bg-info">Yes</span>' : '<span class="badge bg-secondary">No</span>'}
                </div>
            </div>
        `;
        garchConfigContent.innerHTML = garchHtml;
    }
    
    // Spillover Configuration
    const spilloverConfigContent = document.getElementById('spillover-config-content');
    if (config.spillover_configuration && spilloverConfigContent) {
        const spillover = config.spillover_configuration;
        let spilloverHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Spillover Analysis:</strong>
                        ${spillover.spillover_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.spillover_enabled && spillover.spillover_params) {
            const params = spillover.spillover_params;
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Method:</strong> ${params.method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${params.forecast_horizon || 'N/A'}</small><br>
                        <small><strong>Max Lags:</strong> ${params.max_lags || 'N/A'}</small><br>
                        <small><strong>VAR Lag Selection:</strong> ${params.var_lag_selection_method || 'N/A'}</small><br>
                        <small><strong>Granger Significance:</strong> ${params.granger_significance_level || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += `
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Granger Causality:</strong>
                        ${spillover.granger_causality_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.granger_causality_enabled) {
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Max Lag:</strong> ${spillover.granger_causality_max_lag || 'N/A'}</small><br>
                        <small><strong>Analysis Method:</strong> ${spillover.spillover_analysis_method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${spillover.spillover_forecast_horizon || 'N/A'}</small><br>
                        <small><strong>VAR Max Lags:</strong> ${spillover.var_max_lags || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += '</div></div>';
        spilloverConfigContent.innerHTML = spilloverHtml;
    }
    
    // Execution Metadata
    const executionMetadataContent = document.getElementById('execution-metadata-content');
    if (config.execution_metadata && executionMetadataContent) {
        const meta = config.execution_metadata;
        
        // Format execution timestamp with consistent timezone format
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            const timeZoneShort = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0') + ' ' +
                   String(date.getHours()).padStart(2, '0') + ':' +
                   String(date.getMinutes()).padStart(2, '0') + ':' +
                   String(date.getSeconds()).padStart(2, '0') + ' ' + timeZoneShort;
        };
        
        let metadataHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Execution Time:</strong>
                        <div class="text-muted">
                            ${formatTimestamp(meta.execution_timestamp)}
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong>Processing Duration:</strong>
                        <span class="badge bg-info ms-2">${meta.execution_time_seconds ? `${meta.execution_time_seconds.toFixed(2)}s` : 'N/A'}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Configuration Source:</strong>
                        <div class="text-muted">${meta.configuration_source || 'N/A'}</div>
                    </div>
                    <div class="mb-3">
                        <strong>API Version:</strong> <span class="badge bg-secondary">${meta.api_version || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Pipeline Version:</strong> <span class="badge bg-secondary">${meta.pipeline_version || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        executionMetadataContent.innerHTML = metadataHtml;
    }
    
    console.log("Execution configuration tab initialized successfully");
}

function initializePlotsTab() {
    if (!processedResults.data_lineage) return;
    
    const lineage = processedResults.data_lineage;
    
    // Create data pipeline visualization placeholder
    const pipelineViz = document.getElementById('data-pipeline-visualization');
    if (pipelineViz && lineage.pipeline_stages) {
        let vizHtml = '<div class="d-flex justify-content-between align-items-center">';
        lineage.pipeline_stages.forEach((stage, index) => {
            const isAvailable = stage.data_available;
            const badgeClass = isAvailable ? 'bg-success' : 'bg-secondary';
            const iconClass = isAvailable ? 'bi-check-circle' : 'bi-x-circle';
            
            vizHtml += `
                <div class="text-center ${index > 0 ? 'ms-3' : ''}">
                    <div class="badge ${badgeClass} p-3 mb-2">
                        <i class="bi ${iconClass} me-2"></i>${stage.name}
                    </div>
                    <div class="small text-muted">${stage.record_count} records</div>
                </div>
            `;
            
            if (index < lineage.pipeline_stages.length - 1) {
                vizHtml += '<div class="flex-grow-1"><hr class="border-2"></div>';
            }
        });
        vizHtml += '</div>';
        pipelineViz.innerHTML = vizHtml;
    }
    
    // Initialize plot containers for each data stage
    const plotContainers = [
        'original-data-plot',
        'returns-data-plot', 
        'scaled-data-plot',
        'pre-garch-data-plot',
        'post-garch-data-plot'
    ];
    
    plotContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="text-center text-muted p-4">Data visualization will be rendered here</div>';
        }
    });
}

function initializeStatisticalTestsTab() {
    if (!processedResults.statistical_tests) return;
    
    const tests = processedResults.statistical_tests;
    
    // Initialize stationarity results
    const stationarityContainer = document.getElementById('stationarity-results-container');
    if (tests.stationarity && stationarityContainer) {
        let stationarityHtml = '';
        
        Object.keys(tests.stationarity).forEach(symbol => {
            const result = tests.stationarity[symbol];
            const isStationary = result.is_stationary;
            const badgeClass = isStationary ? 'bg-success' : 'bg-warning';
            const statusText = isStationary ? 'Stationary' : 'Non-Stationary';
            
            stationarityHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${symbol}</h6>
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>ADF Statistic:</strong> ${result.adf_statistic?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>P-Value:</strong> ${result.p_value?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>Critical Value (5%):</strong> ${result.critical_values?.['5%']?.toFixed(4) || 'N/A'}
                            </div>
                        </div>
                        ${result.interpretation ? `<div class="mt-3"><small class="text-muted">${JSON.stringify(result.interpretation)}</small></div>` : ''}
                    </div>
                </div>
            `;
        });
        
        stationarityContainer.innerHTML = stationarityHtml || '<p class="text-muted">No stationarity test results available.</p>';
    }
    
    // Initialize series statistics
    const seriesStatsContainer = document.getElementById('series-statistics-container');
    if (tests.series_statistics && seriesStatsContainer) {
        let statsHtml = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
        statsHtml += '<th>Symbol</th><th>Count (n)</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Variance</th><th>Skewness</th><th>Kurtosis</th><th>Annualized Vol</th><th>Annualized Return</th><th>Sharpe Approx</th></tr></thead><tbody>';
        
        Object.keys(tests.series_statistics).forEach(symbol => {
            const stats = tests.series_statistics[symbol];
            statsHtml += `
                <tr>
                    <td><strong>${symbol}</strong></td>
                    <td>${stats.n || 'N/A'}</td>
                    <td>${stats.mean?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.median?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.min?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.max?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.std?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.var?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.skew?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.kurt?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_vol?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_return?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.sharpe_approx?.toFixed(4) || 'N/A'}</td>
                </tr>
            `;
        });
        
        statsHtml += '</tbody></table></div>';
        seriesStatsContainer.innerHTML = statsHtml;
    }
}

function initializeModelsTab() {
    if (!processedResults.models) {
        console.log("No model data available");
        return;
    }

    const arimaModels = processedResults.models.arima;
    const garchModels = processedResults.models.garch;
    const varModel = processedResults.models.var;

    // Initialize ARIMA statistics table
    const arimaStatsContainer = document.getElementById('arima-statistics-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let statsHtml = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Symbol</th>
                            <th>AIC</th>
                            <th>BIC</th>
                            <th>HQIC</th>
                            <th>Log-Likelihood</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        for (const symbol in arimaModels) {
            if (arimaModels[symbol].summary_stats) {
                const stats = arimaModels[symbol].summary_stats;
                statsHtml += `
                    <tr>
                        <td><strong>${symbol}</strong></td>
                        <td>${stats.aic !== undefined ? stats.aic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.bic !== undefined ? stats.bic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.hqic !== undefined ? stats.hqic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.log_likelihood !== undefined ? stats.log_likelihood.toFixed(4) : 'N/A'}</td>
                    </tr>
                `;
            }
        }
        statsHtml += '</tbody></table></div>';
        arimaStatsContainer.innerHTML = statsHtml;
    } else {
        arimaStatsContainer.innerHTML = '<p class="text-muted">No ARIMA model statistics available.</p>';
    }

    // Initialize ARIMA results (existing logic)
    const arimaContainer = document.getElementById('arima-results-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let arimaHtml = '';
        
        Object.keys(arimaModels).forEach(symbol => {
            const result = arimaModels[symbol];
            let interpretation = {};
            
            // Handle interpretation data based on source
            if (result.interpretation) {
                interpretation = result.interpretation;
            }
            
            // Extract model specification - try different sources
            let modelSpec = 'Model specification not available';
            if (result.model_specification) {
                modelSpec = result.model_specification;
            } else if (result.summary && result.summary.model_specification) {
                modelSpec = result.summary.model_specification;
            } else if (result.model_specification) {
                modelSpec = result.model_specification;
            }
            
            // Extract parameters - try different sources
            let parameters = {};
            let parameterPValues = {};
            let parameterSignificance = {};
            
            if (result.parameters) {
                parameters = result.parameters || {};
                parameterPValues = result.parameter_pvalues || {};
                parameterSignificance = result.parameter_significance || {};
            } else if (result.summary) {
                parameters = result.summary.parameters || {};
                parameterPValues = result.summary.parameter_pvalues || {};
                parameterSignificance = result.summary.parameter_significance || {};
            }
            
            // Extract forecast information
            let forecastInfo = 'No forecast available';
            let forecastData = null;
            
            if (result.forecast) {
                forecastData = result.forecast;
            }
            
            if (forecastData) {
                if (forecastData.point_forecasts && forecastData.point_forecasts.length > 0) {
                    forecastInfo = `${forecastData.point_forecasts.length} forecast points`;
                    if (forecastData.forecast_method) {
                        forecastInfo += ` (${forecastData.forecast_method})`;
                    }
                } else if (Array.isArray(forecastData) && forecastData.length > 0) {
                    forecastInfo = `${forecastData.length} forecast points`;
                }
            }
            
            // Extract model statistics
            let modelStats = {};
            if (result.summary) {
                modelStats = {
                    sample_size: result.summary.sample_size,
                    log_likelihood: result.summary.log_likelihood,
                    aic: result.summary.aic,
                    bic: result.summary.bic,
                    hqic: result.summary.hqic
                };
            }
            
            // Extract residual statistics
            let residualStats = {};
            if (result.residual_statistics) {
                residualStats = result.residual_statistics;
            } else if (result.summary && result.summary.residual_statistics) {
                residualStats = result.summary.residual_statistics;
            }
            
            // Build comprehensive model information
            arimaHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">ARIMA Model - ${symbol}</h6>
                        <span class="badge bg-primary">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-gear"></i> Model Specification</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <code>${modelSpec}</code>
                                </div>
                                
                                <h6><i class="bi bi-info-circle"></i> Model Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Sample Size:</strong> ${modelStats.sample_size || 'N/A'}</div>
                                    <div class="col-6"><strong>Log Likelihood:</strong> ${modelStats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>AIC:</strong> ${modelStats.aic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>BIC:</strong> ${modelStats.bic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>HQIC:</strong> ${modelStats.hqic?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-sliders"></i> Model Parameters</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameters).length > 0 ? Object.entries(parameters).map(([param, value]) => 
                                        `<div class="d-flex justify-content-between">
                                            <span><strong>${param}:</strong></span>
                                            <span>${value?.toFixed(4) || 'N/A'}</span>
                                        </div>`
                                    ).join('') : '<div class="text-muted">No parameters available</div>'}
                                </div>
                                
                                <h6><i class="bi bi-check-circle"></i> Parameter Significance</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameterPValues).length > 0 && Object.keys(parameterSignificance).length > 0 ? 
                                        Object.entries(parameterPValues).map(([param, pvalue]) => {
                                            const significance = parameterSignificance[param];
                                            const badgeClass = significance === 'Not significant' ? 'bg-warning' : 'bg-success';
                                            return `<div class="d-flex justify-content-between align-items-center mb-1">
                                                <span><strong>${param}:</strong></span>
                                                <div>
                                                    <span class="me-2">p=${pvalue?.toFixed(4) || 'N/A'}</span>
                                                    <span class="badge ${badgeClass}">${significance || 'N/A'}</span>
                                                </div>
                                            </div>`;
                                        }).join('') : 
                                        '<div class="text-muted">No significance data available</div>'
                                    }
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <h6><i class="bi bi-graph-up-arrow"></i> Forecast Information</h6>
                                <p>${forecastInfo}</p>
                                ${forecastData && forecastData.confidence_intervals ? 
                                    '<p><small class="text-muted">Includes confidence intervals</small></p>' : 
                                    ''
                                }
                                
                                <h6><i class="bi bi-bar-chart"></i> Residual Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Mean:</strong> ${residualStats.mean?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Variance:</strong> ${residualStats.variance?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Min:</strong> ${residualStats.min?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Max:</strong> ${residualStats.max?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Autocorr Lag1:</strong> ${residualStats.autocorrelation_lag1?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-clipboard-check"></i> Diagnostic Tests</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <div><strong>Ljung-Box Test:</strong> ${residualStats.ljung_box_test || 'See full summary'}</div>
                                    <div><strong>Jarque-Bera Test:</strong> ${residualStats.jarque_bera_test || 'See full summary'}</div>
                                </div>
                                
                                ${forecastData && ((forecastData.point_forecasts && forecastData.point_forecasts.length > 0) || (Array.isArray(forecastData) && forecastData.length > 0)) ? `
                                    <h6><i class="bi bi-graph-up"></i> Latest Forecasts</h6>
                                    <div class="bg-light p-2 rounded">
                                        ${(() => {
                                            const forecasts = forecastData.point_forecasts || forecastData;
                                            if (Array.isArray(forecasts)) {
                                                return forecasts.slice(0, 3).map((forecast, index) => 
                                                    `<div>Step ${index + 1}: ${forecast.toFixed(6)}</div>`
                                                ).join('') + 
                                                (forecasts.length > 3 ? 
                                                    `<small class="text-muted">... and ${forecasts.length - 3} more</small>` : 
                                                    ''
                                                );
                                            }
                                            return '<div class="text-muted">No forecast data</div>';
                                        })()}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${interpretation.executive_summary ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="alert alert-info mb-2">
                                            <strong>Bottom Line:</strong> ${interpretation.executive_summary.bottom_line || 'No summary available'}
                                        </div>
                                        <div class="alert alert-secondary mb-2">
                                            <strong>Business Impact:</strong> ${interpretation.executive_summary.business_impact || 'No impact assessment'}
                                        </div>
                                        <div class="alert alert-primary mb-2">
                                            <strong>Recommendation:</strong> ${interpretation.executive_summary.recommendation || 'No recommendations'}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        ${interpretation.key_findings ? `
                                            <div class="mb-2">
                                                <strong>Key Findings:</strong>
                                                <ul class="small mt-1">
                                                    ${interpretation.key_findings.forecast_trend ? `<li><strong>Trend:</strong> ${interpretation.key_findings.forecast_trend}</li>` : ''}
                                                    ${interpretation.key_findings.model_performance ? `<li><strong>Performance:</strong> ${interpretation.key_findings.model_performance}</li>` : ''}
                                                    ${interpretation.key_findings.forecast_statistics ? `<li><strong>Statistics:</strong> ${interpretation.key_findings.forecast_statistics}</li>` : ''}
                                                </ul>
                                            </div>
                                        ` : ''}
                                        ${interpretation.business_context && interpretation.business_context.what_is_arima ? `
                                            <div class="mb-2">
                                                <small class="text-muted">
                                                    <strong>About ARIMA:</strong> ${interpretation.business_context.what_is_arima.substring(0, 150)}...
                                                </small>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : interpretation.executive_summary && typeof interpretation.executive_summary === 'string' ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation.executive_summary}</small>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        arimaContainer.innerHTML = arimaHtml;
        console.log(`ARIMA models displayed: ${Object.keys(arimaModels).length} symbols`);
    } else {
        arimaContainer.innerHTML = '<div class="alert alert-warning">No ARIMA results available.</div>';
        console.log("No ARIMA results found in any data source");
    }
    
    // Initialize GARCH results
    const garchContainer = document.getElementById('garch-results-container');
    if (garchModels && Object.keys(garchModels).length > 0) {
        let garchHtml = '';
        
        Object.keys(garchModels).forEach(symbol => {
            const result = garchModels[symbol];
            
            // Extract model specification from fitted_model summary text
            let modelSpec = 'Model specification not available';
            if (result.fitted_model && typeof result.fitted_model === 'string') {
                // Parse GARCH model specification from the fitted_model summary
                const summaryLines = result.fitted_model.split('\n');
                
                // Look for GARCH model specification in various formats
                const garchLine = summaryLines.find(line => 
                    line.includes('GARCH') || 
                    line.includes('Constant Variance') ||
                    line.includes('Model:')
                );
                
                if (garchLine) {
                    // Extract GARCH(p,q) pattern
                    const garchMatch = garchLine.match(/GARCH\(\d+,\d+\)/);
                    if (garchMatch) {
                        modelSpec = garchMatch[0];
                    } else {
                        // Look for other patterns like "GARCH Model Results"
                        if (garchLine.includes('GARCH')) {
                            modelSpec = garchLine.trim();
                        } else {
                            // Fallback: construct from the fact it's a GARCH model
                            modelSpec = 'GARCH Model';
                        }
                    }
                } else {
                    // If no specific GARCH line found, assume it's a GARCH(1,1)
                    modelSpec = 'GARCH(1,1)';
                }
            }
            
            // Extract volatility forecast information
            let volForecastInfo = 'No volatility forecast available';
            if (result.forecast) {
                if (Array.isArray(result.forecast) && result.forecast.length > 0) {
                    volForecastInfo = `${result.forecast.length} volatility forecast points`;
                } else if (result.forecast.volatility_forecast) {
                    volForecastInfo = `Volatility forecast available`;
                }
            }
            
            // Extract model parameters
            let parameters = '';
            if (result.model_summary && result.model_summary.parameters) {
                const params = result.model_summary.parameters;
                parameters = `
                    <div class="row mt-3">
                        ${Object.keys(params).map(param => 
                            `<div class="col-6"><strong>${param}:</strong> ${params[param]?.toFixed(4) || 'N/A'}</div>`
                        ).join('')}
                    </div>
                `;
            }
            
            // Extract fit statistics
            let fitStats = '';
            if (result.model_summary && result.model_summary.fit_statistics) {
                const stats = result.model_summary.fit_statistics;
                fitStats = `
                    <div class="row mt-3">
                        <div class="col-6"><strong>Log Likelihood:</strong> ${stats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>AIC:</strong> ${stats.aic?.toFixed(4) || 'N/A'}</div>
                    </div>
                `;
            }
            
            // Extract interpretation
            let interpretation = '';
            if (result.interpretation) {
                if (typeof result.interpretation === 'string') {
                    interpretation = result.interpretation;
                } else if (result.interpretation.executive_summary) {
                    interpretation = typeof result.interpretation.executive_summary === 'string' ? 
                        result.interpretation.executive_summary : 
                        JSON.stringify(result.interpretation.executive_summary);
                }
            }
            
            garchHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">GARCH Model - ${symbol}</h6>
                        <span class="badge bg-success">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Specification</h6>
                                <div class="bg-light p-2 rounded">
                                    <code>${modelSpec}</code>
                                </div>
                                ${parameters}
                                ${fitStats}
                            </div>
                            <div class="col-md-6">
                                <h6>Volatility Forecast</h6>
                                <p>${volForecastInfo}</p>
                                ${result.forecast && result.forecast.length > 0 ? 
                                    `<p><small class="text-muted">Latest forecast: ${result.forecast[result.forecast.length - 1]?.toFixed(6) || 'N/A'}</small></p>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ${interpretation ? 
                            `<div class="mt-3">
                                <h6>Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation}</small>
                                </div>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        });
        
        garchContainer.innerHTML = garchHtml || '<div class="alert alert-warning">No GARCH results available.</div>';
    }
    
    // Initialize VAR results
    const varContainer = document.getElementById('var-results-container');
    if (varModel && Object.keys(varModel).length > 0) {
        initializeVarResults(varModel);
    } else {
        varContainer.innerHTML = '<p class="text-muted">VAR model results not available.</p>';
    }
}

function initializeNextStepTab() {
    const iterateButton = document.getElementById('iterate-analysis-btn');
    if (iterateButton) {
        iterateButton.addEventListener('click', function() {
            console.log("'Continue to iterate?' button clicked.");
            
            if (!rawApiResponse || !rawApiResponse.execution_configuration) {
                alert('Could not find the original execution configuration to iterate upon.');
                return;
            }
            
            // Add the filename to the configuration to be stored
            const config = rawApiResponse.execution_configuration;
            if (rawApiResponse.processed_results && rawApiResponse.processed_results.overview) {
                config.filename = rawApiResponse.processed_results.overview.filename || 'Previously used file';
            }

            // Store the execution configuration for the analysis page to use
            sessionStorage.setItem('analysisIterationConfig', JSON.stringify(config));
            console.log("Stored execution configuration for iteration:", config);
            
            // Redirect to the analysis page
            window.location.href = '/analysis/'; 
        });
    }
}

function initializeOverviewTab() {
    if (!processedResults.overview) return;
    
    const overview = processedResults.overview;
    
    // Populate executive summary
    const executiveSummaryContent = document.getElementById('executive-summary-content');
    if (overview.executive_summary && executiveSummaryContent) {
        let summaryHtml = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Symbols Analyzed:</strong> ${overview.executive_summary.symbols_analyzed || 0}
                </div>
                <div class="col-md-6">
                    <strong>Analysis Date:</strong> ${overview.executive_summary.analysis_date || 'Unknown'}
                </div>
            </div>
            <div class="mb-3">
                <strong>Symbols:</strong> ${overview.executive_summary.symbols_list || 'None'}
            </div>
        `;
        
        if (overview.executive_summary.key_findings && overview.executive_summary.key_findings.length > 0) {
            summaryHtml += '<div class="mb-3"><strong>Key Findings:</strong><ul class="mt-2">';
            overview.executive_summary.key_findings.forEach(finding => {
                summaryHtml += `<li>${finding}</li>`;
            });
            summaryHtml += '</ul></div>';
        }
        
        executiveSummaryContent.innerHTML = summaryHtml;
    }
    
    // Populate key insights
    const keyInsightsContent = document.getElementById('key-insights-content');
    if (overview.key_insights && keyInsightsContent) {
        if (overview.key_insights.length > 0) {
            let insightsHtml = '<ul class="list-unstyled">';
            overview.key_insights.forEach(insight => {
                insightsHtml += `<li class="mb-2"><i class="bi bi-lightbulb text-warning me-2"></i>${insight}</li>`;
            });
            insightsHtml += '</ul>';
            keyInsightsContent.innerHTML = insightsHtml;
        } else {
            keyInsightsContent.innerHTML = '<p class="text-muted">No specific insights available.</p>';
        }
    }
    
    // Populate analysis summary
    const analysisSummaryContent = document.getElementById('analysis-summary-content');
    if (overview.analysis_summary && analysisSummaryContent) {
        const summary = overview.analysis_summary;
        let summaryHtml = `
            <div class="mb-2"><strong>Data Points:</strong> ${summary.data_points || 0}</div>
        `;
        
        if (summary.models_fitted && summary.models_fitted.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Models Fitted:</strong> ${summary.models_fitted.join(', ')}</div>`;
        }
        
        if (summary.tests_performed && summary.tests_performed.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Tests Performed:</strong> ${summary.tests_performed.join(', ')}</div>`;
        }
        
        analysisSummaryContent.innerHTML = summaryHtml;
    }
}

function initializeExecutionConfigTab() {
    // Check if we have execution configuration data in the raw API response
    if (!rawApiResponse || !rawApiResponse.execution_configuration) {
        console.log("No execution configuration data found");
        // Show placeholder message for all sections
        const configSections = [
            'data-source-config-content',
            'data-processing-config-content', 
            'arima-config-content',
            'garch-config-content',
            'spillover-config-content',
            'execution-metadata-content'
        ];
        
        configSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.innerHTML = '<p class="text-muted">Configuration data not available</p>';
            }
        });
        return;
    }
    
    const config = rawApiResponse.execution_configuration;
    console.log("Initializing execution configuration tab with data:", Object.keys(config));
    
    // Data Source Configuration
    const dataSourceContent = document.getElementById('data-source-config-content');
    if (config.data_source && dataSourceContent) {
        const ds = config.data_source;
        let dataSourceHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Source Type:</strong>
                        <span class="badge bg-primary ms-2">${ds.source_type || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Date Range:</strong> ${ds.start_date || 'N/A'} to ${ds.end_date || 'N/A'}
                    </div>
                    <div class="mb-3">
                        <strong>Symbols:</strong> ${Array.isArray(ds.symbols) ? ds.symbols.join(', ') : 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
        `;
        
        if (ds.source_type === 'synthetic' && ds.synthetic_anchor_prices) {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Synthetic Parameters:</strong>
                    <div class="bg-light p-2 rounded mt-2">
                        <small><strong>Anchor Prices:</strong></small><br>
            `;
            if (typeof ds.synthetic_anchor_prices === 'object') {
                Object.entries(ds.synthetic_anchor_prices).forEach(([symbol, price]) => {
                    dataSourceHtml += `<small>${symbol}: $${price}</small><br>`;
                });
            }
            dataSourceHtml += `
                        <small><strong>Random Seed:</strong> ${ds.synthetic_random_seed || 'N/A'}</small>
                    </div>
                </div>
            `;
        } else {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Data Source:</strong> Real market data
                    <div class="text-muted">
                        <small>Fetched from external API</small>
                    </div>
                </div>
            `;
        }
        
        dataSourceHtml += '</div></div>';
        dataSourceContent.innerHTML = dataSourceHtml;
    }
    
    // Data Processing Configuration
    const dataProcessingContent = document.getElementById('data-processing-config-content');
    if (config.data_processing && dataProcessingContent) {
        const dp = config.data_processing;
        let processingHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Scaling Method:</strong>
                        <span class="badge bg-info ms-2">${dp.scaling_method || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Missing Values Handling:</strong>
                        ${dp.missing_values_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">Strategy: ${dp.missing_values_strategy || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Stationarity Testing:</strong>
                        ${dp.stationarity_test_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">P-value threshold: ${dp.stationarity_test_p_value_threshold || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
            </div>
        `;
        dataProcessingContent.innerHTML = processingHtml;
    }
    
    // ARIMA Configuration
    const arimaConfigContent = document.getElementById('arima-config-content');
    if (config.model_configurations && config.model_configurations.arima_params && arimaConfigContent) {
        const arima = config.model_configurations.arima_params;
        let arimaHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> ARIMA(${arima.p || 'N/A'}, ${arima.d || 'N/A'}, ${arima.q || 'N/A'})</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${arima.forecast_steps || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${arima.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
            </div>
        `;
        arimaConfigContent.innerHTML = arimaHtml;
    }
    
    // GARCH Configuration
    const garchConfigContent = document.getElementById('garch-config-content');
    if (config.model_configurations && config.model_configurations.garch_params && garchConfigContent) {
        const garch = config.model_configurations.garch_params;
        let garchHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> GARCH(${garch.p || 'N/A'}, ${garch.q || 'N/A'})</div>
                <div class="mb-2"><strong>Distribution:</strong> ${garch.dist || 'N/A'}</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${garch.forecast_steps || 'N/A'}</div>
                <div class="mb-2"><strong>Volatility Format:</strong> ${garch.volatility_format || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${garch.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
                <div class="mb-2">
                    <strong>ARIMA Residuals Input:</strong> 
                    ${garch.residuals_as_input ? '<span class="badge bg-info">Yes</span>' : '<span class="badge bg-secondary">No</span>'}
                </div>
            </div>
        `;
        garchConfigContent.innerHTML = garchHtml;
    }
    
    // Spillover Configuration
    const spilloverConfigContent = document.getElementById('spillover-config-content');
    if (config.spillover_configuration && spilloverConfigContent) {
        const spillover = config.spillover_configuration;
        let spilloverHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Spillover Analysis:</strong>
                        ${spillover.spillover_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.spillover_enabled && spillover.spillover_params) {
            const params = spillover.spillover_params;
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Method:</strong> ${params.method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${params.forecast_horizon || 'N/A'}</small><br>
                        <small><strong>Max Lags:</strong> ${params.max_lags || 'N/A'}</small><br>
                        <small><strong>VAR Lag Selection:</strong> ${params.var_lag_selection_method || 'N/A'}</small><br>
                        <small><strong>Granger Significance:</strong> ${params.granger_significance_level || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += `
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Granger Causality:</strong>
                        ${spillover.granger_causality_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.granger_causality_enabled) {
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Max Lag:</strong> ${spillover.granger_causality_max_lag || 'N/A'}</small><br>
                        <small><strong>Analysis Method:</strong> ${spillover.spillover_analysis_method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${spillover.spillover_forecast_horizon || 'N/A'}</small><br>
                        <small><strong>VAR Max Lags:</strong> ${spillover.var_max_lags || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += '</div></div>';
        spilloverConfigContent.innerHTML = spilloverHtml;
    }
    
    // Execution Metadata
    const executionMetadataContent = document.getElementById('execution-metadata-content');
    if (config.execution_metadata && executionMetadataContent) {
        const meta = config.execution_metadata;
        
        // Format execution timestamp with consistent timezone format
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            const timeZoneShort = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0') + ' ' +
                   String(date.getHours()).padStart(2, '0') + ':' +
                   String(date.getMinutes()).padStart(2, '0') + ':' +
                   String(date.getSeconds()).padStart(2, '0') + ' ' + timeZoneShort;
        };
        
        let metadataHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Execution Time:</strong>
                        <div class="text-muted">
                            ${formatTimestamp(meta.execution_timestamp)}
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong>Processing Duration:</strong>
                        <span class="badge bg-info ms-2">${meta.execution_time_seconds ? `${meta.execution_time_seconds.toFixed(2)}s` : 'N/A'}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Configuration Source:</strong>
                        <div class="text-muted">${meta.configuration_source || 'N/A'}</div>
                    </div>
                    <div class="mb-3">
                        <strong>API Version:</strong> <span class="badge bg-secondary">${meta.api_version || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Pipeline Version:</strong> <span class="badge bg-secondary">${meta.pipeline_version || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        executionMetadataContent.innerHTML = metadataHtml;
    }
    
    console.log("Execution configuration tab initialized successfully");
}

function initializePlotsTab() {
    if (!processedResults.data_lineage) return;
    
    const lineage = processedResults.data_lineage;
    
    // Create data pipeline visualization placeholder
    const pipelineViz = document.getElementById('data-pipeline-visualization');
    if (pipelineViz && lineage.pipeline_stages) {
        let vizHtml = '<div class="d-flex justify-content-between align-items-center">';
        lineage.pipeline_stages.forEach((stage, index) => {
            const isAvailable = stage.data_available;
            const badgeClass = isAvailable ? 'bg-success' : 'bg-secondary';
            const iconClass = isAvailable ? 'bi-check-circle' : 'bi-x-circle';
            
            vizHtml += `
                <div class="text-center ${index > 0 ? 'ms-3' : ''}">
                    <div class="badge ${badgeClass} p-3 mb-2">
                        <i class="bi ${iconClass} me-2"></i>${stage.name}
                    </div>
                    <div class="small text-muted">${stage.record_count} records</div>
                </div>
            `;
            
            if (index < lineage.pipeline_stages.length - 1) {
                vizHtml += '<div class="flex-grow-1"><hr class="border-2"></div>';
            }
        });
        vizHtml += '</div>';
        pipelineViz.innerHTML = vizHtml;
    }
    
    // Initialize plot containers for each data stage
    const plotContainers = [
        'original-data-plot',
        'returns-data-plot', 
        'scaled-data-plot',
        'pre-garch-data-plot',
        'post-garch-data-plot'
    ];
    
    plotContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="text-center text-muted p-4">Data visualization will be rendered here</div>';
        }
    });
}

function initializeStatisticalTestsTab() {
    if (!processedResults.statistical_tests) return;
    
    const tests = processedResults.statistical_tests;
    
    // Initialize stationarity results
    const stationarityContainer = document.getElementById('stationarity-results-container');
    if (tests.stationarity && stationarityContainer) {
        let stationarityHtml = '';
        
        Object.keys(tests.stationarity).forEach(symbol => {
            const result = tests.stationarity[symbol];
            const isStationary = result.is_stationary;
            const badgeClass = isStationary ? 'bg-success' : 'bg-warning';
            const statusText = isStationary ? 'Stationary' : 'Non-Stationary';
            
            stationarityHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${symbol}</h6>
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>ADF Statistic:</strong> ${result.adf_statistic?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>P-Value:</strong> ${result.p_value?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>Critical Value (5%):</strong> ${result.critical_values?.['5%']?.toFixed(4) || 'N/A'}
                            </div>
                        </div>
                        ${result.interpretation ? `<div class="mt-3"><small class="text-muted">${JSON.stringify(result.interpretation)}</small></div>` : ''}
                    </div>
                </div>
            `;
        });
        
        stationarityContainer.innerHTML = stationarityHtml || '<p class="text-muted">No stationarity test results available.</p>';
    }
    
    // Initialize series statistics
    const seriesStatsContainer = document.getElementById('series-statistics-container');
    if (tests.series_statistics && seriesStatsContainer) {
        let statsHtml = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
        statsHtml += '<th>Symbol</th><th>Count (n)</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Variance</th><th>Skewness</th><th>Kurtosis</th><th>Annualized Vol</th><th>Annualized Return</th><th>Sharpe Approx</th></tr></thead><tbody>';
        
        Object.keys(tests.series_statistics).forEach(symbol => {
            const stats = tests.series_statistics[symbol];
            statsHtml += `
                <tr>
                    <td><strong>${symbol}</strong></td>
                    <td>${stats.n || 'N/A'}</td>
                    <td>${stats.mean?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.median?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.min?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.max?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.std?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.var?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.skew?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.kurt?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_vol?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_return?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.sharpe_approx?.toFixed(4) || 'N/A'}</td>
                </tr>
            `;
        });
        
        statsHtml += '</tbody></table></div>';
        seriesStatsContainer.innerHTML = statsHtml;
    }
}

function initializeModelsTab() {
    if (!processedResults.models) {
        console.log("No model data available");
        return;
    }

    const arimaModels = processedResults.models.arima;
    const garchModels = processedResults.models.garch;
    const varModel = processedResults.models.var;

    // Initialize ARIMA statistics table
    const arimaStatsContainer = document.getElementById('arima-statistics-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let statsHtml = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Symbol</th>
                            <th>AIC</th>
                            <th>BIC</th>
                            <th>HQIC</th>
                            <th>Log-Likelihood</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        for (const symbol in arimaModels) {
            if (arimaModels[symbol].summary_stats) {
                const stats = arimaModels[symbol].summary_stats;
                statsHtml += `
                    <tr>
                        <td><strong>${symbol}</strong></td>
                        <td>${stats.aic !== undefined ? stats.aic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.bic !== undefined ? stats.bic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.hqic !== undefined ? stats.hqic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.log_likelihood !== undefined ? stats.log_likelihood.toFixed(4) : 'N/A'}</td>
                    </tr>
                `;
            }
        }
        statsHtml += '</tbody></table></div>';
        arimaStatsContainer.innerHTML = statsHtml;
    } else {
        arimaStatsContainer.innerHTML = '<p class="text-muted">No ARIMA model statistics available.</p>';
    }

    // Initialize ARIMA results (existing logic)
    const arimaContainer = document.getElementById('arima-results-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let arimaHtml = '';
        
        Object.keys(arimaModels).forEach(symbol => {
            const result = arimaModels[symbol];
            let interpretation = {};
            
            // Handle interpretation data based on source
            if (result.interpretation) {
                interpretation = result.interpretation;
            }
            
            // Extract model specification - try different sources
            let modelSpec = 'Model specification not available';
            if (result.model_specification) {
                modelSpec = result.model_specification;
            } else if (result.summary && result.summary.model_specification) {
                modelSpec = result.summary.model_specification;
            } else if (result.model_specification) {
                modelSpec = result.model_specification;
            }
            
            // Extract parameters - try different sources
            let parameters = {};
            let parameterPValues = {};
            let parameterSignificance = {};
            
            if (result.parameters) {
                parameters = result.parameters || {};
                parameterPValues = result.parameter_pvalues || {};
                parameterSignificance = result.parameter_significance || {};
            } else if (result.summary) {
                parameters = result.summary.parameters || {};
                parameterPValues = result.summary.parameter_pvalues || {};
                parameterSignificance = result.summary.parameter_significance || {};
            }
            
            // Extract forecast information
            let forecastInfo = 'No forecast available';
            let forecastData = null;
            
            if (result.forecast) {
                forecastData = result.forecast;
            }
            
            if (forecastData) {
                if (forecastData.point_forecasts && forecastData.point_forecasts.length > 0) {
                    forecastInfo = `${forecastData.point_forecasts.length} forecast points`;
                    if (forecastData.forecast_method) {
                        forecastInfo += ` (${forecastData.forecast_method})`;
                    }
                } else if (Array.isArray(forecastData) && forecastData.length > 0) {
                    forecastInfo = `${forecastData.length} forecast points`;
                }
            }
            
            // Extract model statistics
            let modelStats = {};
            if (result.summary) {
                modelStats = {
                    sample_size: result.summary.sample_size,
                    log_likelihood: result.summary.log_likelihood,
                    aic: result.summary.aic,
                    bic: result.summary.bic,
                    hqic: result.summary.hqic
                };
            }
            
            // Extract residual statistics
            let residualStats = {};
            if (result.residual_statistics) {
                residualStats = result.residual_statistics;
            } else if (result.summary && result.summary.residual_statistics) {
                residualStats = result.summary.residual_statistics;
            }
            
            // Build comprehensive model information
            arimaHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">ARIMA Model - ${symbol}</h6>
                        <span class="badge bg-primary">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-gear"></i> Model Specification</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <code>${modelSpec}</code>
                                </div>
                                
                                <h6><i class="bi bi-info-circle"></i> Model Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Sample Size:</strong> ${modelStats.sample_size || 'N/A'}</div>
                                    <div class="col-6"><strong>Log Likelihood:</strong> ${modelStats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>AIC:</strong> ${modelStats.aic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>BIC:</strong> ${modelStats.bic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>HQIC:</strong> ${modelStats.hqic?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-sliders"></i> Model Parameters</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameters).length > 0 ? Object.entries(parameters).map(([param, value]) => 
                                        `<div class="d-flex justify-content-between">
                                            <span><strong>${param}:</strong></span>
                                            <span>${value?.toFixed(4) || 'N/A'}</span>
                                        </div>`
                                    ).join('') : '<div class="text-muted">No parameters available</div>'}
                                </div>
                                
                                <h6><i class="bi bi-check-circle"></i> Parameter Significance</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameterPValues).length > 0 && Object.keys(parameterSignificance).length > 0 ? 
                                        Object.entries(parameterPValues).map(([param, pvalue]) => {
                                            const significance = parameterSignificance[param];
                                            const badgeClass = significance === 'Not significant' ? 'bg-warning' : 'bg-success';
                                            return `<div class="d-flex justify-content-between align-items-center mb-1">
                                                <span><strong>${param}:</strong></span>
                                                <div>
                                                    <span class="me-2">p=${pvalue?.toFixed(4) || 'N/A'}</span>
                                                    <span class="badge ${badgeClass}">${significance || 'N/A'}</span>
                                                </div>
                                            </div>`;
                                        }).join('') : 
                                        '<div class="text-muted">No significance data available</div>'
                                    }
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <h6><i class="bi bi-graph-up-arrow"></i> Forecast Information</h6>
                                <p>${forecastInfo}</p>
                                ${forecastData && forecastData.confidence_intervals ? 
                                    '<p><small class="text-muted">Includes confidence intervals</small></p>' : 
                                    ''
                                }
                                
                                <h6><i class="bi bi-bar-chart"></i> Residual Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Mean:</strong> ${residualStats.mean?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Variance:</strong> ${residualStats.variance?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Min:</strong> ${residualStats.min?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Max:</strong> ${residualStats.max?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Autocorr Lag1:</strong> ${residualStats.autocorrelation_lag1?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-clipboard-check"></i> Diagnostic Tests</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <div><strong>Ljung-Box Test:</strong> ${residualStats.ljung_box_test || 'See full summary'}</div>
                                    <div><strong>Jarque-Bera Test:</strong> ${residualStats.jarque_bera_test || 'See full summary'}</div>
                                </div>
                                
                                ${forecastData && ((forecastData.point_forecasts && forecastData.point_forecasts.length > 0) || (Array.isArray(forecastData) && forecastData.length > 0)) ? `
                                    <h6><i class="bi bi-graph-up"></i> Latest Forecasts</h6>
                                    <div class="bg-light p-2 rounded">
                                        ${(() => {
                                            const forecasts = forecastData.point_forecasts || forecastData;
                                            if (Array.isArray(forecasts)) {
                                                return forecasts.slice(0, 3).map((forecast, index) => 
                                                    `<div>Step ${index + 1}: ${forecast.toFixed(6)}</div>`
                                                ).join('') + 
                                                (forecasts.length > 3 ? 
                                                    `<small class="text-muted">... and ${forecasts.length - 3} more</small>` : 
                                                    ''
                                                );
                                            }
                                            return '<div class="text-muted">No forecast data</div>';
                                        })()}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${interpretation.executive_summary ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="alert alert-info mb-2">
                                            <strong>Bottom Line:</strong> ${interpretation.executive_summary.bottom_line || 'No summary available'}
                                        </div>
                                        <div class="alert alert-secondary mb-2">
                                            <strong>Business Impact:</strong> ${interpretation.executive_summary.business_impact || 'No impact assessment'}
                                        </div>
                                        <div class="alert alert-primary mb-2">
                                            <strong>Recommendation:</strong> ${interpretation.executive_summary.recommendation || 'No recommendations'}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        ${interpretation.key_findings ? `
                                            <div class="mb-2">
                                                <strong>Key Findings:</strong>
                                                <ul class="small mt-1">
                                                    ${interpretation.key_findings.forecast_trend ? `<li><strong>Trend:</strong> ${interpretation.key_findings.forecast_trend}</li>` : ''}
                                                    ${interpretation.key_findings.model_performance ? `<li><strong>Performance:</strong> ${interpretation.key_findings.model_performance}</li>` : ''}
                                                    ${interpretation.key_findings.forecast_statistics ? `<li><strong>Statistics:</strong> ${interpretation.key_findings.forecast_statistics}</li>` : ''}
                                                </ul>
                                            </div>
                                        ` : ''}
                                        ${interpretation.business_context && interpretation.business_context.what_is_arima ? `
                                            <div class="mb-2">
                                                <small class="text-muted">
                                                    <strong>About ARIMA:</strong> ${interpretation.business_context.what_is_arima.substring(0, 150)}...
                                                </small>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : interpretation.executive_summary && typeof interpretation.executive_summary === 'string' ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation.executive_summary}</small>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        arimaContainer.innerHTML = arimaHtml;
        console.log(`ARIMA models displayed: ${Object.keys(arimaModels).length} symbols`);
    } else {
        arimaContainer.innerHTML = '<div class="alert alert-warning">No ARIMA results available.</div>';
        console.log("No ARIMA results found in any data source");
    }
    
    // Initialize GARCH results
    const garchContainer = document.getElementById('garch-results-container');
    if (garchModels && Object.keys(garchModels).length > 0) {
        let garchHtml = '';
        
        Object.keys(garchModels).forEach(symbol => {
            const result = garchModels[symbol];
            
            // Extract model specification from fitted_model summary text
            let modelSpec = 'Model specification not available';
            if (result.fitted_model && typeof result.fitted_model === 'string') {
                // Parse GARCH model specification from the fitted_model summary
                const summaryLines = result.fitted_model.split('\n');
                
                // Look for GARCH model specification in various formats
                const garchLine = summaryLines.find(line => 
                    line.includes('GARCH') || 
                    line.includes('Constant Variance') ||
                    line.includes('Model:')
                );
                
                if (garchLine) {
                    // Extract GARCH(p,q) pattern
                    const garchMatch = garchLine.match(/GARCH\(\d+,\d+\)/);
                    if (garchMatch) {
                        modelSpec = garchMatch[0];
                    } else {
                        // Look for other patterns like "GARCH Model Results"
                        if (garchLine.includes('GARCH')) {
                            modelSpec = garchLine.trim();
                        } else {
                            // Fallback: construct from the fact it's a GARCH model
                            modelSpec = 'GARCH Model';
                        }
                    }
                } else {
                    // If no specific GARCH line found, assume it's a GARCH(1,1)
                    modelSpec = 'GARCH(1,1)';
                }
            }
            
            // Extract volatility forecast information
            let volForecastInfo = 'No volatility forecast available';
            if (result.forecast) {
                if (Array.isArray(result.forecast) && result.forecast.length > 0) {
                    volForecastInfo = `${result.forecast.length} volatility forecast points`;
                } else if (result.forecast.volatility_forecast) {
                    volForecastInfo = `Volatility forecast available`;
                }
            }
            
            // Extract model parameters
            let parameters = '';
            if (result.model_summary && result.model_summary.parameters) {
                const params = result.model_summary.parameters;
                parameters = `
                    <div class="row mt-3">
                        ${Object.keys(params).map(param => 
                            `<div class="col-6"><strong>${param}:</strong> ${params[param]?.toFixed(4) || 'N/A'}</div>`
                        ).join('')}
                    </div>
                `;
            }
            
            // Extract fit statistics
            let fitStats = '';
            if (result.model_summary && result.model_summary.fit_statistics) {
                const stats = result.model_summary.fit_statistics;
                fitStats = `
                    <div class="row mt-3">
                        <div class="col-6"><strong>Log Likelihood:</strong> ${stats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>AIC:</strong> ${stats.aic?.toFixed(4) || 'N/A'}</div>
                    </div>
                `;
            }
            
            // Extract interpretation
            let interpretation = '';
            if (result.interpretation) {
                if (typeof result.interpretation === 'string') {
                    interpretation = result.interpretation;
                } else if (result.interpretation.executive_summary) {
                    interpretation = typeof result.interpretation.executive_summary === 'string' ? 
                        result.interpretation.executive_summary : 
                        JSON.stringify(result.interpretation.executive_summary);
                }
            }
            
            garchHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">GARCH Model - ${symbol}</h6>
                        <span class="badge bg-success">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Specification</h6>
                                <div class="bg-light p-2 rounded">
                                    <code>${modelSpec}</code>
                                </div>
                                ${parameters}
                                ${fitStats}
                            </div>
                            <div class="col-md-6">
                                <h6>Volatility Forecast</h6>
                                <p>${volForecastInfo}</p>
                                ${result.forecast && result.forecast.length > 0 ? 
                                    `<p><small class="text-muted">Latest forecast: ${result.forecast[result.forecast.length - 1]?.toFixed(6) || 'N/A'}</small></p>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ${interpretation ? 
                            `<div class="mt-3">
                                <h6>Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation}</small>
                                </div>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        });
        
        garchContainer.innerHTML = garchHtml || '<div class="alert alert-warning">No GARCH results available.</div>';
    }
    
    // Initialize VAR results
    const varContainer = document.getElementById('var-results-container');
    if (varModel && Object.keys(varModel).length > 0) {
        initializeVarResults(varModel);
    } else {
        varContainer.innerHTML = '<p class="text-muted">VAR model results not available.</p>';
    }
}

function initializeNextStepTab() {
    const iterateButton = document.getElementById('iterate-analysis-btn');
    if (iterateButton) {
        iterateButton.addEventListener('click', function() {
            console.log("'Continue to iterate?' button clicked.");
            
            if (!rawApiResponse || !rawApiResponse.execution_configuration) {
                alert('Could not find the original execution configuration to iterate upon.');
                return;
            }
            
            // Add the filename to the configuration to be stored
            const config = rawApiResponse.execution_configuration;
            if (rawApiResponse.processed_results && rawApiResponse.processed_results.overview) {
                config.filename = rawApiResponse.processed_results.overview.filename || 'Previously used file';
            }

            // Store the execution configuration for the analysis page to use
            sessionStorage.setItem('analysisIterationConfig', JSON.stringify(config));
            console.log("Stored execution configuration for iteration:", config);
            
            // Redirect to the analysis page
            window.location.href = '/analysis/'; 
        });
    }
}

function initializeOverviewTab() {
    if (!processedResults.overview) return;
    
    const overview = processedResults.overview;
    
    // Populate executive summary
    const executiveSummaryContent = document.getElementById('executive-summary-content');
    if (overview.executive_summary && executiveSummaryContent) {
        let summaryHtml = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Symbols Analyzed:</strong> ${overview.executive_summary.symbols_analyzed || 0}
                </div>
                <div class="col-md-6">
                    <strong>Analysis Date:</strong> ${overview.executive_summary.analysis_date || 'Unknown'}
                </div>
            </div>
            <div class="mb-3">
                <strong>Symbols:</strong> ${overview.executive_summary.symbols_list || 'None'}
            </div>
        `;
        
        if (overview.executive_summary.key_findings && overview.executive_summary.key_findings.length > 0) {
            summaryHtml += '<div class="mb-3"><strong>Key Findings:</strong><ul class="mt-2">';
            overview.executive_summary.key_findings.forEach(finding => {
                summaryHtml += `<li>${finding}</li>`;
            });
            summaryHtml += '</ul></div>';
        }
        
        executiveSummaryContent.innerHTML = summaryHtml;
    }
    
    // Populate key insights
    const keyInsightsContent = document.getElementById('key-insights-content');
    if (overview.key_insights && keyInsightsContent) {
        if (overview.key_insights.length > 0) {
            let insightsHtml = '<ul class="list-unstyled">';
            overview.key_insights.forEach(insight => {
                insightsHtml += `<li class="mb-2"><i class="bi bi-lightbulb text-warning me-2"></i>${insight}</li>`;
            });
            insightsHtml += '</ul>';
            keyInsightsContent.innerHTML = insightsHtml;
        } else {
            keyInsightsContent.innerHTML = '<p class="text-muted">No specific insights available.</p>';
        }
    }
    
    // Populate analysis summary
    const analysisSummaryContent = document.getElementById('analysis-summary-content');
    if (overview.analysis_summary && analysisSummaryContent) {
        const summary = overview.analysis_summary;
        let summaryHtml = `
            <div class="mb-2"><strong>Data Points:</strong> ${summary.data_points || 0}</div>
        `;
        
        if (summary.models_fitted && summary.models_fitted.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Models Fitted:</strong> ${summary.models_fitted.join(', ')}</div>`;
        }
        
        if (summary.tests_performed && summary.tests_performed.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Tests Performed:</strong> ${summary.tests_performed.join(', ')}</div>`;
        }
        
        analysisSummaryContent.innerHTML = summaryHtml;
    }
}

function initializeExecutionConfigTab() {
    // Check if we have execution configuration data in the raw API response
    if (!rawApiResponse || !rawApiResponse.execution_configuration) {
        console.log("No execution configuration data found");
        // Show placeholder message for all sections
        const configSections = [
            'data-source-config-content',
            'data-processing-config-content', 
            'arima-config-content',
            'garch-config-content',
            'spillover-config-content',
            'execution-metadata-content'
        ];
        
        configSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.innerHTML = '<p class="text-muted">Configuration data not available</p>';
            }
        });
        return;
    }
    
    const config = rawApiResponse.execution_configuration;
    console.log("Initializing execution configuration tab with data:", Object.keys(config));
    
    // Data Source Configuration
    const dataSourceContent = document.getElementById('data-source-config-content');
    if (config.data_source && dataSourceContent) {
        const ds = config.data_source;
        let dataSourceHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Source Type:</strong>
                        <span class="badge bg-primary ms-2">${ds.source_type || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Date Range:</strong> ${ds.start_date || 'N/A'} to ${ds.end_date || 'N/A'}
                    </div>
                    <div class="mb-3">
                        <strong>Symbols:</strong> ${Array.isArray(ds.symbols) ? ds.symbols.join(', ') : 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
        `;
        
        if (ds.source_type === 'synthetic' && ds.synthetic_anchor_prices) {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Synthetic Parameters:</strong>
                    <div class="bg-light p-2 rounded mt-2">
                        <small><strong>Anchor Prices:</strong></small><br>
            `;
            if (typeof ds.synthetic_anchor_prices === 'object') {
                Object.entries(ds.synthetic_anchor_prices).forEach(([symbol, price]) => {
                    dataSourceHtml += `<small>${symbol}: $${price}</small><br>`;
                });
            }
            dataSourceHtml += `
                        <small><strong>Random Seed:</strong> ${ds.synthetic_random_seed || 'N/A'}</small>
                    </div>
                </div>
            `;
        } else {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Data Source:</strong> Real market data
                    <div class="text-muted">
                        <small>Fetched from external API</small>
                    </div>
                </div>
            `;
        }
        
        dataSourceHtml += '</div></div>';
        dataSourceContent.innerHTML = dataSourceHtml;
    }
    
    // Data Processing Configuration
    const dataProcessingContent = document.getElementById('data-processing-config-content');
    if (config.data_processing && dataProcessingContent) {
        const dp = config.data_processing;
        let processingHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Scaling Method:</strong>
                        <span class="badge bg-info ms-2">${dp.scaling_method || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Missing Values Handling:</strong>
                        ${dp.missing_values_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">Strategy: ${dp.missing_values_strategy || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Stationarity Testing:</strong>
                        ${dp.stationarity_test_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">P-value threshold: ${dp.stationarity_test_p_value_threshold || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
            </div>
        `;
        dataProcessingContent.innerHTML = processingHtml;
    }
    
    // ARIMA Configuration
    const arimaConfigContent = document.getElementById('arima-config-content');
    if (config.model_configurations && config.model_configurations.arima_params && arimaConfigContent) {
        const arima = config.model_configurations.arima_params;
        let arimaHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> ARIMA(${arima.p || 'N/A'}, ${arima.d || 'N/A'}, ${arima.q || 'N/A'})</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${arima.forecast_steps || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${arima.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
            </div>
        `;
        arimaConfigContent.innerHTML = arimaHtml;
    }
    
    // GARCH Configuration
    const garchConfigContent = document.getElementById('garch-config-content');
    if (config.model_configurations && config.model_configurations.garch_params && garchConfigContent) {
        const garch = config.model_configurations.garch_params;
        let garchHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> GARCH(${garch.p || 'N/A'}, ${garch.q || 'N/A'})</div>
                <div class="mb-2"><strong>Distribution:</strong> ${garch.dist || 'N/A'}</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${garch.forecast_steps || 'N/A'}</div>
                <div class="mb-2"><strong>Volatility Format:</strong> ${garch.volatility_format || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${garch.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
                <div class="mb-2">
                    <strong>ARIMA Residuals Input:</strong> 
                    ${garch.residuals_as_input ? '<span class="badge bg-info">Yes</span>' : '<span class="badge bg-secondary">No</span>'}
                </div>
            </div>
        `;
        garchConfigContent.innerHTML = garchHtml;
    }
    
    // Spillover Configuration
    const spilloverConfigContent = document.getElementById('spillover-config-content');
    if (config.spillover_configuration && spilloverConfigContent) {
        const spillover = config.spillover_configuration;
        let spilloverHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Spillover Analysis:</strong>
                        ${spillover.spillover_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.spillover_enabled && spillover.spillover_params) {
            const params = spillover.spillover_params;
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Method:</strong> ${params.method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${params.forecast_horizon || 'N/A'}</small><br>
                        <small><strong>Max Lags:</strong> ${params.max_lags || 'N/A'}</small><br>
                        <small><strong>VAR Lag Selection:</strong> ${params.var_lag_selection_method || 'N/A'}</small><br>
                        <small><strong>Granger Significance:</strong> ${params.granger_significance_level || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += `
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Granger Causality:</strong>
                        ${spillover.granger_causality_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.granger_causality_enabled) {
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Max Lag:</strong> ${spillover.granger_causality_max_lag || 'N/A'}</small><br>
                        <small><strong>Analysis Method:</strong> ${spillover.spillover_analysis_method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${spillover.spillover_forecast_horizon || 'N/A'}</small><br>
                        <small><strong>VAR Max Lags:</strong> ${spillover.var_max_lags || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += '</div></div>';
        spilloverConfigContent.innerHTML = spilloverHtml;
    }
    
    // Execution Metadata
    const executionMetadataContent = document.getElementById('execution-metadata-content');
    if (config.execution_metadata && executionMetadataContent) {
        const meta = config.execution_metadata;
        
        // Format execution timestamp with consistent timezone format
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            const timeZoneShort = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0') + ' ' +
                   String(date.getHours()).padStart(2, '0') + ':' +
                   String(date.getMinutes()).padStart(2, '0') + ':' +
                   String(date.getSeconds()).padStart(2, '0') + ' ' + timeZoneShort;
        };
        
        let metadataHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Execution Time:</strong>
                        <div class="text-muted">
                            ${formatTimestamp(meta.execution_timestamp)}
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong>Processing Duration:</strong>
                        <span class="badge bg-info ms-2">${meta.execution_time_seconds ? `${meta.execution_time_seconds.toFixed(2)}s` : 'N/A'}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Configuration Source:</strong>
                        <div class="text-muted">${meta.configuration_source || 'N/A'}</div>
                    </div>
                    <div class="mb-3">
                        <strong>API Version:</strong> <span class="badge bg-secondary">${meta.api_version || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Pipeline Version:</strong> <span class="badge bg-secondary">${meta.pipeline_version || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        executionMetadataContent.innerHTML = metadataHtml;
    }
    
    console.log("Execution configuration tab initialized successfully");
}

function initializePlotsTab() {
    if (!processedResults.data_lineage) return;
    
    const lineage = processedResults.data_lineage;
    
    // Create data pipeline visualization placeholder
    const pipelineViz = document.getElementById('data-pipeline-visualization');
    if (pipelineViz && lineage.pipeline_stages) {
        let vizHtml = '<div class="d-flex justify-content-between align-items-center">';
        lineage.pipeline_stages.forEach((stage, index) => {
            const isAvailable = stage.data_available;
            const badgeClass = isAvailable ? 'bg-success' : 'bg-secondary';
            const iconClass = isAvailable ? 'bi-check-circle' : 'bi-x-circle';
            
            vizHtml += `
                <div class="text-center ${index > 0 ? 'ms-3' : ''}">
                    <div class="badge ${badgeClass} p-3 mb-2">
                        <i class="bi ${iconClass} me-2"></i>${stage.name}
                    </div>
                    <div class="small text-muted">${stage.record_count} records</div>
                </div>
            `;
            
            if (index < lineage.pipeline_stages.length - 1) {
                vizHtml += '<div class="flex-grow-1"><hr class="border-2"></div>';
            }
        });
        vizHtml += '</div>';
        pipelineViz.innerHTML = vizHtml;
    }
    
    // Initialize plot containers for each data stage
    const plotContainers = [
        'original-data-plot',
        'returns-data-plot', 
        'scaled-data-plot',
        'pre-garch-data-plot',
        'post-garch-data-plot'
    ];
    
    plotContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="text-center text-muted p-4">Data visualization will be rendered here</div>';
        }
    });
}

function initializeStatisticalTestsTab() {
    if (!processedResults.statistical_tests) return;
    
    const tests = processedResults.statistical_tests;
    
    // Initialize stationarity results
    const stationarityContainer = document.getElementById('stationarity-results-container');
    if (tests.stationarity && stationarityContainer) {
        let stationarityHtml = '';
        
        Object.keys(tests.stationarity).forEach(symbol => {
            const result = tests.stationarity[symbol];
            const isStationary = result.is_stationary;
            const badgeClass = isStationary ? 'bg-success' : 'bg-warning';
            const statusText = isStationary ? 'Stationary' : 'Non-Stationary';
            
            stationarityHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${symbol}</h6>
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>ADF Statistic:</strong> ${result.adf_statistic?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>P-Value:</strong> ${result.p_value?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>Critical Value (5%):</strong> ${result.critical_values?.['5%']?.toFixed(4) || 'N/A'}
                            </div>
                        </div>
                        ${result.interpretation ? `<div class="mt-3"><small class="text-muted">${JSON.stringify(result.interpretation)}</small></div>` : ''}
                    </div>
                </div>
            `;
        });
        
        stationarityContainer.innerHTML = stationarityHtml || '<p class="text-muted">No stationarity test results available.</p>';
    }
    
    // Initialize series statistics
    const seriesStatsContainer = document.getElementById('series-statistics-container');
    if (tests.series_statistics && seriesStatsContainer) {
        let statsHtml = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
        statsHtml += '<th>Symbol</th><th>Count (n)</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Variance</th><th>Skewness</th><th>Kurtosis</th><th>Annualized Vol</th><th>Annualized Return</th><th>Sharpe Approx</th></tr></thead><tbody>';
        
        Object.keys(tests.series_statistics).forEach(symbol => {
            const stats = tests.series_statistics[symbol];
            statsHtml += `
                <tr>
                    <td><strong>${symbol}</strong></td>
                    <td>${stats.n || 'N/A'}</td>
                    <td>${stats.mean?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.median?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.min?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.max?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.std?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.var?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.skew?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.kurt?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_vol?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_return?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.sharpe_approx?.toFixed(4) || 'N/A'}</td>
                </tr>
            `;
        });
        
        statsHtml += '</tbody></table></div>';
        seriesStatsContainer.innerHTML = statsHtml;
    }
}

function initializeModelsTab() {
    if (!processedResults.models) {
        console.log("No model data available");
        return;
    }

    const arimaModels = processedResults.models.arima;
    const garchModels = processedResults.models.garch;
    const varModel = processedResults.models.var;

    // Initialize ARIMA statistics table
    const arimaStatsContainer = document.getElementById('arima-statistics-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let statsHtml = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Symbol</th>
                            <th>AIC</th>
                            <th>BIC</th>
                            <th>HQIC</th>
                            <th>Log-Likelihood</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        for (const symbol in arimaModels) {
            if (arimaModels[symbol].summary_stats) {
                const stats = arimaModels[symbol].summary_stats;
                statsHtml += `
                    <tr>
                        <td><strong>${symbol}</strong></td>
                        <td>${stats.aic !== undefined ? stats.aic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.bic !== undefined ? stats.bic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.hqic !== undefined ? stats.hqic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.log_likelihood !== undefined ? stats.log_likelihood.toFixed(4) : 'N/A'}</td>
                    </tr>
                `;
            }
        }
        statsHtml += '</tbody></table></div>';
        arimaStatsContainer.innerHTML = statsHtml;
    } else {
        arimaStatsContainer.innerHTML = '<p class="text-muted">No ARIMA model statistics available.</p>';
    }

    // Initialize ARIMA results (existing logic)
    const arimaContainer = document.getElementById('arima-results-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let arimaHtml = '';
        
        Object.keys(arimaModels).forEach(symbol => {
            const result = arimaModels[symbol];
            let interpretation = {};
            
            // Handle interpretation data based on source
            if (result.interpretation) {
                interpretation = result.interpretation;
            }
            
            // Extract model specification - try different sources
            let modelSpec = 'Model specification not available';
            if (result.model_specification) {
                modelSpec = result.model_specification;
            } else if (result.summary && result.summary.model_specification) {
                modelSpec = result.summary.model_specification;
            } else if (result.model_specification) {
                modelSpec = result.model_specification;
            }
            
            // Extract parameters - try different sources
            let parameters = {};
            let parameterPValues = {};
            let parameterSignificance = {};
            
            if (result.parameters) {
                parameters = result.parameters || {};
                parameterPValues = result.parameter_pvalues || {};
                parameterSignificance = result.parameter_significance || {};
            } else if (result.summary) {
                parameters = result.summary.parameters || {};
                parameterPValues = result.summary.parameter_pvalues || {};
                parameterSignificance = result.summary.parameter_significance || {};
            }
            
            // Extract forecast information
            let forecastInfo = 'No forecast available';
            let forecastData = null;
            
            if (result.forecast) {
                forecastData = result.forecast;
            }
            
            if (forecastData) {
                if (forecastData.point_forecasts && forecastData.point_forecasts.length > 0) {
                    forecastInfo = `${forecastData.point_forecasts.length} forecast points`;
                    if (forecastData.forecast_method) {
                        forecastInfo += ` (${forecastData.forecast_method})`;
                    }
                } else if (Array.isArray(forecastData) && forecastData.length > 0) {
                    forecastInfo = `${forecastData.length} forecast points`;
                }
            }
            
            // Extract model statistics
            let modelStats = {};
            if (result.summary) {
                modelStats = {
                    sample_size: result.summary.sample_size,
                    log_likelihood: result.summary.log_likelihood,
                    aic: result.summary.aic,
                    bic: result.summary.bic,
                    hqic: result.summary.hqic
                };
            }
            
            // Extract residual statistics
            let residualStats = {};
            if (result.residual_statistics) {
                residualStats = result.residual_statistics;
            } else if (result.summary && result.summary.residual_statistics) {
                residualStats = result.summary.residual_statistics;
            }
            
            // Build comprehensive model information
            arimaHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">ARIMA Model - ${symbol}</h6>
                        <span class="badge bg-primary">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-gear"></i> Model Specification</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <code>${modelSpec}</code>
                                </div>
                                
                                <h6><i class="bi bi-info-circle"></i> Model Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Sample Size:</strong> ${modelStats.sample_size || 'N/A'}</div>
                                    <div class="col-6"><strong>Log Likelihood:</strong> ${modelStats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>AIC:</strong> ${modelStats.aic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>BIC:</strong> ${modelStats.bic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>HQIC:</strong> ${modelStats.hqic?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-sliders"></i> Model Parameters</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameters).length > 0 ? Object.entries(parameters).map(([param, value]) => 
                                        `<div class="d-flex justify-content-between">
                                            <span><strong>${param}:</strong></span>
                                            <span>${value?.toFixed(4) || 'N/A'}</span>
                                        </div>`
                                    ).join('') : '<div class="text-muted">No parameters available</div>'}
                                </div>
                                
                                <h6><i class="bi bi-check-circle"></i> Parameter Significance</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameterPValues).length > 0 && Object.keys(parameterSignificance).length > 0 ? 
                                        Object.entries(parameterPValues).map(([param, pvalue]) => {
                                            const significance = parameterSignificance[param];
                                            const badgeClass = significance === 'Not significant' ? 'bg-warning' : 'bg-success';
                                            return `<div class="d-flex justify-content-between align-items-center mb-1">
                                                <span><strong>${param}:</strong></span>
                                                <div>
                                                    <span class="me-2">p=${pvalue?.toFixed(4) || 'N/A'}</span>
                                                    <span class="badge ${badgeClass}">${significance || 'N/A'}</span>
                                                </div>
                                            </div>`;
                                        }).join('') : 
                                        '<div class="text-muted">No significance data available</div>'
                                    }
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <h6><i class="bi bi-graph-up-arrow"></i> Forecast Information</h6>
                                <p>${forecastInfo}</p>
                                ${forecastData && forecastData.confidence_intervals ? 
                                    '<p><small class="text-muted">Includes confidence intervals</small></p>' : 
                                    ''
                                }
                                
                                <h6><i class="bi bi-bar-chart"></i> Residual Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Mean:</strong> ${residualStats.mean?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Variance:</strong> ${residualStats.variance?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Min:</strong> ${residualStats.min?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Max:</strong> ${residualStats.max?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Autocorr Lag1:</strong> ${residualStats.autocorrelation_lag1?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-clipboard-check"></i> Diagnostic Tests</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <div><strong>Ljung-Box Test:</strong> ${residualStats.ljung_box_test || 'See full summary'}</div>
                                    <div><strong>Jarque-Bera Test:</strong> ${residualStats.jarque_bera_test || 'See full summary'}</div>
                                </div>
                                
                                ${forecastData && ((forecastData.point_forecasts && forecastData.point_forecasts.length > 0) || (Array.isArray(forecastData) && forecastData.length > 0)) ? `
                                    <h6><i class="bi bi-graph-up"></i> Latest Forecasts</h6>
                                    <div class="bg-light p-2 rounded">
                                        ${(() => {
                                            const forecasts = forecastData.point_forecasts || forecastData;
                                            if (Array.isArray(forecasts)) {
                                                return forecasts.slice(0, 3).map((forecast, index) => 
                                                    `<div>Step ${index + 1}: ${forecast.toFixed(6)}</div>`
                                                ).join('') + 
                                                (forecasts.length > 3 ? 
                                                    `<small class="text-muted">... and ${forecasts.length - 3} more</small>` : 
                                                    ''
                                                );
                                            }
                                            return '<div class="text-muted">No forecast data</div>';
                                        })()}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${interpretation.executive_summary ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="alert alert-info mb-2">
                                            <strong>Bottom Line:</strong> ${interpretation.executive_summary.bottom_line || 'No summary available'}
                                        </div>
                                        <div class="alert alert-secondary mb-2">
                                            <strong>Business Impact:</strong> ${interpretation.executive_summary.business_impact || 'No impact assessment'}
                                        </div>
                                        <div class="alert alert-primary mb-2">
                                            <strong>Recommendation:</strong> ${interpretation.executive_summary.recommendation || 'No recommendations'}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        ${interpretation.key_findings ? `
                                            <div class="mb-2">
                                                <strong>Key Findings:</strong>
                                                <ul class="small mt-1">
                                                    ${interpretation.key_findings.forecast_trend ? `<li><strong>Trend:</strong> ${interpretation.key_findings.forecast_trend}</li>` : ''}
                                                    ${interpretation.key_findings.model_performance ? `<li><strong>Performance:</strong> ${interpretation.key_findings.model_performance}</li>` : ''}
                                                    ${interpretation.key_findings.forecast_statistics ? `<li><strong>Statistics:</strong> ${interpretation.key_findings.forecast_statistics}</li>` : ''}
                                                </ul>
                                            </div>
                                        ` : ''}
                                        ${interpretation.business_context && interpretation.business_context.what_is_arima ? `
                                            <div class="mb-2">
                                                <small class="text-muted">
                                                    <strong>About ARIMA:</strong> ${interpretation.business_context.what_is_arima.substring(0, 150)}...
                                                </small>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : interpretation.executive_summary && typeof interpretation.executive_summary === 'string' ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation.executive_summary}</small>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        arimaContainer.innerHTML = arimaHtml;
        console.log(`ARIMA models displayed: ${Object.keys(arimaModels).length} symbols`);
    } else {
        arimaContainer.innerHTML = '<div class="alert alert-warning">No ARIMA results available.</div>';
        console.log("No ARIMA results found in any data source");
    }
    
    // Initialize GARCH results
    const garchContainer = document.getElementById('garch-results-container');
    if (garchModels && Object.keys(garchModels).length > 0) {
        let garchHtml = '';
        
        Object.keys(garchModels).forEach(symbol => {
            const result = garchModels[symbol];
            
            // Extract model specification from fitted_model summary text
            let modelSpec = 'Model specification not available';
            if (result.fitted_model && typeof result.fitted_model === 'string') {
                // Parse GARCH model specification from the fitted_model summary
                const summaryLines = result.fitted_model.split('\n');
                
                // Look for GARCH model specification in various formats
                const garchLine = summaryLines.find(line => 
                    line.includes('GARCH') || 
                    line.includes('Constant Variance') ||
                    line.includes('Model:')
                );
                
                if (garchLine) {
                    // Extract GARCH(p,q) pattern
                    const garchMatch = garchLine.match(/GARCH\(\d+,\d+\)/);
                    if (garchMatch) {
                        modelSpec = garchMatch[0];
                    } else {
                        // Look for other patterns like "GARCH Model Results"
                        if (garchLine.includes('GARCH')) {
                            modelSpec = garchLine.trim();
                        } else {
                            // Fallback: construct from the fact it's a GARCH model
                            modelSpec = 'GARCH Model';
                        }
                    }
                } else {
                    // If no specific GARCH line found, assume it's a GARCH(1,1)
                    modelSpec = 'GARCH(1,1)';
                }
            }
            
            // Extract volatility forecast information
            let volForecastInfo = 'No volatility forecast available';
            if (result.forecast) {
                if (Array.isArray(result.forecast) && result.forecast.length > 0) {
                    volForecastInfo = `${result.forecast.length} volatility forecast points`;
                } else if (result.forecast.volatility_forecast) {
                    volForecastInfo = `Volatility forecast available`;
                }
            }
            
            // Extract model parameters
            let parameters = '';
            if (result.model_summary && result.model_summary.parameters) {
                const params = result.model_summary.parameters;
                parameters = `
                    <div class="row mt-3">
                        ${Object.keys(params).map(param => 
                            `<div class="col-6"><strong>${param}:</strong> ${params[param]?.toFixed(4) || 'N/A'}</div>`
                        ).join('')}
                    </div>
                `;
            }
            
            // Extract fit statistics
            let fitStats = '';
            if (result.model_summary && result.model_summary.fit_statistics) {
                const stats = result.model_summary.fit_statistics;
                fitStats = `
                    <div class="row mt-3">
                        <div class="col-6"><strong>Log Likelihood:</strong> ${stats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>AIC:</strong> ${stats.aic?.toFixed(4) || 'N/A'}</div>
                    </div>
                `;
            }
            
            // Extract interpretation
            let interpretation = '';
            if (result.interpretation) {
                if (typeof result.interpretation === 'string') {
                    interpretation = result.interpretation;
                } else if (result.interpretation.executive_summary) {
                    interpretation = typeof result.interpretation.executive_summary === 'string' ? 
                        result.interpretation.executive_summary : 
                        JSON.stringify(result.interpretation.executive_summary);
                }
            }
            
            garchHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">GARCH Model - ${symbol}</h6>
                        <span class="badge bg-success">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Specification</h6>
                                <div class="bg-light p-2 rounded">
                                    <code>${modelSpec}</code>
                                </div>
                                ${parameters}
                                ${fitStats}
                            </div>
                            <div class="col-md-6">
                                <h6>Volatility Forecast</h6>
                                <p>${volForecastInfo}</p>
                                ${result.forecast && result.forecast.length > 0 ? 
                                    `<p><small class="text-muted">Latest forecast: ${result.forecast[result.forecast.length - 1]?.toFixed(6) || 'N/A'}</small></p>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ${interpretation ? 
                            `<div class="mt-3">
                                <h6>Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation}</small>
                                </div>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        });
        
        garchContainer.innerHTML = garchHtml || '<div class="alert alert-warning">No GARCH results available.</div>';
    }
    
    // Initialize VAR results
    const varContainer = document.getElementById('var-results-container');
    if (varModel && Object.keys(varModel).length > 0) {
        initializeVarResults(varModel);
    } else {
        varContainer.innerHTML = '<p class="text-muted">VAR model results not available.</p>';
    }
}

function initializeNextStepTab() {
    const iterateButton = document.getElementById('iterate-analysis-btn');
    if (iterateButton) {
        iterateButton.addEventListener('click', function() {
            console.log("'Continue to iterate?' button clicked.");
            
            if (!rawApiResponse || !rawApiResponse.execution_configuration) {
                alert('Could not find the original execution configuration to iterate upon.');
                return;
            }
            
            // Add the filename to the configuration to be stored
            const config = rawApiResponse.execution_configuration;
            if (rawApiResponse.processed_results && rawApiResponse.processed_results.overview) {
                config.filename = rawApiResponse.processed_results.overview.filename || 'Previously used file';
            }

            // Store the execution configuration for the analysis page to use
            sessionStorage.setItem('analysisIterationConfig', JSON.stringify(config));
            console.log("Stored execution configuration for iteration:", config);
            
            // Redirect to the analysis page
            window.location.href = '/analysis/'; 
        });
    }
}

function initializeOverviewTab() {
    if (!processedResults.overview) return;
    
    const overview = processedResults.overview;
    
    // Populate executive summary
    const executiveSummaryContent = document.getElementById('executive-summary-content');
    if (overview.executive_summary && executiveSummaryContent) {
        let summaryHtml = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Symbols Analyzed:</strong> ${overview.executive_summary.symbols_analyzed || 0}
                </div>
                <div class="col-md-6">
                    <strong>Analysis Date:</strong> ${overview.executive_summary.analysis_date || 'Unknown'}
                </div>
            </div>
            <div class="mb-3">
                <strong>Symbols:</strong> ${overview.executive_summary.symbols_list || 'None'}
            </div>
        `;
        
        if (overview.executive_summary.key_findings && overview.executive_summary.key_findings.length > 0) {
            summaryHtml += '<div class="mb-3"><strong>Key Findings:</strong><ul class="mt-2">';
            overview.executive_summary.key_findings.forEach(finding => {
                summaryHtml += `<li>${finding}</li>`;
            });
            summaryHtml += '</ul></div>';
        }
        
        executiveSummaryContent.innerHTML = summaryHtml;
    }
    
    // Populate key insights
    const keyInsightsContent = document.getElementById('key-insights-content');
    if (overview.key_insights && keyInsightsContent) {
        if (overview.key_insights.length > 0) {
            let insightsHtml = '<ul class="list-unstyled">';
            overview.key_insights.forEach(insight => {
                insightsHtml += `<li class="mb-2"><i class="bi bi-lightbulb text-warning me-2"></i>${insight}</li>`;
            });
            insightsHtml += '</ul>';
            keyInsightsContent.innerHTML = insightsHtml;
        } else {
            keyInsightsContent.innerHTML = '<p class="text-muted">No specific insights available.</p>';
        }
    }
    
    // Populate analysis summary
    const analysisSummaryContent = document.getElementById('analysis-summary-content');
    if (overview.analysis_summary && analysisSummaryContent) {
        const summary = overview.analysis_summary;
        let summaryHtml = `
            <div class="mb-2"><strong>Data Points:</strong> ${summary.data_points || 0}</div>
        `;
        
        if (summary.models_fitted && summary.models_fitted.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Models Fitted:</strong> ${summary.models_fitted.join(', ')}</div>`;
        }
        
        if (summary.tests_performed && summary.tests_performed.length > 0) {
            summaryHtml += `<div class="mb-2"><strong>Tests Performed:</strong> ${summary.tests_performed.join(', ')}</div>`;
        }
        
        analysisSummaryContent.innerHTML = summaryHtml;
    }
}

function initializeExecutionConfigTab() {
    // Check if we have execution configuration data in the raw API response
    if (!rawApiResponse || !rawApiResponse.execution_configuration) {
        console.log("No execution configuration data found");
        // Show placeholder message for all sections
        const configSections = [
            'data-source-config-content',
            'data-processing-config-content', 
            'arima-config-content',
            'garch-config-content',
            'spillover-config-content',
            'execution-metadata-content'
        ];
        
        configSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.innerHTML = '<p class="text-muted">Configuration data not available</p>';
            }
        });
        return;
    }
    
    const config = rawApiResponse.execution_configuration;
    console.log("Initializing execution configuration tab with data:", Object.keys(config));
    
    // Data Source Configuration
    const dataSourceContent = document.getElementById('data-source-config-content');
    if (config.data_source && dataSourceContent) {
        const ds = config.data_source;
        let dataSourceHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Source Type:</strong>
                        <span class="badge bg-primary ms-2">${ds.source_type || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Date Range:</strong> ${ds.start_date || 'N/A'} to ${ds.end_date || 'N/A'}
                    </div>
                    <div class="mb-3">
                        <strong>Symbols:</strong> ${Array.isArray(ds.symbols) ? ds.symbols.join(', ') : 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
        `;
        
        if (ds.source_type === 'synthetic' && ds.synthetic_anchor_prices) {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Synthetic Parameters:</strong>
                    <div class="bg-light p-2 rounded mt-2">
                        <small><strong>Anchor Prices:</strong></small><br>
            `;
            if (typeof ds.synthetic_anchor_prices === 'object') {
                Object.entries(ds.synthetic_anchor_prices).forEach(([symbol, price]) => {
                    dataSourceHtml += `<small>${symbol}: $${price}</small><br>`;
                });
            }
            dataSourceHtml += `
                        <small><strong>Random Seed:</strong> ${ds.synthetic_random_seed || 'N/A'}</small>
                    </div>
                </div>
            `;
        } else {
            dataSourceHtml += `
                <div class="mb-3">
                    <strong>Data Source:</strong> Real market data
                    <div class="text-muted">
                        <small>Fetched from external API</small>
                    </div>
                </div>
            `;
        }
        
        dataSourceHtml += '</div></div>';
        dataSourceContent.innerHTML = dataSourceHtml;
    }
    
    // Data Processing Configuration
    const dataProcessingContent = document.getElementById('data-processing-config-content');
    if (config.data_processing && dataProcessingContent) {
        const dp = config.data_processing;
        let processingHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Scaling Method:</strong>
                        <span class="badge bg-info ms-2">${dp.scaling_method || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Missing Values Handling:</strong>
                        ${dp.missing_values_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">Strategy: ${dp.missing_values_strategy || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Stationarity Testing:</strong>
                        ${dp.stationarity_test_enabled ? 
                            `<span class="badge bg-success ms-2">Enabled</span><br><small class="text-muted">P-value threshold: ${dp.stationarity_test_p_value_threshold || 'N/A'}</small>` : 
                            '<span class="badge bg-secondary ms-2">Disabled</span>'
                        }
                    </div>
                </div>
            </div>
        `;
        dataProcessingContent.innerHTML = processingHtml;
    }
    
    // ARIMA Configuration
    const arimaConfigContent = document.getElementById('arima-config-content');
    if (config.model_configurations && config.model_configurations.arima_params && arimaConfigContent) {
        const arima = config.model_configurations.arima_params;
        let arimaHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> ARIMA(${arima.p || 'N/A'}, ${arima.d || 'N/A'}, ${arima.q || 'N/A'})</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${arima.forecast_steps || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${arima.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
            </div>
        `;
        arimaConfigContent.innerHTML = arimaHtml;
    }
    
    // GARCH Configuration
    const garchConfigContent = document.getElementById('garch-config-content');
    if (config.model_configurations && config.model_configurations.garch_params && garchConfigContent) {
        const garch = config.model_configurations.garch_params;
        let garchHtml = `
            <div class="bg-light p-3 rounded">
                <div class="mb-2"><strong>Model Order:</strong> GARCH(${garch.p || 'N/A'}, ${garch.q || 'N/A'})</div>
                <div class="mb-2"><strong>Distribution:</strong> ${garch.dist || 'N/A'}</div>
                <div class="mb-2"><strong>Forecast Steps:</strong> ${garch.forecast_steps || 'N/A'}</div>
                <div class="mb-2"><strong>Volatility Format:</strong> ${garch.volatility_format || 'N/A'}</div>
                <div class="mb-2">
                    <strong>Status:</strong> 
                    ${garch.enabled ? '<span class="badge bg-success">Enabled</span>' : '<span class="badge bg-secondary">Disabled</span>'}
                </div>
                <div class="mb-2">
                    <strong>ARIMA Residuals Input:</strong> 
                    ${garch.residuals_as_input ? '<span class="badge bg-info">Yes</span>' : '<span class="badge bg-secondary">No</span>'}
                </div>
            </div>
        `;
        garchConfigContent.innerHTML = garchHtml;
    }
    
    // Spillover Configuration
    const spilloverConfigContent = document.getElementById('spillover-config-content');
    if (config.spillover_configuration && spilloverConfigContent) {
        const spillover = config.spillover_configuration;
        let spilloverHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Spillover Analysis:</strong>
                        ${spillover.spillover_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.spillover_enabled && spillover.spillover_params) {
            const params = spillover.spillover_params;
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Method:</strong> ${params.method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${params.forecast_horizon || 'N/A'}</small><br>
                        <small><strong>Max Lags:</strong> ${params.max_lags || 'N/A'}</small><br>
                        <small><strong>VAR Lag Selection:</strong> ${params.var_lag_selection_method || 'N/A'}</small><br>
                        <small><strong>Granger Significance:</strong> ${params.granger_significance_level || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += `
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Granger Causality:</strong>
                        ${spillover.granger_causality_enabled ? '<span class="badge bg-success ms-2">Enabled</span>' : '<span class="badge bg-secondary ms-2">Disabled</span>'}
                    </div>
        `;
        
        if (spillover.granger_causality_enabled) {
            spilloverHtml += `
                    <div class="bg-light p-2 rounded mb-3">
                        <small><strong>Max Lag:</strong> ${spillover.granger_causality_max_lag || 'N/A'}</small><br>
                        <small><strong>Analysis Method:</strong> ${spillover.spillover_analysis_method || 'N/A'}</small><br>
                        <small><strong>Forecast Horizon:</strong> ${spillover.spillover_forecast_horizon || 'N/A'}</small><br>
                        <small><strong>VAR Max Lags:</strong> ${spillover.var_max_lags || 'N/A'}</small>
                    </div>
            `;
        }
        
        spilloverHtml += '</div></div>';
        spilloverConfigContent.innerHTML = spilloverHtml;
    }
    
    // Execution Metadata
    const executionMetadataContent = document.getElementById('execution-metadata-content');
    if (config.execution_metadata && executionMetadataContent) {
        const meta = config.execution_metadata;
        
        // Format execution timestamp with consistent timezone format
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            const timeZoneShort = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0') + ' ' +
                   String(date.getHours()).padStart(2, '0') + ':' +
                   String(date.getMinutes()).padStart(2, '0') + ':' +
                   String(date.getSeconds()).padStart(2, '0') + ' ' + timeZoneShort;
        };
        
        let metadataHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Execution Time:</strong>
                        <div class="text-muted">
                            ${formatTimestamp(meta.execution_timestamp)}
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong>Processing Duration:</strong>
                        <span class="badge bg-info ms-2">${meta.execution_time_seconds ? `${meta.execution_time_seconds.toFixed(2)}s` : 'N/A'}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <strong>Configuration Source:</strong>
                        <div class="text-muted">${meta.configuration_source || 'N/A'}</div>
                    </div>
                    <div class="mb-3">
                        <strong>API Version:</strong> <span class="badge bg-secondary">${meta.api_version || 'N/A'}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Pipeline Version:</strong> <span class="badge bg-secondary">${meta.pipeline_version || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        executionMetadataContent.innerHTML = metadataHtml;
    }
    
    console.log("Execution configuration tab initialized successfully");
}

function initializePlotsTab() {
    if (!processedResults.data_lineage) return;
    
    const lineage = processedResults.data_lineage;
    
    // Create data pipeline visualization placeholder
    const pipelineViz = document.getElementById('data-pipeline-visualization');
    if (pipelineViz && lineage.pipeline_stages) {
        let vizHtml = '<div class="d-flex justify-content-between align-items-center">';
        lineage.pipeline_stages.forEach((stage, index) => {
            const isAvailable = stage.data_available;
            const badgeClass = isAvailable ? 'bg-success' : 'bg-secondary';
            const iconClass = isAvailable ? 'bi-check-circle' : 'bi-x-circle';
            
            vizHtml += `
                <div class="text-center ${index > 0 ? 'ms-3' : ''}">
                    <div class="badge ${badgeClass} p-3 mb-2">
                        <i class="bi ${iconClass} me-2"></i>${stage.name}
                    </div>
                    <div class="small text-muted">${stage.record_count} records</div>
                </div>
            `;
            
            if (index < lineage.pipeline_stages.length - 1) {
                vizHtml += '<div class="flex-grow-1"><hr class="border-2"></div>';
            }
        });
        vizHtml += '</div>';
        pipelineViz.innerHTML = vizHtml;
    }
    
    // Initialize plot containers for each data stage
    const plotContainers = [
        'original-data-plot',
        'returns-data-plot', 
        'scaled-data-plot',
        'pre-garch-data-plot',
        'post-garch-data-plot'
    ];
    
    plotContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="text-center text-muted p-4">Data visualization will be rendered here</div>';
        }
    });
}

function initializeStatisticalTestsTab() {
    if (!processedResults.statistical_tests) return;
    
    const tests = processedResults.statistical_tests;
    
    // Initialize stationarity results
    const stationarityContainer = document.getElementById('stationarity-results-container');
    if (tests.stationarity && stationarityContainer) {
        let stationarityHtml = '';
        
        Object.keys(tests.stationarity).forEach(symbol => {
            const result = tests.stationarity[symbol];
            const isStationary = result.is_stationary;
            const badgeClass = isStationary ? 'bg-success' : 'bg-warning';
            const statusText = isStationary ? 'Stationary' : 'Non-Stationary';
            
            stationarityHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${symbol}</h6>
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>ADF Statistic:</strong> ${result.adf_statistic?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>P-Value:</strong> ${result.p_value?.toFixed(4) || 'N/A'}
                            </div>
                            <div class="col-md-4">
                                <strong>Critical Value (5%):</strong> ${result.critical_values?.['5%']?.toFixed(4) || 'N/A'}
                            </div>
                        </div>
                        ${result.interpretation ? `<div class="mt-3"><small class="text-muted">${JSON.stringify(result.interpretation)}</small></div>` : ''}
                    </div>
                </div>
            `;
        });
        
        stationarityContainer.innerHTML = stationarityHtml || '<p class="text-muted">No stationarity test results available.</p>';
    }
    
    // Initialize series statistics
    const seriesStatsContainer = document.getElementById('series-statistics-container');
    if (tests.series_statistics && seriesStatsContainer) {
        let statsHtml = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
        statsHtml += '<th>Symbol</th><th>Count (n)</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Variance</th><th>Skewness</th><th>Kurtosis</th><th>Annualized Vol</th><th>Annualized Return</th><th>Sharpe Approx</th></tr></thead><tbody>';
        
        Object.keys(tests.series_statistics).forEach(symbol => {
            const stats = tests.series_statistics[symbol];
            statsHtml += `
                <tr>
                    <td><strong>${symbol}</strong></td>
                    <td>${stats.n || 'N/A'}</td>
                    <td>${stats.mean?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.median?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.min?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.max?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.std?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.var?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.skew?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.kurt?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_vol?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.annualized_return?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.sharpe_approx?.toFixed(4) || 'N/A'}</td>
                </tr>
            `;
        });
        
        statsHtml += '</tbody></table></div>';
        seriesStatsContainer.innerHTML = statsHtml;
    }
}

function initializeModelsTab() {
    if (!processedResults.models) {
        console.log("No model data available");
        return;
    }

    const arimaModels = processedResults.models.arima;
    const garchModels = processedResults.models.garch;
    const varModel = processedResults.models.var;

    // Initialize ARIMA statistics table
    const arimaStatsContainer = document.getElementById('arima-statistics-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let statsHtml = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Symbol</th>
                            <th>AIC</th>
                            <th>BIC</th>
                            <th>HQIC</th>
                            <th>Log-Likelihood</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        for (const symbol in arimaModels) {
            if (arimaModels[symbol].summary_stats) {
                const stats = arimaModels[symbol].summary_stats;
                statsHtml += `
                    <tr>
                        <td><strong>${symbol}</strong></td>
                        <td>${stats.aic !== undefined ? stats.aic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.bic !== undefined ? stats.bic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.hqic !== undefined ? stats.hqic.toFixed(4) : 'N/A'}</td>
                        <td>${stats.log_likelihood !== undefined ? stats.log_likelihood.toFixed(4) : 'N/A'}</td>
                    </tr>
                `;
            }
        }
        statsHtml += '</tbody></table></div>';
        arimaStatsContainer.innerHTML = statsHtml;
    } else {
        arimaStatsContainer.innerHTML = '<p class="text-muted">No ARIMA model statistics available.</p>';
    }

    // Initialize ARIMA results (existing logic)
    const arimaContainer = document.getElementById('arima-results-container');
    if (arimaModels && Object.keys(arimaModels).length > 0) {
        let arimaHtml = '';
        
        Object.keys(arimaModels).forEach(symbol => {
            const result = arimaModels[symbol];
            let interpretation = {};
            
            // Handle interpretation data based on source
            if (result.interpretation) {
                interpretation = result.interpretation;
            }
            
            // Extract model specification - try different sources
            let modelSpec = 'Model specification not available';
            if (result.model_specification) {
                modelSpec = result.model_specification;
            } else if (result.summary && result.summary.model_specification) {
                modelSpec = result.summary.model_specification;
            } else if (result.model_specification) {
                modelSpec = result.model_specification;
            }
            
            // Extract parameters - try different sources
            let parameters = {};
            let parameterPValues = {};
            let parameterSignificance = {};
            
            if (result.parameters) {
                parameters = result.parameters || {};
                parameterPValues = result.parameter_pvalues || {};
                parameterSignificance = result.parameter_significance || {};
            } else if (result.summary) {
                parameters = result.summary.parameters || {};
                parameterPValues = result.summary.parameter_pvalues || {};
                parameterSignificance = result.summary.parameter_significance || {};
            }
            
            // Extract forecast information
            let forecastInfo = 'No forecast available';
            let forecastData = null;
            
            if (result.forecast) {
                forecastData = result.forecast;
            }
            
            if (forecastData) {
                if (forecastData.point_forecasts && forecastData.point_forecasts.length > 0) {
                    forecastInfo = `${forecastData.point_forecasts.length} forecast points`;
                    if (forecastData.forecast_method) {
                        forecastInfo += ` (${forecastData.forecast_method})`;
                    }
                } else if (Array.isArray(forecastData) && forecastData.length > 0) {
                    forecastInfo = `${forecastData.length} forecast points`;
                }
            }
            
            // Extract model statistics
            let modelStats = {};
            if (result.summary) {
                modelStats = {
                    sample_size: result.summary.sample_size,
                    log_likelihood: result.summary.log_likelihood,
                    aic: result.summary.aic,
                    bic: result.summary.bic,
                    hqic: result.summary.hqic
                };
            }
            
            // Extract residual statistics
            let residualStats = {};
            if (result.residual_statistics) {
                residualStats = result.residual_statistics;
            } else if (result.summary && result.summary.residual_statistics) {
                residualStats = result.summary.residual_statistics;
            }
            
            // Build comprehensive model information
            arimaHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">ARIMA Model - ${symbol}</h6>
                        <span class="badge bg-primary">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-gear"></i> Model Specification</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <code>${modelSpec}</code>
                                </div>
                                
                                <h6><i class="bi bi-info-circle"></i> Model Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Sample Size:</strong> ${modelStats.sample_size || 'N/A'}</div>
                                    <div class="col-6"><strong>Log Likelihood:</strong> ${modelStats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>AIC:</strong> ${modelStats.aic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>BIC:</strong> ${modelStats.bic?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>HQIC:</strong> ${modelStats.hqic?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-sliders"></i> Model Parameters</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameters).length > 0 ? Object.entries(parameters).map(([param, value]) => 
                                        `<div class="d-flex justify-content-between">
                                            <span><strong>${param}:</strong></span>
                                            <span>${value?.toFixed(4) || 'N/A'}</span>
                                        </div>`
                                    ).join('') : '<div class="text-muted">No parameters available</div>'}
                                </div>
                                
                                <h6><i class="bi bi-check-circle"></i> Parameter Significance</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    ${Object.keys(parameterPValues).length > 0 && Object.keys(parameterSignificance).length > 0 ? 
                                        Object.entries(parameterPValues).map(([param, pvalue]) => {
                                            const significance = parameterSignificance[param];
                                            const badgeClass = significance === 'Not significant' ? 'bg-warning' : 'bg-success';
                                            return `<div class="d-flex justify-content-between align-items-center mb-1">
                                                <span><strong>${param}:</strong></span>
                                                <div>
                                                    <span class="me-2">p=${pvalue?.toFixed(4) || 'N/A'}</span>
                                                    <span class="badge ${badgeClass}">${significance || 'N/A'}</span>
                                                </div>
                                            </div>`;
                                        }).join('') : 
                                        '<div class="text-muted">No significance data available</div>'
                                    }
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <h6><i class="bi bi-graph-up-arrow"></i> Forecast Information</h6>
                                <p>${forecastInfo}</p>
                                ${forecastData && forecastData.confidence_intervals ? 
                                    '<p><small class="text-muted">Includes confidence intervals</small></p>' : 
                                    ''
                                }
                                
                                <h6><i class="bi bi-bar-chart"></i> Residual Statistics</h6>
                                <div class="row mb-3">
                                    <div class="col-6"><strong>Mean:</strong> ${residualStats.mean?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Variance:</strong> ${residualStats.variance?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Min:</strong> ${residualStats.min?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Max:</strong> ${residualStats.max?.toFixed(4) || 'N/A'}</div>
                                    <div class="col-6"><strong>Autocorr Lag1:</strong> ${residualStats.autocorrelation_lag1?.toFixed(4) || 'N/A'}</div>
                                </div>
                                
                                <h6><i class="bi bi-clipboard-check"></i> Diagnostic Tests</h6>
                                <div class="bg-light p-2 rounded mb-3">
                                    <div><strong>Ljung-Box Test:</strong> ${residualStats.ljung_box_test || 'See full summary'}</div>
                                    <div><strong>Jarque-Bera Test:</strong> ${residualStats.jarque_bera_test || 'See full summary'}</div>
                                </div>
                                
                                ${forecastData && ((forecastData.point_forecasts && forecastData.point_forecasts.length > 0) || (Array.isArray(forecastData) && forecastData.length > 0)) ? `
                                    <h6><i class="bi bi-graph-up"></i> Latest Forecasts</h6>
                                    <div class="bg-light p-2 rounded">
                                        ${(() => {
                                            const forecasts = forecastData.point_forecasts || forecastData;
                                            if (Array.isArray(forecasts)) {
                                                return forecasts.slice(0, 3).map((forecast, index) => 
                                                    `<div>Step ${index + 1}: ${forecast.toFixed(6)}</div>`
                                                ).join('') + 
                                                (forecasts.length > 3 ? 
                                                    `<small class="text-muted">... and ${forecasts.length - 3} more</small>` : 
                                                    ''
                                                );
                                            }
                                            return '<div class="text-muted">No forecast data</div>';
                                        })()}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${interpretation.executive_summary ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="alert alert-info mb-2">
                                            <strong>Bottom Line:</strong> ${interpretation.executive_summary.bottom_line || 'No summary available'}
                                        </div>
                                        <div class="alert alert-secondary mb-2">
                                            <strong>Business Impact:</strong> ${interpretation.executive_summary.business_impact || 'No impact assessment'}
                                        </div>
                                        <div class="alert alert-primary mb-2">
                                            <strong>Recommendation:</strong> ${interpretation.executive_summary.recommendation || 'No recommendations'}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        ${interpretation.key_findings ? `
                                            <div class="mb-2">
                                                <strong>Key Findings:</strong>
                                                <ul class="small mt-1">
                                                    ${interpretation.key_findings.forecast_trend ? `<li><strong>Trend:</strong> ${interpretation.key_findings.forecast_trend}</li>` : ''}
                                                    ${interpretation.key_findings.model_performance ? `<li><strong>Performance:</strong> ${interpretation.key_findings.model_performance}</li>` : ''}
                                                    ${interpretation.key_findings.forecast_statistics ? `<li><strong>Statistics:</strong> ${interpretation.key_findings.forecast_statistics}</li>` : ''}
                                                </ul>
                                            </div>
                                        ` : ''}
                                        ${interpretation.business_context && interpretation.business_context.what_is_arima ? `
                                            <div class="mb-2">
                                                <small class="text-muted">
                                                    <strong>About ARIMA:</strong> ${interpretation.business_context.what_is_arima.substring(0, 150)}...
                                                </small>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : interpretation.executive_summary && typeof interpretation.executive_summary === 'string' ? `
                            <div class="mt-3">
                                <h6><i class="bi bi-lightbulb"></i> Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation.executive_summary}</small>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        arimaContainer.innerHTML = arimaHtml;
        console.log(`ARIMA models displayed: ${Object.keys(arimaModels).length} symbols`);
    } else {
        arimaContainer.innerHTML = '<div class="alert alert-warning">No ARIMA results available.</div>';
        console.log("No ARIMA results found in any data source");
    }
    
    // Initialize GARCH results
    const garchContainer = document.getElementById('garch-results-container');
    if (garchModels && Object.keys(garchModels).length > 0) {
        let garchHtml = '';
        
        Object.keys(garchModels).forEach(symbol => {
            const result = garchModels[symbol];
            
            // Extract model specification from fitted_model summary text
            let modelSpec = 'Model specification not available';
            if (result.fitted_model && typeof result.fitted_model === 'string') {
                // Parse GARCH model specification from the fitted_model summary
                const summaryLines = result.fitted_model.split('\n');
                
                // Look for GARCH model specification in various formats
                const garchLine = summaryLines.find(line => 
                    line.includes('GARCH') || 
                    line.includes('Constant Variance') ||
                    line.includes('Model:')
                );
                
                if (garchLine) {
                    // Extract GARCH(p,q) pattern
                    const garchMatch = garchLine.match(/GARCH\(\d+,\d+\)/);
                    if (garchMatch) {
                        modelSpec = garchMatch[0];
                    } else {
                        // Look for other patterns like "GARCH Model Results"
                        if (garchLine.includes('GARCH')) {
                            modelSpec = garchLine.trim();
                        } else {
                            // Fallback: construct from the fact it's a GARCH model
                            modelSpec = 'GARCH Model';
                        }
                    }
                } else {
                    // If no specific GARCH line found, assume it's a GARCH(1,1)
                    modelSpec = 'GARCH(1,1)';
                }
            }
            
            // Extract volatility forecast information
            let volForecastInfo = 'No volatility forecast available';
            if (result.forecast) {
                if (Array.isArray(result.forecast) && result.forecast.length > 0) {
                    volForecastInfo = `${result.forecast.length} volatility forecast points`;
                } else if (result.forecast.volatility_forecast) {
                    volForecastInfo = `Volatility forecast available`;
                }
            }
            
            // Extract model parameters
            let parameters = '';
            if (result.model_summary && result.model_summary.parameters) {
                const params = result.model_summary.parameters;
                parameters = `
                    <div class="row mt-3">
                        ${Object.keys(params).map(param => 
                            `<div class="col-6"><strong>${param}:</strong> ${params[param]?.toFixed(4) || 'N/A'}</div>`
                        ).join('')}
                    </div>
                `;
            }
            
            // Extract fit statistics
            let fitStats = '';
            if (result.model_summary && result.model_summary.fit_statistics) {
                const stats = result.model_summary.fit_statistics;
                fitStats = `
                    <div class="row mt-3">
                        <div class="col-6"><strong>Log Likelihood:</strong> ${stats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>AIC:</strong> ${stats.aic?.toFixed(4) || 'N/A'}</div>
                    </div>
                `;
            }
            
            // Extract interpretation
            let interpretation = '';
            if (result.interpretation) {
                if (typeof result.interpretation === 'string') {
                    interpretation = result.interpretation;
                } else if (result.interpretation.executive_summary) {
                    interpretation = typeof result.interpretation.executive_summary === 'string' ? 
                        result.interpretation.executive_summary : 
                        JSON.stringify(result.interpretation.executive_summary);
                }
            }
            
            garchHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">GARCH Model - ${symbol}</h6>
                        <span class="badge bg-success">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Specification</h6>
                                <div class="bg-light p-2 rounded">
                                    <code>${modelSpec}</code>
                                </div>
                                ${parameters}
                                ${fitStats}
                            </div>
                            <div class="col-md-6">
                                <h6>Volatility Forecast</h6>
                                <p>${volForecastInfo}</p>
                                ${result.forecast && result.forecast.length > 0 ? 
                                    `<p><small class="text-muted">Latest forecast: ${result.forecast[result.forecast.length - 1]?.toFixed(6) || 'N/A'}</small></p>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ${interpretation ? 
                            `<div class="mt-3">
                                <h6>Model Interpretation</h6>
                                <div class="alert alert-info">
                                    <small>${interpretation}</small>
                                </div>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        });
        
        garchContainer.innerHTML = garchHtml || '<div class="alert alert-warning">No GARCH results available.</div>';
    }
    
    // Initialize VAR results
    const varContainer = document.getElementById('var-results-container');
    if (varModel && Object.keys(varModel).length > 0) {
        initializeVarResults(varModel);
    } else {
        varContainer.innerHTML = '<p class="text-muted">VAR model results not available.</p>';
    }
}

function initializeNextStepTab() {
    const iterateButton = document.getElementById('iterate-analysis-btn');
    if (iterateButton) {
        iterateButton.addEventListener('click', function() {
            console.log("'Continue to iterate?' button clicked.");
            
            if (!rawApiResponse || !rawApiResponse.execution_configuration) {
                alert('Could not find the original execution configuration to iterate upon.');
                return;
            }
            
            // Add the filename to the configuration to be stored
            const config = rawApiResponse.execution_configuration;
            if (rawApiResponse.processed_results && rawApiResponse.processed_results.overview) {
                config.filename = rawApiResponse.processed_results.overview.filename || 'Previously used file';
            }

            // Store the execution configuration for the analysis page to use
            sessionStorage.setItem('analysisIterationConfig', JSON.stringify(config));
            console.log("Stored execution configuration for iteration:", config);
            
            // Redirect to the analysis page
            window.location.href = '/analysis/'; 
        });
    }
}

function initializeSpilloverAnalysisTab() {
    if (!processedResults.spillover_analysis) {
        console.log("No spillover analysis data available");
        return;
    }
    
    const spillover = processedResults.spillover_analysis;
    
    // Total spillover index
    const totalSpilloverContainer = document.getElementById('total-spillover-container');
    if (spillover.total_spillover && totalSpilloverContainer) {
        const totalIndex = spillover.total_spillover.index || 0;
        const interpretation = spillover.total_spillover.interpretation || '';
        
        let spilloverHtml = `
            <div class="row align-items-center">
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="display-4 fw-bold ${totalIndex > 0.7 ? 'text-danger' : totalIndex > 0.3 ? 'text-warning' : 'text-success'}">${(totalIndex * 100).toFixed(1)}%</div>
                        <div class="text-muted">Total Spillover Index</div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="progress mb-3" style="height: 30px;">
                        <div class="progress-bar ${totalIndex > 0.7 ? 'bg-danger' : totalIndex > 0.3 ? 'bg-warning' : 'bg-success'}" 
                             role="progressbar" style="width: ${totalIndex * 100}%" 
                             aria-valuenow="${totalIndex * 100}" aria-valuemin="0" aria-valuemax="100">
                            ${(totalIndex * 100).toFixed(1)}%
                        </div>
                    </div>
                    <p class="mb-0">${interpretation}</p>
                </div>
            </div>
        `;
        totalSpilloverContainer.innerHTML = spilloverHtml;
    }
    
    // Directional spillovers
    const directionalContainer = document.getElementById('directional-spillover-container');
    if (spillover.directional_spillover && directionalContainer) {
        let directionalHtml = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
        directionalHtml += '<th>Symbol</th><th>To Others</th><th>From Others</th><th>Net Spillover</th></tr></thead><tbody>';
        
        Object.keys(spillover.directional_spillover).forEach(symbol => {
            const dir = spillover.directional_spillover[symbol];
            const net = (spillover.net_spillover && spillover.net_spillover[symbol]) || (dir.to - dir.from);
            const netClass = net > 0 ? 'text-success' : net < 0 ? 'text-danger' : 'text-muted';
            
            directionalHtml += `
                <tr>
                    <td><strong>${symbol}</strong></td>
                    <td>${(dir.to * 100).toFixed(2)}%</td>
                    <td>${(dir.from * 100).toFixed(2)}%</td>
                    <td class="${netClass}">${(net * 100).toFixed(2)}%</td>
                </tr>
            `;
        });
        
        directionalHtml += '</tbody></table></div>';
        directionalContainer.innerHTML = directionalHtml;
    }
    
    // Net spillovers
    const netContainer = document.getElementById('net-spillover-container');
    if (spillover.net_spillover && netContainer) {
        netContainer.innerHTML = '<p class="text-muted">Net spillover visualization placeholder</p>';
    }
    
    // Pairwise spillovers
    const pairwiseContainer = document.getElementById('pairwise-spillover-container');
    if (spillover.pairwise_spillover_table && pairwiseContainer) {
        let pairwiseHtml = '<div class="table-responsive"><table class="table table-striped table-sm"><thead><tr>';
        pairwiseHtml += '<th>From</th><th>To</th><th>R²</th><th>R² %</th><th>Significant Lags</th><th>Strength</th></tr></thead><tbody>';
        
        spillover.pairwise_spillover_table.forEach(row => {
            const strengthClass = row.strength === 'Strong' ? 'text-success' : row.strength === 'Moderate' ? 'text-warning' : 'text-muted';
            
            pairwiseHtml += `
                <tr>
                    <td>${row.from}</td>
                    <td>${row.to}</td>
                    <td>${row.r_squared?.toFixed(4) || 'N/A'}</td>
                    <td>${row.r_squared_percent}%</td>
                    <td>${row.significant_lags_text || 'None'}</td>
                    <td class="${strengthClass}">${row.strength}</td>
                </tr>
            `;
        });
        
        pairwiseHtml += '</tbody></table></div>';
        pairwiseContainer.innerHTML = pairwiseHtml;
    }
    
    // Granger causality
    const grangerContainer = document.getElementById('granger-causality-container');
    if (spillover.granger_causality && grangerContainer) {
        const causality = spillover.granger_causality;
        let grangerHtml = '';
        
        if (causality.causality_results) {
            grangerHtml += '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
            grangerHtml += '<th>Relationship</th><th>1% Significant</th><th>5% Significant</th><th>Min P-Value</th></tr></thead><tbody>';
            
            Object.keys(causality.causality_results).forEach(relationship => {
                const result = causality.causality_results[relationship];
                const sig1pct = result.causality_1pct ? '✅' : '❌';
                const sig5pct = result.causality_5pct ? '✅' : '❌';
                const minPValue = result.significance_summary?.min_p_value?.toFixed(4) || 'N/A';
                
                grangerHtml += `
                    <tr>
                        <td><strong>${relationship}</strong></td>
                        <td class="text-center">${sig1pct}</td>
                        <td class="text-center">${sig5pct}</td>
                        <td>${minPValue}</td>
                    </tr>
                `;
            });
            
            grangerHtml += '</tbody></table></div>';
        }
        
        if (causality.metadata) {
            grangerHtml += `
                <div class="mt-3">
                    <h6>Analysis Metadata</h6>
                    <p><strong>Max Lag:</strong> ${causality.metadata.max_lag || 'N/A'}</p>
                    <p><strong>Pairs Tested:</strong> ${causality.metadata.n_pairs_tested || 'N/A'}</p>
                </div>
            `;
        }
        
        grangerContainer.innerHTML = grangerHtml || '<p class="text-muted">No Granger causality results available.</p>';
    }
}

function initializeRawDataTab() {
    if (!processedResults.raw_data) return;
    
    const rawData = processedResults.raw_data;
    
    // Initialize each data table
    const dataTypes = [
        { key: 'original_data', tableId: 'original-data-table', exportId: 'export-original-csv' },
        { key: 'returns_data', tableId: 'returns-data-table', exportId: 'export-returns-csv' },
        { key: 'scaled_data', tableId: 'scaled-data-table', exportId: 'export-scaled-csv' },
        { key: 'pre_garch_data', tableId: 'pre-garch-data-table', exportId: 'export-pre-garch-csv' },
        { key: 'post_garch_data', tableId: 'post-garch-data-table', exportId: 'export-post-garch-csv' }
    ];
    
    dataTypes.forEach(dataType => {
        const table = document.getElementById(dataType.tableId);
        const exportBtn = document.getElementById(dataType.exportId);
        
        if (rawData[dataType.key] && table) {
            const data = rawData[dataType.key];
            
            // Clear existing table content
            const thead = table.querySelector('thead tr');
            const tbody = table.querySelector('tbody');
            
            if (thead && tbody && data.headers && data.rows) {
                // Set headers
                thead.innerHTML = '';
                data.headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    thead.appendChild(th);
                });
                
                // Set rows (limit to first 100 for performance)
                tbody.innerHTML = '';
                const rowsToShow = data.rows.slice(0, 100);
                rowsToShow.forEach(row => {
                    const tr = document.createElement('tr');
                    row.forEach(cell => {
                        const td = document.createElement('td');
                        td.textContent = cell;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                
                // Add note if truncated
                if (data.rows.length > 100) {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = data.headers.length;
                    td.className = 'text-center text-muted fst-italic';
                    td.textContent = `... ${data.rows.length - 100} more rows (showing first 100)`;
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                }
            }
            
            // Set up export functionality
            if (exportBtn) {
                exportBtn.addEventListener('click', function() {
                    exportTableToCSV(data, `${dataType.key}_${new Date().toISOString().slice(0, 10)}.csv`);
                });
            }
        }
    });
}

function exportTableToCSV(tableData, filename) {
    if (!tableData.headers || !tableData.rows) {
        alert('No data available to export');
        return;
    }
    
    let csv = tableData.headers.join(',') + '\n';
    tableData.rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function handleUrlNavigation() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
        console.log(`URL tab parameter detected: ${tabParam}`);
        
        // Map URL parameters to tab IDs
        const tabMapping = {
            'overview': 'overview-tab',
            'plots': 'plots-tab',
            'statistical-tests': 'statistical-tests-tab',
            'models': 'models-tab',
            'spillover-analysis': 'spillover-analysis-tab',
            'raw-data': 'raw-data-tab'
        };
        
        const targetTabId = tabMapping[tabParam];
        if (targetTabId) {
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) {
                // Deactivate all tabs
                document.querySelectorAll('#resultsTabs .nav-link').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Activate target tab
                targetTab.classList.add('active');
                const targetContent = document.getElementById(tabParam);
                if (targetContent) {
                    targetContent.classList.add('show', 'active');
                }
            }
        }
    }
}

function processResultsClientSide(rawResults) {
    // Enhanced client-side processing to extract real data from API response
    console.log("Processing results client-side");
    console.log("Raw results keys:", Object.keys(rawResults));
    
    // Extract stationarity test results
    let stationarityResults = {};
    let seriesStatistics = {};
    
    if (rawResults.stationarity_results) {
        console.log("Found stationarity_results in raw data");
        
        // Extract stationarity test results from nested structure
        if (rawResults.stationarity_results.all_symbols_stationarity) {
            const stationarityData = rawResults.stationarity_results.all_symbols_stationarity;
            
            // Handle both direct and nested structures
            const actualStationarityData = stationarityData.all_symbols_stationarity || stationarityData;
            
            if (actualStationarityData && typeof actualStationarityData === 'object') {
                console.log("Processing stationarity data for symbols:", Object.keys(actualStationarityData));
                stationarityResults = actualStationarityData;
            }
        }
        
        // Extract series statistics
        if (rawResults.stationarity_results.series_stats) {
            console.log("Found series_stats in raw data");
            seriesStatistics = rawResults.stationarity_results.series_stats;
        }
    }
    
    // Extract spillover analysis results
    let spilloverAnalysis = {
        total_spillover: {},
        directional_spillover: {},
        net_spillover: {},
        pairwise_spillover: {},
        pairwise_spillover_table: [],
        granger_causality: {}
    };
    
    if (rawResults.spillover_results) {
        console.log("Found spillover_results in raw data");
        
        // Total spillover index
        if (rawResults.spillover_results.total_spillover_index !== undefined) {
            spilloverAnalysis.total_spillover = {
                index: rawResults.spillover_results.total_spillover_index,
                interpretation: rawResults.spillover_results.total_spillover_interpretation || ''
            };
        }
        
        // Directional spillovers
        if (rawResults.spillover_results.directional_spillover) {
            spilloverAnalysis.directional_spillover = rawResults.spillover_results.directional_spillover;
        }
        
        // Net spillovers
        if (rawResults.spillover_results.net_spillover) {
            spilloverAnalysis.net_spillover = rawResults.spillover_results.net_spillover;
        }
        
        // Pairwise spillovers (use the transformed data from the response)
        if (rawResults.spillover_results.pairwise_spillover_table) {
            spilloverAnalysis.pairwise_spillover_table = rawResults.spillover_results.pairwise_spillover_table;
        }
        
        // Granger causality
        if (rawResults.granger_causality_results) {
            spilloverAnalysis.granger_causality = rawResults.granger_causality_results;
        }
    }
    
    // Extract model results - Fix the nested structure extraction
    let models = { arima: {}, garch: {}, var: {} };
    
    // Extract ARIMA results from nested structure
    if (rawResults.arima_results) {
        console.log("Found ARIMA results in raw data");
        console.log("ARIMA results structure:", Object.keys(rawResults.arima_results));
        
        // Check for nested structure: results.all_symbols_arima
        if (rawResults.arima_results.results && rawResults.arima_results.results.all_symbols_arima) {
            console.log("Extracting ARIMA results from nested structure");
            models.arima = rawResults.arima_results.results.all_symbols_arima;
        } else if (rawResults.arima_results.all_symbols_arima) {
            console.log("Extracting ARIMA results from direct structure");
            models.arima = rawResults.arima_results.all_symbols_arima;
        } else {
            // Fallback to direct assignment
            models.arima = rawResults.arima_results;
        }
    }
    
    // Extract GARCH results from nested structure
    if (rawResults.garch_results) {
        console.log("Found GARCH results in raw data");
        console.log("GARCH results structure:", Object.keys(rawResults.garch_results));
        
        // Check for nested structure: results.all_symbols_garch
        if (rawResults.garch_results.results && rawResults.garch_results.results.all_symbols_garch) {
            console.log("Extracting GARCH results from nested structure");
            models.garch = rawResults.garch_results.results.all_symbols_garch;
        } else if (rawResults.garch_results.all_symbols_garch) {
            console.log("Extracting GARCH results from direct structure");
            models.garch = rawResults.garch_results.all_symbols_garch;
        } else {
            // Fallback to direct assignment
            models.garch = rawResults.garch_results;
        }
    }
    
    // Extract VAR results
    if (rawResults.var_results) {
        console.log("Found VAR results in raw data");
        models.var = rawResults.var_results;
    }
    
    console.log("Final extracted models:", {
        arima_symbols: Object.keys(models.arima),
        garch_symbols: Object.keys(models.garch),
        var_available: Object.keys(models.var).length > 0
    });
    
    // Extract raw data tables
    let rawData = {};
    const dataTypes = ['original_data', 'returns_data', 'scaled_data', 'pre_garch_data', 'post_garch_data'];
    
    dataTypes.forEach(dataType => {
        if (rawResults[dataType] && Array.isArray(rawResults[dataType])) {
            console.log(`Found ${dataType} with ${rawResults[dataType].length} records`);
            
            // Convert array of objects to table format
            const dataArray = rawResults[dataType];
            if (dataArray.length > 0) {
                const headers = Object.keys(dataArray[0]);
                const rows = dataArray.map(row => headers.map(header => row[header] || ''));
                
                rawData[dataType] = {
                    headers: headers,
                    rows: rows
                };
            }
        }
    });
    
    // Create data lineage information
    let dataLineage = {
        pipeline_stages: [],
        data_sets: rawData
    };
    
    dataTypes.forEach(dataType => {
        const hasData = rawResults[dataType] && Array.isArray(rawResults[dataType]) && rawResults[dataType].length > 0;
        const recordCount = hasData ? rawResults[dataType].length : 0;
        
        dataLineage.pipeline_stages.push({
            name: dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            data_available: hasData,
            record_count: recordCount
        });
    });
    
    // Extract symbols from the data
    let symbols = rawResults.symbols || [];
    if (symbols.length === 0 && rawResults.original_data && rawResults.original_data.length > 0) {
        // Extract symbols from data headers, excluding 'index' or timestamp columns
        const headers = Object.keys(rawResults.original_data[0]);
        symbols = headers.filter(header => !['index', 'timestamp', 'date'].includes(header.toLowerCase()));
    }
    
    const processedData = {
        overview: {
            executive_summary: {
                symbols_analyzed: symbols.length,
                symbols_list: symbols.join(', '),
                analysis_date: (() => {
                    const now = new Date();
                    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const timeZoneShort = now.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
                    return now.getFullYear() + '-' + 
                           String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(now.getDate()).padStart(2, '0') + ' ' +
                           String(now.getHours()).padStart(2, '0') + ':' +
                           String(now.getMinutes()).padStart(2, '0') + ':' +
                           String(now.getSeconds()).padStart(2, '0') + ' ' + timeZoneShort;
                })(),
                key_findings: [
                    `Analysis completed for ${symbols.length} symbols`,
                    stationarityResults && Object.keys(stationarityResults).length > 0 ? 'Stationarity tests completed' : 'No stationarity tests available',
                    spilloverAnalysis.total_spillover.index !== undefined ? `Total spillover index: ${(spilloverAnalysis.total_spillover.index * 100).toFixed(1)}%` : 'No spillover analysis available'
                ].filter(finding => !finding.includes('No ')),
                analysis_date: new Date().toISOString()
            },
            key_insights: [
                'Time series analysis pipeline executed',
                spilloverAnalysis.granger_causality && Object.keys(spilloverAnalysis.granger_causality).length > 0 ? 'Granger causality relationships detected' : null,
                Object.keys(models.arima).length > 0 ? 'ARIMA models fitted' : null,
                Object.keys(models.garch).length > 0 ? 'GARCH models fitted' : null
            ].filter(insight => insight !== null),
            analysis_summary: {
                data_points: rawResults.original_data ? rawResults.original_data.length : 0,
                models_fitted: [
                    Object.keys(models.arima).length > 0 ? 'ARIMA' : null,
                    Object.keys(models.garch).length > 0 ? 'GARCH' : null,
                    Object.keys(models.var).length > 0 ? 'VAR' : null
                ].filter(model => model !== null),
                tests_performed: [
                    Object.keys(stationarityResults).length > 0 ? 'Stationarity Tests' : null,
                    spilloverAnalysis.granger_causality && Object.keys(spilloverAnalysis.granger_causality).length > 0 ? 'Granger Causality' : null,
                    spilloverAnalysis.total_spillover.index !== undefined ? 'Spillover Analysis' : null
                ].filter(test => test !== null)
            }
        },
        statistical_tests: {
            stationarity: stationarityResults,
            series_statistics: seriesStatistics
        },
        models: models,
        spillover_analysis: spilloverAnalysis,
        data_lineage: dataLineage,
        raw_data: rawData
    };
    
    console.log("Client-side processing complete. Processed structure:", {
        overview: !!processedData.overview,
        statistical_tests: !!processedData.statistical_tests,
        models: {
            arima: Object.keys(processedData.models.arima).length,
            garch: Object.keys(processedData.models.garch).length,
            var: Object.keys(processedData.models.var).length
        },
        spillover_analysis: !!processedData.spillover_analysis,
        data_lineage: !!processedData.data_lineage,
        raw_data: Object.keys(processedData.raw_data).length
    });
    
    return processedData;
}

console.log("Results page JavaScript loaded successfully");