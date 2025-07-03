// results.js - JavaScript for the results page
console.log("Results page JavaScript starting...");

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

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event fired");
    
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
    
    // Handle URL parameters for direct tab navigation
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
        console.log(`URL tab parameter detected: ${tabParam}`);
        
        // Handle data-specific tabs
        if (tabParam === 'price-data' || tabParam === 'returns-data' || tabParam === 'garch-data' || tabParam === 'pre-garch-data' || tabParam === 'post-garch-data') {
            // First activate the Data Lineage tab
            const dataTab = document.getElementById('data-tab');
            const dataTabContent = document.getElementById('data');
            
            if (dataTab && dataTabContent) {
                // Deactivate all main tabs
                document.querySelectorAll('#resultsTabs .nav-link').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Activate the data tab
                dataTab.classList.add('active');
                dataTabContent.classList.add('show', 'active');
                
                // Then activate the specific sub-tab
                setTimeout(() => {
                    const subTabId = tabParam + '-tab';
                    const subContentId = tabParam;
                    
                    const subTab = document.getElementById(subTabId);
                    const subContent = document.getElementById(subContentId);
                    
                    if (subTab && subContent) {
                        // Deactivate all data sub-tabs
                        document.querySelectorAll('#datasetTabs .nav-link').forEach(tab => tab.classList.remove('active'));
                        document.querySelectorAll('#datasetTabContent .tab-pane').forEach(pane => {
                            pane.classList.remove('show', 'active');
                        });
                        
                        // Activate the specific sub-tab
                        subTab.classList.add('active');
                        subContent.classList.add('show', 'active');
                        
                        console.log(`Activated data sub-tab: ${tabParam}`);
                    }
                }, 100);
            }
        } else {
            // Handle other main tabs (stationarity, arima, etc.)
            const tabId = tabParam + '-tab';
            const contentId = tabParam;
            
            const tab = document.getElementById(tabId);
            const content = document.getElementById(contentId);
            
            if (tab && content) {
                // Deactivate all tabs
                document.querySelectorAll('#resultsTabs .nav-link').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Activate the specific tab
                tab.classList.add('active');
                content.classList.add('show', 'active');
                
                console.log(`Activated main tab: ${tabParam}`);
            }
        }
    }

    // Helper function to transform array data into the format needed for plotting
    function transformArrayToPlotData(dataArray, preferredDateField = 'Date') {
        if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
            console.error("Invalid data array:", dataArray);
            return null;
        }
        
        const firstItem = dataArray[0];
        let dateField = preferredDateField;
        const alternateField = preferredDateField === 'Date' ? 'index' : 'Date';
        
        if (!(dateField in firstItem) && (alternateField in firstItem)) {
            console.log(`Field '${dateField}' not found, using '${alternateField}' instead`);
            dateField = alternateField;
        }
        
        if (!(dateField in firstItem)) {
            console.error(`Neither '${preferredDateField}' nor '${alternateField}' fields found in data`);
            return null;
        }
        
        const symbols = Object.keys(firstItem).filter(key => key !== 'Date' && key !== 'index');
        
        if (symbols.length === 0) {
            console.error("No symbols found in data");
            return null;
        }
        
        console.log("Found symbols:", symbols);
        console.log("Using date field:", dateField);
        
        const plotData = symbols.map(symbol => {
            const x = [];
            const y = [];
            
            dataArray.forEach(item => {
                if (item[symbol] !== undefined) {
                    const date = item[dateField].split('T')[0];
                    x.push(date);
                    y.push(item[symbol]);
                }
            });
            
            return {
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: symbol
            };
        });
        
        return plotData;
    }
    
    // Plot time series data
    if (results.original_data && Array.isArray(results.original_data) && results.original_data.length > 0) {
        const priceSeriesPlotData = transformArrayToPlotData(results.original_data);
        
        if (priceSeriesPlotData) {
            const priceSeriesPlot = document.getElementById('price-series-plot');
            if (priceSeriesPlot) {
                Plotly.newPlot(priceSeriesPlot, priceSeriesPlotData, {
                    title: 'Price Series',
                    xaxis: { title: 'Date' },
                    yaxis: { title: 'Price' },
                    legend: { orientation: 'h', y: -0.2 },
                    autosize: true,
                    margin: { l: 50, r: 50, b: 50, t: 80, pad: 4 }
                }, {
                    responsive: true
                });
                console.log("Price series plot created");
            } else {
                console.error("Price series plot container not found");
            }
        }
    } else {
        const priceSeriesPlot = document.getElementById('price-series-plot');
        if (priceSeriesPlot) {
            priceSeriesPlot.innerHTML = '<div class="alert alert-warning">No price data available</div>';
        }
    }
    
    // Returns Series
    if (results.returns_data && Array.isArray(results.returns_data) && results.returns_data.length > 0) {
        const returnsPlotData = transformArrayToPlotData(results.returns_data);
        
        if (returnsPlotData) {
            const returnsSeriesPlot = document.getElementById('returns-series-plot');
            if (returnsSeriesPlot) {
                Plotly.newPlot(returnsSeriesPlot, returnsPlotData, {
                    title: 'Returns Series',
                    xaxis: { title: 'Date' },
                    yaxis: { title: 'Return' },
                    legend: { orientation: 'h', y: -0.2 },
                    autosize: true,
                    margin: { l: 50, r: 50, b: 50, t: 80, pad: 4 }
                }, {
                    responsive: true
                });
                console.log("Returns series plot created");
            } else {
                console.error("Returns series plot container not found");
            }
        }
    } else {
        const returnsSeriesPlot = document.getElementById('returns-series-plot');
        if (returnsSeriesPlot) {
            returnsSeriesPlot.innerHTML = '<div class="alert alert-warning">No returns data available</div>';
        }
    }
    
    // Pre-GARCH Series
    if (results.pre_garch_data && Array.isArray(results.pre_garch_data) && results.pre_garch_data.length > 0) {
        const preGarchPlotData = transformArrayToPlotData(results.pre_garch_data);
        
        if (preGarchPlotData) {
            const preGarchSeriesPlot = document.getElementById('pre-garch-series-plot');
            if (preGarchSeriesPlot) {
                Plotly.newPlot(preGarchSeriesPlot, preGarchPlotData, {
                    title: 'Pre-GARCH Series',
                    xaxis: { title: 'Date' },
                    yaxis: { title: 'Value' },
                    legend: { orientation: 'h', y: -0.2 },
                    autosize: true,
                    margin: { l: 50, r: 50, b: 50, t: 80, pad: 4 }
                }, {
                    responsive: true
                });
                console.log("Pre-GARCH series plot created");
            } else {
                console.error("Pre-GARCH series plot container not found");
            }
        }
    } else {
        const preGarchSeriesPlot = document.getElementById('pre-garch-series-plot');
        if (preGarchSeriesPlot) {
            preGarchSeriesPlot.innerHTML = '<div class="alert alert-warning">No pre-GARCH data available</div>';
        }
    }
    
    // Post-GARCH Series  
    if (results.post_garch_data && Array.isArray(results.post_garch_data) && results.post_garch_data.length > 0) {
        const postGarchPlotData = transformArrayToPlotData(results.post_garch_data);
        
        if (postGarchPlotData) {
            const postGarchSeriesPlot = document.getElementById('post-garch-series-plot');
            if (postGarchSeriesPlot) {
                Plotly.newPlot(postGarchSeriesPlot, postGarchPlotData, {
                    title: 'Post-GARCH Series',
                    xaxis: { title: 'Date' },
                    yaxis: { title: 'Value' },
                    legend: { orientation: 'h', y: -0.2 },
                    autosize: true,
                    margin: { l: 50, r: 50, b: 50, t: 80, pad: 4 }
                }, {
                    responsive: true
                });
                console.log("Post-GARCH series plot created");
            } else {
                console.error("Post-GARCH series plot container not found");
            }
        }
    } else {
        const postGarchSeriesPlot = document.getElementById('post-garch-series-plot');
        if (postGarchSeriesPlot) {
            postGarchSeriesPlot.innerHTML = '<div class="alert alert-warning">No post-GARCH data available</div>';
        }
    }
    
    // Scaled Data Series
    if (results.scaled_data && Array.isArray(results.scaled_data) && results.scaled_data.length > 0) {
        const scaledPlotData = transformArrayToPlotData(results.scaled_data);
        if (scaledPlotData) {
            const scaledSeriesPlot = document.getElementById('scaled-series-plot');
            if (scaledSeriesPlot) {
                Plotly.newPlot(scaledSeriesPlot, scaledPlotData, {
                    title: 'Scaled Data Series',
                    xaxis: { title: 'Date' },
                    yaxis: { title: 'Scaled Value' },
                    legend: { orientation: 'h', y: -0.2 },
                    autosize: true,
                    margin: { l: 50, r: 50, b: 50, t: 80, pad: 4 }
                }, {
                    responsive: true
                });
                console.log("Scaled data series plot created");
            } else {
                console.error("Scaled series plot container not found");
            }
        }
    } else {
        const scaledSeriesPlot = document.getElementById('scaled-series-plot');
        if (scaledSeriesPlot) {
            scaledSeriesPlot.innerHTML = '<div class="alert alert-warning">No scaled data available</div>';
        }
    }
    
    // Populate Stationarity Tab
    populateStationarityTab(results);
    
    // Populate ARIMA Tab
    populateArimaTab(results);
    
    // Populate GARCH Tab  
    populateGarchTab(results);
    
    // Populate Spillover Tab
    populateSpilloverTab(results);
    
    // Populate Data Tables
    populateDataTables(results);
    
    // Populate individual data tables for the Data Lineage tab
    populateIndividualDataTables(results);
    
    // Populate Series Statistics Tab
    populateSeriesStatsTab(results);
    
    // Setup tab resize handlers
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function() {
            console.log("Tab changed, triggering resize");
            window.dispatchEvent(new Event('resize'));
        });
    });
});

function populateStationarityTab(results) {
    console.log("=== STATIONARITY DEBUG START ===");
    console.log("populateStationarityTab called with:", results);
    
    const container = document.getElementById('stationarity-content');
    console.log("Found container:", container);
    
    if (!container) {
        console.error("ERROR: stationarity-content container not found!");
        return;
    }
    
    if (!results) {
        console.error("ERROR: No results provided");
        container.innerHTML = '<div class="alert alert-danger">No results provided to function</div>';
        return;
    }
    
    if (!results.stationarity_results) {
        console.error("ERROR: No stationarity_results in data");
        console.log("Available keys in results:", Object.keys(results));
        container.innerHTML = '<div class="alert alert-danger">No stationarity_results found in data. Available keys: ' + Object.keys(results).join(', ') + '</div>';
        return;
    }
    
    if (!results.stationarity_results.all_symbols_stationarity) {
        console.error("ERROR: No all_symbols_stationarity in stationarity_results");
        console.log("Available keys in stationarity_results:", Object.keys(results.stationarity_results));
        container.innerHTML = '<div class="alert alert-danger">No all_symbols_stationarity found. Available keys: ' + Object.keys(results.stationarity_results).join(', ') + '</div>';
        return;
    }
    
    let html = '';
    let stationarityResults = results.stationarity_results.all_symbols_stationarity;
    console.log("Initial stationarityResults:", stationarityResults);

    // Handle potential extra nesting from the API response
    if (stationarityResults.all_symbols_stationarity) {
        console.log("Found nested stationarity results, unwrapping...");
        stationarityResults = stationarityResults.all_symbols_stationarity;
        console.log("After unwrapping:", stationarityResults);
    }
    
    // Get series stats - check both possible locations
    let seriesStats = results.stationarity_results.series_stats;
    if (!seriesStats && results.series_stats) {
        seriesStats = results.series_stats;
    }
    console.log("Series stats:", seriesStats);
    
    const symbols = Object.keys(stationarityResults);
    console.log("Found symbols:", symbols);
    
    if (symbols.length === 0) {
        console.error("ERROR: No symbols found in stationarity results");
        container.innerHTML = '<div class="alert alert-warning">No symbols found in stationarity results</div>';
        return;
    }
    
    for (const [symbol, symbolResult] of Object.entries(stationarityResults)) {
        console.log(`Processing stationarity for ${symbol}:`, symbolResult);
        
        const adfStatistic = symbolResult.adf_statistic;
        const pValue = symbolResult.p_value;
        const isStationary = symbolResult.is_stationary;
        const criticalValues = symbolResult.critical_values || {};
        const interpretation = symbolResult.interpretation || {};
        
        // Get series stats for this symbol
        const symbolStats = seriesStats && seriesStats[symbol] ? seriesStats[symbol] : null;
        console.log(`Stats for ${symbol}:`, symbolStats);
        
        html += `
            <div class="card mb-3">
                <div class="card-header">
                    <button class="btn btn-link text-decoration-none w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#collapseStationarity${symbol.replace(/[^a-zA-Z0-9]/g, '')}" aria-expanded="true" aria-controls="collapseStationarity${symbol.replace(/[^a-zA-Z0-9]/g, '')}">
                        <h6 class="mb-0">${symbol} - ${isStationary ? '✅ Stationary' : '❌ Non-Stationary'}</h6>
                    </button>
                </div>
                <div id="collapseStationarity${symbol.replace(/[^a-zA-Z0-9]/g, '')}" class="collapse show">
                    <div class="card-body">`;

        // NEW: Comprehensive Interpretation Section
        if (interpretation && typeof interpretation === 'object') {
            html += `
                        <!-- Comprehensive Educational Interpretation -->
                        <div class="alert ${isStationary ? 'alert-success' : 'alert-warning'} mb-4">
                            <h6><strong>📚 What We're Testing:</strong></h6>
                            <p>${interpretation.what_were_testing || 'Testing for stationarity in the time series data.'}</p>
                            
                            <h6><strong>🎯 Purpose:</strong></h6>
                            <p>${interpretation.purpose || 'To determine if the series has stable statistical properties over time.'}</p>
                            
                            <h6><strong>💡 Key Concepts:</strong></h6>
                            <ul>`;
            
            if (interpretation.key_ideas && Array.isArray(interpretation.key_ideas)) {
                interpretation.key_ideas.forEach(idea => {
                    html += `<li>${idea}</li>`;
                });
            } else {
                html += `<li>Stationarity means constant mean, variance, and autocorrelation over time</li>
                        <li>Non-stationary series can have trends, changing variance, or unit roots</li>`;
            }
            
            html += `
                            </ul>
                            
                            <h6><strong>📊 Test Results:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.results) {
                html += `
                                <p><strong>Bottom Line:</strong> ${interpretation.results.bottom_line || (isStationary ? 'Stationary' : 'Non-Stationary')}</p>
                                <p><strong>Confidence:</strong> ${interpretation.results.confidence_level || 'N/A'}</p>
                                <p><strong>Evidence Strength:</strong> ${interpretation.results.evidence_strength || 'N/A'}</p>
                                <p><strong>Decision:</strong> ${interpretation.results.hypothesis_decision || 'See statistical details below'}</p>`;
                
                if (interpretation.results.statistical_interpretation) {
                    html += `<p><strong>Statistical Details:</strong> ${interpretation.results.statistical_interpretation}</p>`;
                }
            }
            
            html += `
                            </div>
                            
                            <h6><strong>🔍 What This Means:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.implications) {
                html += `
                                <p><strong>Practical Meaning:</strong> ${interpretation.implications.practical_meaning || 'Results provide guidance for further modeling steps.'}</p>
                                <p><strong>Recommendations:</strong> ${interpretation.implications.recommendations || 'Consider results for next modeling steps.'}</p>`;
                
                if (interpretation.implications.limitations) {
                    html += `<p><strong>Limitations:</strong> ${interpretation.implications.limitations}</p>`;
                }
            }
            
            html += `
                            </div>
                        </div>`;
        } else {
            // Fallback for old format
            html += `
                        <div class="alert ${isStationary ? 'alert-success' : 'alert-warning'} mb-4">
                            <strong>Interpretation:</strong> <div style="white-space: pre-wrap;">${interpretation || 'Basic stationarity test completed.'}</div>
                        </div>`;
        }
        
        html += `
                        <div class="row">
                            <!-- Stationarity Test Results -->
                            <div class="col-md-6">
                                <h6>📈 Test Statistics</h6>
                                <table class="table table-bordered table-sm">
                                    <tbody>
                                        <tr>
                                            <th>Is Stationary</th>
                                            <td>
                                                <span class="badge ${isStationary ? 'bg-success' : 'bg-warning'}">
                                                    ${isStationary ? 'Yes ✅' : 'No ❌'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>ADF Statistic</th>
                                            <td>
                                                <strong>${adfStatistic !== null && adfStatistic !== undefined ? adfStatistic.toFixed(4) : 'N/A'}</strong>`;
        
        // Add interpretation tooltip for ADF statistic
        if (interpretation && interpretation.metrics && interpretation.metrics.test_statistic_explanation) {
            html += `<br><small class="text-muted">${interpretation.metrics.test_statistic_explanation}</small>`;
        }
        
        html += `
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>P-value</th>
                                            <td>
                                                <strong>${pValue !== null && pValue !== undefined ? pValue.toFixed(6) : 'N/A'}</strong>`;
        
        // Add significance level information
        if (interpretation && interpretation.metrics && interpretation.metrics.significance_level) {
            html += `<br><small class="text-muted">Significance: ${interpretation.metrics.significance_level}</small>`;
        }
        
        html += `
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                
                                <h6>🎯 Critical Values Comparison</h6>
                                <table class="table table-bordered table-sm">
                                    <tbody>`;
        
        // Add critical values with enhanced color coding and explanations
        ['1%', '5%', '10%'].forEach(level => {
            const criticalValue = criticalValues[level];
            let cellClass = '';
            let passedTest = false;
            let explanation = '';
            
            if (adfStatistic && criticalValue) {
                // For ADF test, stationarity is indicated when ADF statistic is MORE NEGATIVE than critical values
                passedTest = adfStatistic < criticalValue;
                cellClass = passedTest ? 'table-success' : 'table-danger';
                explanation = passedTest ? 'Passes test at this level' : 'Does not pass at this level';
            }
            
            html += `
                                        <tr class="${cellClass}">
                                            <th>Critical Value (${level})</th>
                                            <td>
                                                <strong>${criticalValue ? criticalValue.toFixed(4) : 'N/A'}</strong>
                                                ${passedTest ? ' ✅' : (criticalValue && adfStatistic ? ' ❌' : '')}
                                                ${explanation ? `<br><small class="text-muted">${explanation}</small>` : ''}
                                            </td>
                                        </tr>`;
        });
        
        html += `
                                    </tbody>
                                </table>`;

        // Add unit root explanation if available
        if (interpretation && interpretation.metrics && interpretation.metrics.unit_root_explanation) {
            html += `
                                <div class="alert alert-info mt-3">
                                    <h6>🔬 Understanding Unit Roots:</h6>
                                    <small>${interpretation.metrics.unit_root_explanation}</small>
                                </div>`;
        }

        html += `
                            </div>
                            
                            <!-- Series Statistics -->
                            <div class="col-md-6">
                                <h6>📊 Series Statistics</h6>`;
        
        if (symbolStats) {
            html += `
                                <table class="table table-bordered table-sm">
                                    <tbody>
                                        <tr><th>Observations</th><td>${symbolStats.n || 'N/A'}</td></tr>
                                        <tr><th>Mean</th><td>${symbolStats.mean !== undefined ? symbolStats.mean.toFixed(6) : 'N/A'}</td></tr>
                                        <tr><th>Median</th><td>${symbolStats.median !== undefined ? symbolStats.median.toFixed(6) : 'N/A'}</td></tr>
                                        <tr><th>Std Dev</th><td>${symbolStats.std !== undefined ? symbolStats.std.toFixed(6) : 'N/A'}</td></tr>
                                        <tr><th>Min</th><td>${symbolStats.min !== undefined ? symbolStats.min.toFixed(6) : 'N/A'}</td></tr>
                                        <tr><th>Max</th><td>${symbolStats.max !== undefined ? symbolStats.max.toFixed(6) : 'N/A'}</td></tr>
                                        <tr><th>Skewness</th><td>${symbolStats.skew !== undefined ? symbolStats.skew.toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>Kurtosis</th><td>${symbolStats.kurt !== undefined ? symbolStats.kurt.toFixed(4) : 'N/A'}</td></tr>
                                    </tbody>
                                </table>
                                
                                <h6>💰 Financial Metrics</h6>
                                <table class="table table-bordered table-sm">
                                    <tbody>
                                        <tr><th>Annualized Vol</th><td>${symbolStats.annualized_vol !== undefined ? symbolStats.annualized_vol.toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>Annualized Return</th><td>${symbolStats.annualized_return !== undefined ? symbolStats.annualized_return.toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>Sharpe Ratio (approx)</th><td>${symbolStats.sharpe_approx !== undefined ? symbolStats.sharpe_approx.toFixed(4) : 'N/A'}</td></tr>
                                    </tbody>
                                </table>`;
        } else {
            html += `
                                <div class="alert alert-info">
                                    <small>No series statistics available for ${symbol}</small>
                                </div>`;
        }
        
        html += `
                            </div>
                        </div>`;

        // Add methodology notes if available
        if (interpretation && interpretation.implications && interpretation.implications.methodology_notes) {
            html += `
                        <div class="mt-4">
                            <div class="alert alert-light">
                                <h6>📚 Methodology Notes:</h6>
                                <small>${interpretation.implications.methodology_notes}</small>
                            </div>
                        </div>`;
        }
        
        html += `
                        <div class="mt-3">
                            <small class="text-muted">
                                <strong>💡 Quick Reference:</strong> The Augmented Dickey-Fuller (ADF) test checks for stationarity. 
                                A more negative ADF statistic (compared to critical values) indicates stronger evidence of stationarity.
                                A p-value < 0.05 typically indicates stationarity at 95% confidence.
                            </small>
                        </div>
                    </div>
                </div>
            </div>`;
    }
    
    console.log("Generated HTML length:", html.length);
    console.log("Setting innerHTML...");
    container.innerHTML = html;
    console.log("=== STATIONARITY DEBUG END ===");
}

function populateArimaTab(results) {
    const container = document.getElementById('arima-content');

    if (!results.arima_results) {
        container.innerHTML = '<div class="alert alert-warning">No ARIMA results available</div>';
        return;
    }

    let arimaResults = results.arima_results;

    // Robustly unwrap nested objects, which seems to be a recurring API issue.
    while (arimaResults && typeof arimaResults === 'object' && arimaResults.all_symbols_arima) {
        console.log("Unwrapping nested all_symbols_arima object...");
        arimaResults = arimaResults.all_symbols_arima;
    }

    if (!arimaResults || typeof arimaResults !== 'object' || Object.keys(arimaResults).length === 0) {
        container.innerHTML = '<div class="alert alert-warning">No valid ARIMA data found for any symbols after processing.</div>';
        console.log("Final ARIMA data is empty or invalid:", arimaResults);
        return;
    }

    console.log("ARIMA results structure after unwrapping:", arimaResults);

    let html = '';

    for (const [symbol, symbolResult] of Object.entries(arimaResults)) {
        console.log(`Processing ARIMA for ${symbol}:`, symbolResult);

        const summary = symbolResult.summary || {};
        const forecast = symbolResult.forecast || {};
        const interpretation = symbolResult.interpretation || {};

        html += `
            <div class="card mb-3">
                <div class="card-header">
                    <button class="btn btn-link text-decoration-none w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#collapseArima${symbol.replace(/[^a-zA-Z0-9]/g, '')}" aria-expanded="true" aria-controls="collapseArima${symbol.replace(/[^a-zA-Z0-9]/g, '')}">
                        <h6 class="mb-0">${symbol} - ARIMA ${summary.model_specification || 'Model'}</h6>
                    </button>
                </div>
                <div id="collapseArima${symbol.replace(/[^a-zA-Z0-9]/g, '')}" class="collapse show">
                    <div class="card-body">`;

        // NEW: Comprehensive Educational Interpretation Section
        if (interpretation && typeof interpretation === 'object') {
            html += `
                        <!-- Comprehensive Educational Interpretation -->
                        <div class="alert alert-info mb-4">
                            <h6><strong>📚 What We're Testing:</strong></h6>
                            <p>${interpretation.what_were_testing || 'Fitting an ARIMA time series model to capture patterns and forecast future values.'}</p>
                            
                            <h6><strong>🎯 Purpose:</strong></h6>
                            <p>${interpretation.purpose || 'To identify underlying patterns in time series data and make accurate forecasts.'}</p>
                            
                            <h6><strong>💡 Key Concepts:</strong></h6>
                            <ul>`;
            
            if (interpretation.key_ideas && Array.isArray(interpretation.key_ideas)) {
                interpretation.key_ideas.forEach(idea => {
                    html += `<li>${idea}</li>`;
                });
            } else {
                html += `<li>ARIMA combines autoregression (AR), differencing (I), and moving averages (MA)</li>
                        <li>Model identifies patterns to forecast future values</li>`;
            }
            
            html += `
                            </ul>
                            
                            <h6><strong>📊 Model Results:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.results) {
                html += `
                                <p><strong>Bottom Line:</strong> ${interpretation.results.bottom_line || 'Model fitted successfully'}</p>
                                <p><strong>Forecast Trend:</strong> ${interpretation.results.forecast_assessment || 'See forecast details below'}</p>
                                <p><strong>Model Quality:</strong> ${interpretation.results.model_performance || 'See diagnostic details below'}</p>`;
                
                if (interpretation.results.bottom_line_detailed) {
                    html += `<p><strong>Detailed Analysis:</strong> ${interpretation.results.bottom_line_detailed}</p>`;
                }
            }
            
            html += `
                            </div>
                            
                            <h6><strong>🔮 Forecasting Insights:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.metrics) {
                const metrics = interpretation.metrics;
                html += `
                                <p><strong>Model Order:</strong> ${metrics.model_order || summary.model_specification || 'N/A'}</p>
                                <p><strong>Forecast Trend:</strong> ${metrics.forecast_trend || 'N/A'}</p>`;
                
                if (metrics.forecast_statistics) {
                    const stats = metrics.forecast_statistics;
                    html += `<p><strong>Forecast Stats:</strong> Mean: ${stats.mean ? stats.mean.toFixed(4) : 'N/A'}, Range: ${stats.range ? stats.range.toFixed(4) : 'N/A'}</p>`;
                }
                
                if (metrics.model_explanation) {
                    html += `<p><strong>Model Explanation:</strong> ${metrics.model_explanation}</p>`;
                }
            }
            
            html += `
                            </div>
                            
                            <h6><strong>🔍 What This Means:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.implications) {
                html += `
                                <p><strong>Practical Meaning:</strong> ${interpretation.implications.practical_meaning || 'Model provides forecasts based on historical patterns.'}</p>
                                <p><strong>Recommendations:</strong> ${interpretation.implications.recommendations || 'Use forecasts for planning purposes.'}</p>`;
                
                if (interpretation.implications.limitations) {
                    html += `<p><strong>Limitations:</strong> ${interpretation.implications.limitations}</p>`;
                }
            }
            
            html += `
                            </div>
                        </div>`;
        } else {
            // Fallback for old format
            html += `
                        <div class="alert alert-info">
                            <strong>Interpretation:</strong> ${interpretation || 'ARIMA model fitted successfully.'}
                        </div>`;
        }

        html += `
                        <div class="row">
                            <div class="col-md-6">
                                <h6>📈 Model Summary</h6>
                                <table class="table table-bordered table-sm">
                                    <tbody>
                                        <tr><th>Model</th><td><strong>${summary.model_specification || 'N/A'}</strong></td></tr>
                                        <tr><th>Log Likelihood</th><td>${summary.log_likelihood ? summary.log_likelihood.toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>AIC</th><td>${summary.aic ? summary.aic.toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>BIC</th><td>${summary.bic ? summary.bic.toFixed(4) : 'N/A'}</td></tr>
                                    </tbody>
                                </table>

                                <h6>⚙️ Model Parameters</h6>
                                <table class="table table-bordered table-sm">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Value</th>
                                            <th>P-Value</th>
                                            <th>Significance</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

        if (summary.parameters) {
            for (const [param, value] of Object.entries(summary.parameters)) {
                const pValue = summary.parameter_pvalues ? summary.parameter_pvalues[param] : null;
                const significance = summary.parameter_significance ? summary.parameter_significance[param] : 'N/A';
                const isSignificant = significance === 'Significant';

                html += `
                                        <tr class="${pValue !== null && pValue < 0.05 ? 'table-success' : ''}">
                                            <td><strong>${param}</strong></td>
                                            <td>${value ? value.toFixed(4) : 'N/A'}</td>
                                            <td>${pValue ? pValue.toFixed(4) : 'N/A'}</td>
                                            <td>
                                                <span class="badge ${isSignificant ? 'bg-success' : 'bg-warning'}">
                                                    ${significance} ${isSignificant ? '✅' : '⚠️'}
                                                </span>
                                            </td>
                                        </tr>`;
            }
        }

        html += `
                                    </tbody>
                                </table>`;

        // Add forecast summary table
        if (forecast.point_forecasts && Array.isArray(forecast.point_forecasts)) {
            html += `
                                <h6>🔮 Forecast Summary</h6>
                                <table class="table table-bordered table-sm">
                                    <tbody>
                                        <tr><th>Forecast Steps</th><td>${forecast.forecast_steps || forecast.point_forecasts.length}</td></tr>
                                        <tr><th>First Value</th><td>${forecast.point_forecasts[0] ? forecast.point_forecasts[0].toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>Last Value</th><td>${forecast.point_forecasts[forecast.point_forecasts.length - 1] ? forecast.point_forecasts[forecast.point_forecasts.length - 1].toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>Method</th><td>${forecast.forecast_method || 'Maximum Likelihood'}</td></tr>
                                    </tbody>
                                </table>`;
        }

        html += `
                            </div>
                            <div class="col-md-6">
                                <div id="arima-forecast-plot-${symbol.replace(/[^a-zA-Z0-9]/g, '')}"></div>
                            </div>
                        </div>`;

        // Add component breakdown if available
        if (interpretation && interpretation.metrics && interpretation.metrics.components_breakdown) {
            html += `
                        <div class="mt-4">
                            <div class="alert alert-light">
                                <h6>🔧 Model Components Breakdown:</h6>
                                <div class="row">`;
            
            const components = interpretation.metrics.components_breakdown;
            if (components.ar_interpretation) {
                html += `<div class="col-md-4"><strong>AR Component:</strong><br><small>${components.ar_interpretation}</small></div>`;
            }
            if (components.i_interpretation) {
                html += `<div class="col-md-4"><strong>I Component:</strong><br><small>${components.i_interpretation}</small></div>`;
            }
            if (components.ma_interpretation) {
                html += `<div class="col-md-4"><strong>MA Component:</strong><br><small>${components.ma_interpretation}</small></div>`;
            }
            
            html += `
                                </div>
                            </div>
                        </div>`;
        }

        // Add methodology notes if available
        if (interpretation && interpretation.implications && interpretation.implications.methodology_notes) {
            html += `
                        <div class="mt-4">
                            <div class="alert alert-light">
                                <h6>📚 Methodology Notes:</h6>
                                <small>${interpretation.implications.methodology_notes}</small>
                            </div>
                        </div>`;
        }

        html += `
                        <div class="mt-3">
                            <h6>📋 Full Model Summary</h6>
                            <pre class="p-3 bg-light rounded" style="font-size: 0.85em;">${summary.full_summary || 'Not available'}</pre>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    container.innerHTML = html;

    // Now, create the plots
    for (const [symbol, symbolResult] of Object.entries(arimaResults)) {
        const forecast = symbolResult.forecast || {};
        const summary = symbolResult.summary || {};
        const fittedValues = summary.fitted_values || {};
        const residuals = summary.residuals || {};

        // Forecast Plot
        if (forecast.point_forecasts && results.original_data) {
            const plotDiv = document.getElementById(`arima-forecast-plot-${symbol.replace(/[^a-zA-Z0-9]/g, '')}`);

            // Find the original data for the symbol with proper null checks
            const originalData = results.original_data
                .filter(d => d && d.Date && d[symbol] !== undefined)
                .map(d => ({
                    date: d.Date.split('T')[0],
                    value: d[symbol]
                }));

            if (originalData.length === 0) {
                console.log(`No valid original data found for ${symbol}`);
                continue;
            }

            const lastOriginalDate = new Date(originalData[originalData.length - 1].date);

            const forecastDates = [];
            for (let i = 1; i <= forecast.forecast_steps; i++) {
                const nextDate = new Date(lastOriginalDate);
                nextDate.setDate(lastOriginalDate.getDate() + i);
                forecastDates.push(nextDate.toISOString().split('T')[0]);
            }
            
            const fittedDates = Object.keys(fittedValues).map(d => d.split('T')[0]);
            const fittedData = Object.values(fittedValues);

            const plotData = [
                {
                    x: originalData.map(d => d.date),
                    y: originalData.map(d => d.value),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Original Data',
                    line: { color: 'blue', width: 2 }
                },
                {
                    x: fittedDates,
                    y: fittedData,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Fitted Values',
                    line: { color: 'orange', width: 2 }
                },
                {
                    x: forecastDates,
                    y: forecast.point_forecasts,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Forecast',
                    line: { color: 'green', dash: 'dash', width: 2 },
                    marker: { color: 'green', size: 6 }
                }
            ];

            if (forecast.confidence_intervals) {
                plotData.push({
                    x: forecastDates,
                    y: forecast.confidence_intervals.lower_bound,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Lower CI',
                    line: { color: 'rgba(0,100,80,0.2)', dash: 'dot' },
                    showlegend: false
                });
                plotData.push({
                    x: forecastDates,
                    y: forecast.confidence_intervals.upper_bound,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Upper CI',
                    fill: 'tonexty',
                    fillcolor: 'rgba(0,100,80,0.2)',
                    line: { color: 'rgba(0,100,80,0.2)', dash: 'dot' },
                    showlegend: false
                });
            }

            Plotly.newPlot(plotDiv, plotData, {
                title: `${symbol} ARIMA Forecast`,
                xaxis: { title: 'Date' },
                yaxis: { title: 'Value' },
                legend: { orientation: 'h', y: -0.2 },
                autosize: true,
                margin: { l: 50, r: 20, b: 50, t: 50 }
            }, {
                responsive: true
            });
        }
    }
}

function populateGarchTab(results) {
    const container = document.getElementById('garch-results-cards');
    if (!container) return;

    // Check for GARCH results in the new format
    if (!results.garch_results || !results.garch_results.all_symbols_garch) {
        container.innerHTML = '<div class="alert alert-warning">No GARCH results available</div>';
        return;
    }

    let html = '';
    const garchResults = results.garch_results.all_symbols_garch;
    
    // Handle potential extra nesting from the API response (similar to other tabs)
    let actualGarchResults = garchResults;
    if (garchResults.all_symbols_garch) {
        console.log("Found nested GARCH results, unwrapping...");
        actualGarchResults = garchResults.all_symbols_garch;
    }
    
    console.log("GARCH results structure:", actualGarchResults);
    
    // Loop through all symbols in the GARCH results and create collapsible sections
    for (const [symbol, garchResult] of Object.entries(actualGarchResults)) {
        console.log(`Processing GARCH for ${symbol}:`, garchResult);
        
        const summary = garchResult.summary || 'No summary available';
        const forecast = garchResult.forecast || {};
        const interpretation = garchResult.interpretation || {};
        
        html += `
            <div class="card mb-4">
                <div class="card-header">
                    <button class="btn btn-link text-decoration-none w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#collapseGarch${symbol.replace(/[^a-zA-Z0-9]/g, '')}" aria-expanded="true" aria-controls="collapseGarch${symbol.replace(/[^a-zA-Z0-9]/g, '')}">
                        <h6 class="mb-0">${symbol} - GARCH(1,1) Model Results</h6>
                    </button>
                </div>
                <div id="collapseGarch${symbol.replace(/[^a-zA-Z0-9]/g, '')}" class="collapse show">
                    <div class="card-body">`;

        // NEW: Comprehensive Educational Interpretation Section
        if (interpretation && typeof interpretation === 'object') {
            html += `
                        <!-- Comprehensive Educational Interpretation -->
                        <div class="alert alert-info mb-4">
                            <h6><strong>📚 What We're Testing:</strong></h6>
                            <p>${interpretation.what_were_testing || 'Modeling time-varying volatility using GARCH to capture volatility clustering.'}</p>
                            
                            <h6><strong>🎯 Purpose:</strong></h6>
                            <p>${interpretation.purpose || 'To understand how volatility evolves over time and forecast future risk levels.'}</p>
                            
                            <h6><strong>💡 Key Concepts:</strong></h6>
                            <ul>`;
            
            if (interpretation.key_ideas && Array.isArray(interpretation.key_ideas)) {
                interpretation.key_ideas.forEach(idea => {
                    html += `<li>${idea}</li>`;
                });
            } else {
                html += `<li>GARCH models conditional volatility that changes over time</li>
                        <li>Captures volatility clustering - periods of high and low volatility</li>`;
            }
            
            html += `
                            </ul>
                            
                            <h6><strong>📊 Model Results:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.results) {
                html += `
                                <p><strong>Bottom Line:</strong> ${interpretation.results.bottom_line || 'Model fitted successfully'}</p>
                                <p><strong>Volatility Trend:</strong> ${interpretation.results.volatility_assessment || 'See forecast details below'}</p>
                                <p><strong>Persistence:</strong> ${interpretation.results.evidence_strength || 'See model parameters below'}</p>`;
                
                if (interpretation.results.bottom_line_detailed) {
                    html += `<p><strong>Detailed Analysis:</strong> ${interpretation.results.bottom_line_detailed}</p>`;
                }
                
                if (interpretation.results.shock_impact_analysis) {
                    html += `<p><strong>Shock Impact:</strong> ${interpretation.results.shock_impact_analysis}</p>`;
                }
            }
            
            html += `
                            </div>
                            
                            <h6><strong>🔮 Volatility Insights:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.metrics) {
                const metrics = interpretation.metrics;
                html += `
                                <p><strong>Model Order:</strong> ${metrics.garch_order || 'GARCH(1,1)'}</p>
                                <p><strong>Volatility Trend:</strong> ${metrics.volatility_trend || 'N/A'}</p>`;
                
                if (metrics.forecast_statistics) {
                    const stats = metrics.forecast_statistics;
                    html += `<p><strong>Current Level:</strong> ${stats.current_level ? stats.current_level.toFixed(4) : 'N/A'} (${stats.volatility_level || 'N/A'})</p>`;
                    html += `<p><strong>Forecast Change:</strong> ${stats.change ? (stats.change * 100).toFixed(2) + '%' : 'N/A'}</p>`;
                }
                
                if (metrics.garch_explanation) {
                    html += `<p><strong>Model Explanation:</strong> ${metrics.garch_explanation}</p>`;
                }
                
                if (metrics.clustering_explanation) {
                    html += `<div class="mt-2"><small><strong>Volatility Clustering:</strong> ${metrics.clustering_explanation}</small></div>`;
                }
            }
            
            html += `
                            </div>
                            
                            <h6><strong>🔍 What This Means:</strong></h6>
                            <div class="bg-light p-3 rounded mb-3">`;
            
            if (interpretation.implications) {
                html += `
                                <p><strong>Practical Meaning:</strong> ${interpretation.implications.practical_meaning || 'Model provides volatility forecasts for risk management.'}</p>
                                <p><strong>Risk Management:</strong> ${interpretation.implications.recommendations || 'Use forecasts for portfolio risk assessment.'}</p>`;
                
                if (interpretation.implications.limitations) {
                    html += `<p><strong>Limitations:</strong> ${interpretation.implications.limitations}</p>`;
                }
            }
            
            html += `
                            </div>
                        </div>`;
        } else {
            // Fallback for old format
            html += `
                        <div class="alert alert-info">
                            <h6><strong>GARCH Model Interpretation:</strong></h6>
                            <p>${interpretation || 'GARCH model fitted to capture volatility clustering patterns.'}</p>
                        </div>`;
        }

        html += `
                        <div class="row">
                            <!-- Model Summary Section -->
                            <div class="col-md-6">
                                <h6>📈 Model Parameters</h6>`;

        // Extract parameters from summary if available
        if (typeof summary === 'string' && summary.includes('omega') && summary.includes('alpha') && summary.includes('beta')) {
            // Try to parse parameters from the summary text for display
            html += `
                                <div class="alert alert-light">
                                    <small><strong>Parameter Interpretation:</strong><br>
                                    • ω (omega): Long-run variance baseline<br>
                                    • α (alpha): Sensitivity to recent shocks<br>
                                    • β (beta): Persistence of past volatility<br>
                                    • Persistence = α + β (should be < 1 for stability)</small>
                                </div>`;
        }

        // Add forecast summary table
        if (forecast.point_forecasts && Array.isArray(forecast.point_forecasts)) {
            html += `
                                <h6>🔮 Forecast Summary</h6>
                                <table class="table table-bordered table-sm">
                                    <tbody>
                                        <tr><th>Forecast Steps</th><td>${forecast.forecast_steps || forecast.point_forecasts.length}</td></tr>
                                        <tr><th>First Value</th><td>${forecast.point_forecasts[0] ? forecast.point_forecasts[0].toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>Last Value</th><td>${forecast.point_forecasts[forecast.point_forecasts.length - 1] ? forecast.point_forecasts[forecast.point_forecasts.length - 1].toFixed(4) : 'N/A'}</td></tr>
                                        <tr><th>Method</th><td>${forecast.forecast_method || 'Maximum Likelihood'}</td></tr>
                                    </tbody>
                                </table>`;
        }

        html += `
                            </div>
                            <div class="col-md-6">
                                <div id="garch-forecast-plot-${symbol.replace(/[^a-zA-Z0-9]/g, '')}"></div>
                            </div>
                        </div>`;

        // Add parameter breakdown if available
        if (interpretation && interpretation.metrics && interpretation.metrics.parameters) {
            html += `
                        <div class="mt-4">
                            <div class="alert alert-light">
                                <h6>⚙️ Model Parameters Breakdown:</h6>
                                <div class="row">`;
            
            const params = interpretation.metrics.parameters;
            if (params.omega !== undefined) {
                html += `<div class="col-md-4"><strong>Omega (ω):</strong><br><small>Baseline volatility: ${params.omega}</small></div>`;
            }
            if (params.alpha !== undefined) {
                html += `<div class="col-md-4"><strong>Alpha (α):</strong><br><small>Shock sensitivity: ${params.alpha}</small></div>`;
            }
            if (params.beta !== undefined) {
                html += `<div class="col-md-4"><strong>Beta (β):</strong><br><small>Volatility memory: ${params.beta}</small></div>`;
            }
            if (params.persistence !== undefined) {
                html += `<div class="col-md-12 mt-2"><strong>Persistence (α+β):</strong> ${params.persistence} - ${params.persistence < 1 ? 'Stable ✅' : 'High/Unstable ⚠️'}</div>`;
            }
            
            html += `
                                </div>
                            </div>
                        </div>`;
        }

        // Add methodology notes if available
        if (interpretation && interpretation.implications && interpretation.implications.methodology_notes) {
            html += `
                        <div class="mt-4">
                            <div class="alert alert-light">
                                <h6>📚 Methodology Notes:</h6>
                                <small>${interpretation.implications.methodology_notes}</small>
                            </div>
                        </div>`;
        }

        html += `
                        <div class="mt-3">
                            <h6>📋 Full Model Summary</h6>
                            <pre class="p-3 bg-light rounded" style="font-size: 0.75em; overflow-x: auto;">${summary.full_summary || 'Not available'}</pre>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    container.innerHTML = html;

    // Create GARCH forecast plots after DOM is updated
    setTimeout(() => {
        for (const [symbol, garchResult] of Object.entries(actualGarchResults)) {
            if (Array.isArray(garchResult.forecast) && garchResult.forecast.length > 0) {
                createGarchForecastPlot(`garch-forecast-plot-${symbol.replace(/[^a-zA-Z0-9]/g, '')}`, garchResult.forecast, symbol);
            }
        }
    }, 100);
}

function populateSpilloverTab(results) {
    const container = document.getElementById('spillover-content') || document.getElementById('spillover-results-container');
    if (!container) return;

    // Robustly unwrap nested spillover_results, similar to ARIMA/GARCH
    let spilloverData = results.spillover_results;
    while (spilloverData && typeof spilloverData === 'object' && spilloverData.spillover_results) {
        console.log("Unwrapping nested spillover_results object...");
        spilloverData = spilloverData.spillover_results;
    }

    // Check if spillover analysis was performed
    if (!spilloverData && !results.var_results && !results.granger_causality_results && !results.multivariate_garch_results) {
        container.innerHTML = '<div class="alert alert-warning">No spillover analysis results available. Enable spillover analysis in the pipeline configuration.</div>';
        return;
    }

    let html = '';

    // =====  SPILLOVER ANALYSIS RESULTS =====
    if (spilloverData) {
        // Total Spillover Index
        if (spilloverData.total_spillover_index !== undefined) {
            const spilloverLevel = spilloverData.total_spillover_index > 50 ? 'High' : 
                                 spilloverData.total_spillover_index > 25 ? 'Moderate' : 'Low';
            const alertClass = spilloverLevel === 'High' ? 'alert-danger' : 
                             spilloverLevel === 'Moderate' ? 'alert-warning' : 'alert-success';

            html += `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Total Spillover Index</h5>
                    </div>
                    <div class="card-body text-center">
                        <h2 class="display-4 text-primary">${spilloverData.total_spillover_index.toFixed(2)}%</h2>
                        <div class="${alertClass} mt-3">
                            <strong>${spilloverLevel} Interconnectedness:</strong> ${spilloverData.interpretation || 'Analysis complete.'}
                        </div>
                    </div>
                </div>`;
        }

        // Net Spillover Analysis
        if (spilloverData.net_spillover) {
            html += `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Net Directional Spillovers</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">`;

            // Sort net spillovers for better visualization
            const netSpillovers = Object.entries(spilloverData.net_spillover)
                .sort(([,a], [,b]) => b - a);

            netSpillovers.forEach(([symbol, value]) => {
                const isContributor = value > 0;
                const badgeClass = isContributor ? 'bg-danger' : 'bg-success';
                const direction = isContributor ? 'Net Contributor' : 'Net Receiver';
                const icon = isContributor ? '📤' : '📥';

                html += `
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card border-0 shadow-sm">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">${icon} ${symbol}</h6>
                                        <span class="badge ${badgeClass} fs-6">${direction}</span>
                                        <p class="card-text mt-2 fs-5 fw-bold">${value.toFixed(4)}</p>
                                    </div>
                                </div>
                            </div>`;
            });

            html += `
                        </div>
                        <div class="alert alert-info mt-3">
                            <small><strong>Interpretation:</strong> Positive values indicate net contributors (transmit more spillovers than they receive), 
                            while negative values indicate net receivers (receive more spillovers than they transmit).</small>
                        </div>
                    </div>
                </div>`;
        }

        // Pairwise Spillovers
        if (spilloverData.pairwise_spillover) {
            html += `
                <div class="card mb-4">
                    <div class="card-header">
                        <button class="btn btn-link text-decoration-none w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePairwise" aria-expanded="false" aria-controls="collapsePairwise">
                            <h5 class="card-title mb-0">Pairwise Spillover Relationships</h5>
                        </button>
                    </div>
                    <div id="collapsePairwise" class="collapse show">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover table-sm">
                                    <thead class="table-light">
                                        <tr>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>R² (%)</th>
                                            <th>Significant Lags</th>
                                            <th>Strength</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

            Object.entries(spilloverData.pairwise_spillover).forEach(([pair, data]) => {
                const [from, to] = pair.split('_to_');
                const rSquaredPercent = ((data.r_squared || 0) * 100);
                const significantLags = data.significant_lags || [];
                const strength = rSquaredPercent > 25 ? 'Strong' : rSquaredPercent > 10 ? 'Moderate' : 'Weak';
                const strengthClass = strength === 'Strong' ? 'bg-danger' : strength === 'Moderate' ? 'bg-warning' : 'bg-secondary';

                html += `
                                        <tr>
                                            <td><strong>${from}</strong></td>
                                            <td><strong>${to}</strong></td>
                                            <td>${rSquaredPercent.toFixed(2)}%</td>
                                            <td>${significantLags.length > 0 ? significantLags.join(', ') : 'None'}</td>
                                            <td><span class="badge ${strengthClass}">${strength}</span></td>
                                        </tr>`;
            });

            html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    }

    // If no spillover data at all
    if (!html) {
        html = '<div class="alert alert-warning">Spillover analysis was not performed or results are not available.</div>';
    }

    container.innerHTML = html;

    // Create dynamic correlation plot if DCC data is available
    if (results.multivariate_garch_results && results.multivariate_garch_results.dcc_correlation) {
        setTimeout(() => {
            createDCCCorrelationPlot(results.multivariate_garch_results.dcc_correlation);
        }, 100);
    }
}

function createSectionHeader(title, subtitle) {
    return `<h4 class="mt-4">${title}</h4><p class="text-muted">${subtitle}</p>`;
}

function createStatsAndStationarityCard(analysisData, prefix) {
    let cardContent = '<div class="card mb-4"><div class="card-body">';
    // Statistics Table
    if (analysisData.series_statistics) {
        cardContent += createSeriesStatisticsSection(analysisData.series_statistics);
    }
    // Stationarity Tests
    if (analysisData.stationarity_tests) {
        cardContent += '<h6 class="mt-4">Stationarity Tests (ADF)</h6>';
        for (const [symbol, result] of Object.entries(analysisData.stationarity_tests)) {
            cardContent += createStationarityTestResult(symbol, result, prefix);
        }
    }
    cardContent += '</div></div>';
    return cardContent;
}

function createGarchModelCard(symbol, garchResult) {
    return `
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0">GARCH(1,1) Results for ${symbol}</h6>
            </div>
            <div class="card-body">
                <p><strong>Log-Likelihood:</strong> ${garchResult.log_likelihood.toFixed(4)}</p>
                <h6>Model Summary:</h6>
                <pre class="p-3 bg-light rounded">${garchResult.summary}</pre>
                <h6>Interpretation:</h6>
                <p>${garchResult.interpretation}</p>
            </div>
        </div>`;
}

function createGarchResultCard(symbol, garchResult) {
    const forecast = garchResult.forecast || {};
    const summary = garchResult.summary || '';
    const interpretation = garchResult.interpretation || 'No interpretation available';

    let cardContent = `
        <div class="card mb-4">
            <div class="card-header">
                <button class="btn btn-link text-decoration-none w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#collapseGarch${symbol.replace(/[^a-zA-Z0-9]/g, '')}" aria-expanded="true" aria-controls="collapseGarch${symbol.replace(/[^a-zA-Z0-9]/g, '')}">
                    <h6 class="mb-0">GARCH(1,1) Results for ${symbol}</h6>
                </button>
            </div>
            <div id="collapseGarch${symbol.replace(/[^a-zA-Z0-9]/g, '')}" class="collapse show">
                <div class="card-body">`;

    // Interpretation Section
    if (interpretation) {
        cardContent += `
                    <div class="alert alert-info">
                        <strong>Interpretation:</strong> ${interpretation}
                    </div>`;
    }

    // Forecast Section with Plot
    if (Array.isArray(forecast) && forecast.length > 0) {
        cardContent += `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6>Volatility Forecast</h6>
                            <table class="table table-bordered table-sm">
                                <thead>
                                    <tr>
                                        <th>Step</th>
                                        <th>Forecast</th>
                                    </tr>
                                </thead>
                                <tbody>`;

        forecast.slice(0, 5).forEach((value, index) => {
            cardContent += `
                                    <tr>
                                        <td>Step ${index + 1}</td>
                                        <td>${value.toFixed(6)}</td>
                                    </tr>`;
        });

        if (forecast.length > 5) {
            cardContent += `
                                    <tr>
                                        <td colspan="2" class="text-center text-muted">
                                            <small>... and ${forecast.length - 5} more forecast periods</small>
                                        </td>
                                    </tr>`;
        }

        cardContent += `
                                </tbody>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <div id="garch-forecast-plot-${symbol.replace(/[^a-zA-Z0-9]/g, '')}"></div>
                        </div>
                    </div>`;
    }

    // Full Model Summary
    if (summary) {
        cardContent += `
                    <div class="mt-3">
                        <h6>Full Model Summary</h6>
                        <pre class="p-3 bg-light rounded" style="font-size: 0.75em; overflow-x: auto;">${summary}</pre>
                    </div>`;
    }

    cardContent += `
                </div>
            </div>
        </div>`;

    return cardContent;
}

function createStationarityTestResult(symbol, result, prefix) {
    const interpretation = generateStationarityInterpretation(result, symbol);
    return `
        <div class="card shadow-sm mb-3 bg-light">
            <div class="card-body">
                <h6 class="card-title">${symbol}</h6>
                <p class="card-text mb-2">${interpretation}</p>
                <small class="text-muted">
                    ADF Statistic: ${result.adf_statistic.toFixed(4)} | p-value: ${result.p_value.toFixed(4)}
                </small>
                <div class="mt-2">
                    <p class="mb-1"><strong>Critical Values:</strong></p>
                    <ul class="list-unstyled list-inline mb-0">
                        <li class="list-inline-item"><span class="badge bg-secondary">1%: ${result.critical_values['1%'].toFixed(4)}</span></li>
                        <li class="list-inline-item"><span class="badge bg-secondary">5%: ${result.critical_values['5%'].toFixed(4)}</span></li>
                        <li class="list-inline-item"><span class="badge bg-secondary">10%: ${result.critical_values['10%'].toFixed(4)}</span></li>
                    </ul>
                </div>
            </div>
        </div>`;
}

function createNetSpilloverSection(netSpillover, symbols) {
    let content = `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Net Directional Spillovers</h5>
            </div>
            <div class="card-body">
                <ul class="list-group">`;

    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const value = netSpillover[i];
        const badgeClass = value > 0 ? 'success' : 'danger';
        const direction = value > 0 ? 'Net Contributor' : 'Net Receiver';
        content += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <strong>${symbol}</strong>
                        <span>
                            <span class="badge bg-${badgeClass} me-2">${direction}</span>
                            <span class="fw-bold">${value.toFixed(4)}</span>
                        </span>
                    </li>`;
    }

    content += `
                </ul>
            </div>
        </div>`;
    return content;
}

function createMethodologySection(methodology) {
    return `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Methodology</h5>
            </div>
            <div class="card-body">
                <p>${methodology}</p>
            </div>
        </div>`;
}

function createVarModelSection(varDetails) {
    let content = `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">VAR Model Details</h5>
            </div>
            <div class="card-body">
                <p><strong>Optimal Lag:</strong> ${varDetails.optimal_lag}</p>
                <h6>Stationarity of Residuals (ADF Test):</h6>
                <ul class="list-group">`;

    for (const [series, results] of Object.entries(varDetails.residuals_stationarity)) {
        const isStationary = results.p_value < 0.05;
        const badgeClass = isStationary ? 'success' : 'danger';
        const stationarityText = isStationary ? 'Stationary' : 'Non-Stationary';
        content += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${series}
                        <span>
                            <span class="badge bg-${badgeClass}">${stationarityText}</span>
                            (p-value: ${results.p_value.toFixed(4)})
                        </span>
                    </li>`;
    }

    content += `
                </ul>
            </div>
        </div>`;
    return content;
}

function createFevdAnalysisSection(fevdAnalysis) {
    let content = `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Forecast Error Variance Decomposition (FEVD)</h5>
            </div>
            <div class="card-body">
                <p>${fevdAnalysis.interpretation}</p>
                <div class="table-responsive">
                    <table class="table table-bordered table-sm text-center">
                        <thead class="table-light">
                            <tr>
                                <th>Variable</th>`;
    // Headers
    fevdAnalysis.symbols.forEach(symbol => {
        content += `<th>${symbol}</th>`;
    });
    content += `
                            </tr>
                        </thead>
                        <tbody>`;
    // Rows
    fevdAnalysis.fevd_table.forEach((row, i) => {
        content += `
                            <tr>
                                <td><strong>${fevdAnalysis.symbols[i]}</strong></td>`;
        row.forEach(val => {
            content += `<td>${val.toFixed(4)}</td>`;
        });
        content += `
                            </tr>`;
    });

    content += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    return content;
}

// Helper function to create GARCH forecast plots
function createGarchForecastPlot(elementId, forecastData, symbol) {
    const plotDiv = document.getElementById(elementId);
    if (!plotDiv || !Array.isArray(forecastData) || forecastData.length === 0) return;

    const plotData = [{
        x: Array.from({length: forecastData.length}, (_, i) => `Step ${i + 1}`),
        y: forecastData,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Volatility Forecast',
        line: {
            color: 'rgba(54, 162, 235, 1)',
            width: 2
        },
        marker: {
            color: 'rgba(54, 162, 235, 0.8)',
            size: 6
        }
    }];

    Plotly.newPlot(plotDiv, plotData, {
        title: `${symbol} GARCH Volatility Forecast`,
        xaxis: { title: 'Forecast Steps' },
        yaxis: { title: 'Conditional Volatility' },
        autosize: true,
        margin: { l: 50, r: 50, b: 50, t: 80 }
    }, {
        responsive: true
    });
}

// Helper function to create DCC correlation plot
function createDCCCorrelationPlot(dccData) {
    const plotDiv = document.getElementById('dcc-correlation-plot');
    if (!plotDiv || !dccData) return;

    // DCC data is typically time-varying correlations
    // This is a placeholder implementation - adjust based on actual DCC data structure
    if (Array.isArray(dccData) && dccData.length > 0) {
        const plotData = [{
            z: dccData,
            type: 'heatmap',
            colorscale: 'RdBu',
            reversescale: true,
            showscale: true
        }];

        Plotly.newPlot(plotDiv, plotData, {
            title: 'Dynamic Conditional Correlations Over Time',
            xaxis: { title: 'Asset Pair' },
            yaxis: { title: 'Time Period' },
            autosize: true,
            margin: { l: 50, r: 50, b: 50, t: 80 }
        }, {
            responsive: true
        });
    } else {
        plotDiv.innerHTML = '<div class="alert alert-info">DCC correlation visualization not available for current data structure.</div>';
    }
}

// Helper function to populate data tables
function populateDataTables(results) {
    // This function handles the data tables tab
    const container = document.getElementById('data-tables-content');
    if (!container) return;

    let html = '';

    // Add data table sections for each available dataset
    const datasets = [
        { key: 'original_data', title: 'Original Price Data', icon: '📈' },
        { key: 'returns_data', title: 'Returns Data', icon: '📊' },
        { key: 'pre_garch_data', title: 'Pre-GARCH Data', icon: '🔄' },
        { key: 'post_garch_data', title: 'Post-GARCH Data', icon: '✨' }
    ];

    datasets.forEach(dataset => {
        if (results[dataset.key] && Array.isArray(results[dataset.key]) && results[dataset.key].length > 0) {
            html += createDataTableSection(results[dataset.key], dataset.title, dataset.icon);
        }
    });

    if (!html) {
        html = '<div class="alert alert-warning">No data tables available.</div>';
    }

    container.innerHTML = html;
}

// Helper function to create individual data table sections
function createDataTableSection(data, title, icon) {
    const sampleData = data.slice(0, 10); // Show first 10 rows
    const headers = Object.keys(sampleData[0] || {});
    
    let html = `
        <div class="card mb-4">
            <div class="card-header">
                <button class="btn btn-link text-decoration-none w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${title.replace(/\s+/g, '')}" aria-expanded="false" aria-controls="collapse${title.replace(/\s+/g, '')}">
                    <h5 class="card-title mb-0">${title}</h5>
                </button>
            </div>
            <div id="collapse${title.replace(/\s+/g, '')}" class="collapse">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover table-sm">
                            <thead class="table-light">
                                <tr>`;
    
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    
    html += `
                                </tr>
                            </thead>
                            <tbody>`;
    
    sampleData.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            const value = row[header];
            const formattedValue = typeof value === 'number' ? value.toFixed(6) : value;
            html += `<td>${formattedValue}</td>`;
        });
        html += '</tr>';
    });
    
    html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="alert alert-info mt-3">
                        <small><strong>Note:</strong> Showing first 10 rows of ${data.length} total observations.</small>
                    </div>
                </div>
            </div>
        </div>`;
    
    return html;
}

// Helper function to populate the Series Statistics tab
function populateSeriesStatsTab(results) {
    const container = document.getElementById('series-stats-content');
    
    // Add null check to prevent errors if container doesn't exist
    if (!container) {
        console.log('Series stats container not found - skipping series stats population');
        return;
    }
    
    if (!results.series_stats) {
        container.innerHTML = '<div class="alert alert-warning">No series statistics available</div>';
        return;
    }
    
    let html = '';
    
    // Create a comprehensive statistics table for all symbols
    html += `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Descriptive Statistics Summary</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Symbol</th>
                                <th>Count</th>
                                <th>Mean</th>
                                <th>Std Dev</th>
                                <th>Min</th>
                                <th>25%</th>
                                <th>50% (Median)</th>
                                <th>75%</th>
                                <th>Max</th>
                                <th>Skewness</th>
                                <th>Kurtosis</th>
                            </tr>
                        </thead>
                        <tbody>`;
    
    // Populate statistics for each symbol
    for (const [symbol, stats] of Object.entries(results.series_stats)) {
        html += `
            <tr>
                <td><strong>${symbol}</strong></td>
                <td>${stats.count || 'N/A'}</td>
                <td>${stats.mean !== undefined ? stats.mean.toFixed(4) : 'N/A'}</td>
                <td>${stats.std !== undefined ? stats.std.toFixed(4) : 'N/A'}</td>
                <td>${stats.min !== undefined ? stats.min.toFixed(4) : 'N/A'}</td>
                <td>${stats['25%'] ? stats['25%'].toFixed(4) : 'N/A'}</td>
                <td>${stats['50%'] ? stats['50%'].toFixed(4) : 'N/A'}</td>
                <td>${stats['75%'] ? stats['75%'].toFixed(4) : 'N/A'}</td>
                <td>${stats.max ? stats.max.toFixed(4) : 'N/A'}</td>
                <td>${stats.skew ? stats.skew.toFixed(4) : 'N/A'}</td>
                <td>${stats.kurt ? stats.kurt.toFixed(4) : 'N/A'}</td>
            </tr>`;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    
    // Create individual symbol cards with detailed analysis
    html += `
        <div class="row">`;
    
    for (const [symbol, stats] of Object.entries(results.series_stats)) {
        const skewInterpretation = getSkewnessInterpretation(stats.skew);
        const kurtosisInterpretation = getKurtosisInterpretation(stats.kurt);
        
        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="card-title mb-0">${symbol}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center mb-3">
                            <div class="col-6">
                                <div class="border-end">
                                    <h5 class="text-primary mb-0">${stats.count || 'N/A'}</h5>
                                    <small class="text-muted">Observations</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <h5 class="text-success mb-0">${stats.mean ? stats.mean.toFixed(4) : 'N/A'}</h5>
                                <small class="text-muted">Mean</small>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Range:</span>
                                <span><strong>${stats.min ? stats.min.toFixed(4) : 'N/A'} to ${stats.max ? stats.max.toFixed(4) : 'N/A'}</strong></span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Std Dev:</span>
                                <span><strong>${stats.std ? stats.std.toFixed(4) : 'N/A'}</strong></span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="alert alert-info py-2">
                                <small><strong>Distribution:</strong><br>
                                ${skewInterpretation}<br>
                                ${kurtosisInterpretation}</small>
                            </div>
                        </div>
                        
                        <div class="text-center">
                            <div class="d-flex justify-content-around">
                                <div>
                                    <strong>Q1</strong><br>
                                    <small>${stats['25%'] ? stats['25%'].toFixed(4) : 'N/A'}</small>
                                </div>
                                <div>
                                    <strong>Median</strong><br>
                                    <small>${stats['50%'] ? stats['50%'].toFixed(4) : 'N/A'}</small>
                                </div>
                                <div>
                                    <strong>Q3</strong><br>
                                    <small>${stats['75%'] ? stats['75%'].toFixed(4) : 'N/A'}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }
    
    html += `
        </div>`;
    
    container.innerHTML = html;
}

function getSkewnessInterpretation(skew) {
    if (skew === null || skew === undefined) return 'Skewness: N/A';
    
    if (Math.abs(skew) < 0.5) {
        return `Skewness: ${skew.toFixed(3)} (Approximately symmetric)`;
    } else if (skew > 0.5) {
        return `Skewness: ${skew.toFixed(3)} (Right-skewed/Positive skew)`;
    } else {
        return `Skewness: ${skew.toFixed(3)} (Left-skewed/Negative skew)`;
    }
}

function getKurtosisInterpretation(kurt) {
    if (kurt === null || kurt === undefined) return 'Kurtosis: N/A';
    
    if (Math.abs(kurt - 3) < 0.5) {
        return `Kurtosis: ${kurt.toFixed(3)} (Normal distribution-like)`;
    } else if (kurt > 3) {
        return `Kurtosis: ${kurt.toFixed(3)} (Heavy-tailed/Leptokurtic)`;
    } else {
        return `Kurtosis: ${kurt.toFixed(3)} (Light-tailed/Platykurtic)`;
    }
}

// Add missing helper functions
function generateStationarityInterpretation(result, symbol) {
    if (!result.adf_statistic || result.p_value === null || result.p_value === undefined) {
        return `Stationarity test results for ${symbol} are incomplete.`;
    }
    
    const isStationary = result.is_stationary;
    const pValue = result.p_value;
    const adfStat = result.adf_statistic;
    
    if (isStationary) {
        return `The ADF test for ${symbol} shows strong evidence of stationarity (p-value: ${pValue.toFixed(6)}). The test statistic of ${adfStat.toFixed(4)} is sufficiently negative to reject the null hypothesis of a unit root, indicating the series has stable statistical properties over time.`;
    } else {
        return `The ADF test for ${symbol} suggests non-stationarity (p-value: ${pValue.toFixed(6)}). The test statistic of ${adfStat.toFixed(4)} does not provide sufficient evidence to reject the null hypothesis of a unit root, indicating the series may have changing statistical properties over time.`;
    }
}

function createSeriesStatisticsSection(seriesStats) {
    if (!seriesStats || Object.keys(seriesStats).length === 0) {
        return '<div class="alert alert-info">No series statistics available</div>';
    }
    
    let html = '<h6>Series Statistics</h6>';
    html += '<div class="table-responsive">';
    html += '<table class="table table-sm table-striped">';
    html += '<thead><tr><th>Symbol</th><th>Observations</th><th>Mean</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Skewness</th><th>Kurtosis</th></tr></thead>';
    html += '<tbody>';
    
    for (const [symbol, stats] of Object.entries(seriesStats)) {
        html += `
            <tr>
                <td><strong>${symbol}</strong></td>
                <td>${stats.n || stats.count || 'N/A'}</td>
                <td>${stats.mean !== undefined ? stats.mean.toFixed(6) : 'N/A'}</td>
                <td>${stats.std !== undefined ? stats.std.toFixed(6) : 'N/A'}</td>
                <td>${stats.min !== undefined ? stats.min.toFixed(6) : 'N/A'}</td>
                <td>${stats.max !== undefined ? stats.max.toFixed(6) : 'N/A'}</td>
                <td>${stats.skew !== undefined ? stats.skew.toFixed(6) : 'N/A'}</td>
                <td>${stats.kurt !== undefined ? stats.kurt.toFixed(6) : 'N/A'}</td>
            </tr>`;
    }
    
    html += '</tbody></table></div>';
    return html;
}

// Helper function to populate individual data tables for the Data Lineage tab
function populateIndividualDataTables(results) {
    console.log("Populating individual data tables...");
    
    // Define the mappings between data keys and table IDs
    const tableConfigs = [
        {
            dataKey: 'original_data',
            tableId: 'price-data-table',
            name: 'Price Data'
        },
        {
            dataKey: 'returns_data', 
            tableId: 'returns-data-table',
            name: 'Returns Data'
        },
        {
            dataKey: 'scaled_data',
            tableId: 'garch-data-table', 
            name: 'Scaled Data for GARCH'
        },
        {
            dataKey: 'pre_garch_data',
            tableId: 'pre-garch-data-table',
            name: 'Pre-GARCH Data'
        },
        {
            dataKey: 'post_garch_data',
            tableId: 'post-garch-data-table',
            name: 'Post-GARCH Data'
        }
    ];
    
    tableConfigs.forEach(config => {
        const data = results[config.dataKey];
        const table = document.getElementById(config.tableId);
        
        if (!table) {
            console.log(`Table ${config.tableId} not found`);
            return;
        }
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log(`No ${config.name} available`);
            const tbody = table.querySelector('tbody');
            const thead = table.querySelector('thead tr');
            if (tbody) tbody.innerHTML = '<tr><td colspan="100%" class="text-center text-muted">No data available</td></tr>';
            if (thead) thead.innerHTML = '<th>No Data</th>';
            return;
        }
        
        console.log(`Populating ${config.name} table with ${data.length} rows`);
        
        // Get column headers from the first data row
        const firstRow = data[0];
        const headers = Object.keys(firstRow);
        
        // Populate table headers
        const thead = table.querySelector('thead tr');
        if (thead) {
            thead.innerHTML = headers.map(header => `<th>${header}</th>`).join('');
        }
        
        // Populate table body
        const tbody = table.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = data.map(row => {
                return '<tr>' + headers.map(header => {
                    const value = row[header];
                    let formattedValue;
                    
                    if (typeof value === 'number') {
                        // Format numbers to 6 decimal places for data precision
                        formattedValue = value.toFixed(6);
                    } else if (typeof value === 'string' && header.toLowerCase().includes('date') || header === 'index') {
                        // Format dates to show just the date part (remove time)
                        formattedValue = value.split('T')[0];
                    } else {
                        formattedValue = value || 'N/A';
                    }
                    
                    return `<td>${formattedValue}</td>`;
                }).join('') + '</tr>';
            }).join('');
        }
        
        console.log(`Successfully populated ${config.name} table`);
    });
    
    // Add export functionality for CSV downloads
    setupDataTableExports(results);
}

// Helper function to setup CSV export functionality
function setupDataTableExports(results) {
    const exportConfigs = [
        { buttonId: 'export-price-csv', dataKey: 'original_data', filename: 'price_series_data.csv' },
        { buttonId: 'export-returns-csv', dataKey: 'returns_data', filename: 'returns_data.csv' },
        { buttonId: 'export-garch-csv', dataKey: 'scaled_data', filename: 'scaled_garch_data.csv' },
        { buttonId: 'export-pre-garch-csv', dataKey: 'pre_garch_data', filename: 'pre_garch_data.csv' },
        { buttonId: 'export-post-garch-csv', dataKey: 'post_garch_data', filename: 'post_garch_data.csv' }
    ];
    
    exportConfigs.forEach(config => {
        const button = document.getElementById(config.buttonId);
        if (!button) return;
        
        // Remove any existing event listeners
        button.replaceWith(button.cloneNode(true));
        const newButton = document.getElementById(config.buttonId);
        
        newButton.addEventListener('click', function() {
            const data = results[config.dataKey];
            if (!data || !Array.isArray(data) || data.length ===  0) {
                alert('No data available to export');
                return;
            }
            
            // Convert JSON data to CSV
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','), // Header row
                ...data.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        // Handle dates and numbers appropriately for CSV
                        if (typeof value === 'string' && (header.toLowerCase().includes('date') || header === 'index')) {
                            return value.split('T')[0]; // Just the date part
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');
            
            // Create and trigger download

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', config.filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
                       
            // Show success feedback
            const originalText = newButton.innerHTML;
            newButton.innerHTML = '<i class="bi bi-check"></i> Downloaded!';
            newButton.classList.remove('btn-outline-primary');
            newButton.classList.add('btn-success');
            
            setTimeout(() => {
                newButton.innerHTML = originalText;
                newButton.classList.remove('btn-success');
                newButton.classList.add('btn-outline-primary');
            }, 2000);
            
            console.log(`Exported ${config.filename}`);
        });
    });
}