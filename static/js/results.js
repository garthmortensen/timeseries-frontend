// results.js - JavaScript for the restructured results page
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
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const exportName = `api_response_${timestamp}.json`;
        
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
    console.log("DOMContentLoaded event fired");
    
    // Check for processed results from server-side processing
    if (typeof processedResultsData !== 'undefined') {
        console.log("Using server-side processed results");
        processedResults = processedResultsData;
        initializeResultsDisplay();
        return;
    }
    
    // Fallback to sessionStorage for client-side processing
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
    
    // Process results client-side if no server processing
    processedResults = processResultsClientSide(results);
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
    initializePlotsTab();
    initializeStatisticalTestsTab();
    initializeModelsTab();
    initializeSpilloverAnalysisTab();
    initializeRawDataTab();
    
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
            <div class="mb-2"><strong>Time Period:</strong> ${summary.time_period || 'Unknown'}</div>
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
        statsHtml += '<th>Symbol</th><th>Mean</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Skewness</th><th>Kurtosis</th></tr></thead><tbody>';
        
        Object.keys(tests.series_statistics).forEach(symbol => {
            const stats = tests.series_statistics[symbol];
            statsHtml += `
                <tr>
                    <td><strong>${symbol}</strong></td>
                    <td>${stats.mean?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.std?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.min?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.max?.toFixed(6) || 'N/A'}</td>
                    <td>${stats.skew?.toFixed(4) || 'N/A'}</td>
                    <td>${stats.kurt?.toFixed(4) || 'N/A'}</td>
                </tr>
            `;
        });
        
        statsHtml += '</tbody></table></div>';
        seriesStatsContainer.innerHTML = statsHtml;
    }
}

function initializeModelsTab() {
    if (!processedResults.models) return;
    
    const models = processedResults.models;
    
    // Initialize ARIMA results
    const arimaContainer = document.getElementById('arima-results-container');
    if (models.arima && arimaContainer) {
        let arimaHtml = '';
        
        Object.keys(models.arima).forEach(symbol => {
            const result = models.arima[symbol];
            
            // Extract model specification - use structured data first, fallback to text parsing
            let modelSpec = 'Model specification not available';
            
            // Try to get from structured summary.model_specification
            if (result.summary && result.summary.model_specification) {
                modelSpec = result.summary.model_specification;
            }
            // Try to get from forecast.model_specification
            else if (result.forecast && result.forecast.model_specification) {
                modelSpec = result.forecast.model_specification;
            }
            // Fallback to text parsing from fitted_model
            else if (result.fitted_model && typeof result.fitted_model === 'string') {
                // Parse ARIMA model specification from the fitted_model summary
                const summaryLines = result.fitted_model.split('\n');
                const modelLine = summaryLines.find(line => line.includes('ARIMA'));
                if (modelLine) {
                    // Extract ARIMA(p,d,q) pattern
                    const arimaMatch = modelLine.match(/ARIMA\(\d+,\d+,\d+\)/);
                    if (arimaMatch) {
                        modelSpec = arimaMatch[0];
                    } else {
                        // Fallback: use the entire line that mentions ARIMA
                        modelSpec = modelLine.trim();
                    }
                }
            }
            
            // Extract forecast information
            let forecastInfo = 'No forecast available';
            if (result.forecast) {
                if (result.forecast.point_forecasts && Array.isArray(result.forecast.point_forecasts)) {
                    forecastInfo = `${result.forecast.point_forecasts.length} forecast points`;
                } else if (result.forecast.forecast_steps) {
                    forecastInfo = `${result.forecast.forecast_steps} forecast steps`;
                }
                if (result.forecast.forecast_method) {
                    forecastInfo += ` (${result.forecast.forecast_method})`;
                }
            }
            
            // Extract model fit statistics
            let fitStats = '';
            if (result.model_summary && result.model_summary.fit_statistics) {
                const stats = result.model_summary.fit_statistics;
                fitStats = `
                    <div class="row mt-3">
                        <div class="col-6"><strong>AIC:</strong> ${stats.aic?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>BIC:</strong> ${stats.bic?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>Log Likelihood:</strong> ${stats.log_likelihood?.toFixed(4) || 'N/A'}</div>
                        <div class="col-6"><strong>HQIC:</strong> ${stats.hqic?.toFixed(4) || 'N/A'}</div>
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
            
            arimaHtml += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">ARIMA Model - ${symbol}</h6>
                        <span class="badge bg-primary">Fitted</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Specification</h6>
                                <div class="bg-light p-2 rounded">
                                    <code>${modelSpec}</code>
                                </div>
                                ${fitStats}
                            </div>
                            <div class="col-md-6">
                                <h6>Forecast Information</h6>
                                <p>${forecastInfo}</p>
                                ${result.forecast && result.forecast.confidence_intervals ? 
                                    '<p><small class="text-muted">Includes confidence intervals</small></p>' : 
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
        
        arimaContainer.innerHTML = arimaHtml || '<div class="alert alert-warning">No ARIMA results available.</div>';
    }
    
    // Initialize GARCH results
    const garchContainer = document.getElementById('garch-results-container');
    if (models.garch && garchContainer) {
        let garchHtml = '';
        
        Object.keys(models.garch).forEach(symbol => {
            const result = models.garch[symbol];
            
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
    if (models.var && varContainer) {
        const varResult = models.var;
        
        // Model specifications
        const varModelSpecs = document.getElementById('var-model-specs');
        if (varModelSpecs) {
            let specsHtml = `
                <p><strong>Selected Lag:</strong> ${varResult.selected_lag || 'N/A'}</p>
                <p><strong>Information Criterion:</strong> ${varResult.ic_used || 'N/A'}</p>
                <p><strong>Model Type:</strong> Vector Autoregression</p>
            `;
            varModelSpecs.innerHTML = specsHtml;
        }
        
        // FEVD matrix
        const varFevdMatrix = document.getElementById('var-fevd-matrix');
        if (varFevdMatrix && varResult.fevd_matrix) {
            varFevdMatrix.innerHTML = '<p class="text-muted">FEVD matrix visualization placeholder</p>';
        }
        
        // Interpretations
        const varInterpretations = document.getElementById('var-interpretations');
        if (varInterpretations) {
            let interpretHtml = '';
            if (varResult.interpretation) {
                interpretHtml = `<p>${varResult.interpretation}</p>`;
            }
            if (varResult.fevd_interpretation) {
                Object.keys(varResult.fevd_interpretation).forEach(symbol => {
                    interpretHtml += `<div class="mb-2"><strong>${symbol}:</strong> ${varResult.fevd_interpretation[symbol]}</div>`;
                });
            }
            varInterpretations.innerHTML = interpretHtml || '<p class="text-muted">No interpretations available.</p>';
        }
    }
}

function initializeSpilloverAnalysisTab() {
    if (!processedResults.spillover_analysis) return;
    
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
                analysis_date: new Date().toISOString(),
                key_findings: [
                    `Analysis completed for ${symbols.length} symbols`,
                    stationarityResults && Object.keys(stationarityResults).length > 0 ? 'Stationarity tests completed' : 'No stationarity tests available',
                    spilloverAnalysis.total_spillover.index !== undefined ? `Total spillover index: ${(spilloverAnalysis.total_spillover.index * 100).toFixed(1)}%` : 'No spillover analysis available'
                ].filter(finding => !finding.includes('No '))
            },
            key_insights: [
                'Time series analysis pipeline executed',
                spilloverAnalysis.granger_causality && Object.keys(spilloverAnalysis.granger_causality).length > 0 ? 'Granger causality relationships detected' : null,
                Object.keys(models.arima).length > 0 ? 'ARIMA models fitted' : null,
                Object.keys(models.garch).length > 0 ? 'GARCH models fitted' : null
            ].filter(insight => insight !== null),
            analysis_summary: {
                data_points: rawResults.original_data ? rawResults.original_data.length : 0,
                time_period: rawResults.original_data && rawResults.original_data.length > 0 ? 
                    `${rawResults.original_data.length} observations` : 'Unknown',
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