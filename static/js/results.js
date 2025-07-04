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
            arimaHtml += `
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">ARIMA Model - ${symbol}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Summary</h6>
                                <pre class="small">${result.summary?.model_specification || 'No model specification available'}</pre>
                            </div>
                            <div class="col-md-6">
                                <h6>Forecast</h6>
                                ${result.forecast?.point_forecasts ? 
                                    `<p>Forecast steps: ${result.forecast.forecast_steps}</p>
                                     <p>Method: ${result.forecast.forecast_method}</p>` : 
                                    '<p class="text-muted">No forecast available</p>'
                                }
                            </div>
                        </div>
                        ${result.interpretation ? `<div class="mt-3"><h6>Interpretation</h6><p class="small">${JSON.stringify(result.interpretation.executive_summary || {})}</p></div>` : ''}
                    </div>
                </div>
            `;
        });
        
        arimaContainer.innerHTML = arimaHtml || '<p class="text-muted">No ARIMA results available.</p>';
    }
    
    // Initialize GARCH results
    const garchContainer = document.getElementById('garch-results-container');
    if (models.garch && garchContainer) {
        let garchHtml = '';
        
        Object.keys(models.garch).forEach(symbol => {
            const result = models.garch[symbol];
            garchHtml += `
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">GARCH Model - ${symbol}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Model Summary</h6>
                                <pre class="small">${result.summary || 'No model summary available'}</pre>
                            </div>
                            <div class="col-md-6">
                                <h6>Volatility Forecast</h6>
                                ${result.forecast && result.forecast.length > 0 ? 
                                    `<p>Forecast points: ${result.forecast.length}</p>` : 
                                    '<p class="text-muted">No volatility forecast available</p>'
                                }
                            </div>
                        </div>
                        ${result.interpretation ? `<div class="mt-3"><h6>Interpretation</h6><p class="small">${JSON.stringify(result.interpretation.executive_summary || {})}</p></div>` : ''}
                    </div>
                </div>
            `;
        });
        
        garchContainer.innerHTML = garchHtml || '<p class="text-muted">No GARCH results available.</p>';
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
    // Simplified client-side processing as fallback
    console.log("Processing results client-side");
    
    return {
        overview: {
            executive_summary: {
                symbols_analyzed: rawResults.symbols?.length || 0,
                symbols_list: rawResults.symbols?.join(', ') || 'Unknown',
                analysis_date: new Date().toISOString(),
                key_findings: ['Client-side processing active']
            },
            key_insights: ['Raw data available for analysis'],
            analysis_summary: {
                models_fitted: Object.keys(rawResults).filter(key => key.includes('results')),
                tests_performed: ['Basic processing'],
                data_points: 0,
                time_period: 'Unknown'
            },
            data_quality: {
                completeness: 'Unknown',
                missing_values: 0,
                consistency: 'Unknown'
            }
        },
        data_lineage: { pipeline_stages: [], data_sets: {} },
        statistical_tests: { stationarity: {}, series_statistics: {} },
        models: { arima: {}, garch: {}, var: {} },
        spillover_analysis: { 
            total_spillover: {},
            directional_spillover: {},
            net_spillover: {},
            pairwise_spillover: {},
            granger_causality: {}
        },
        raw_data: {},
        symbols: rawResults.symbols || [],
        has_data: true
    };
}

console.log("Results page JavaScript loaded successfully");