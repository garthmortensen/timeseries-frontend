/**
// === FILE META OPENING ===
// file: ./timeseries-frontend/static/js/main.js
// role: frontend
// desc: main JavaScript file handling UI interactions, tooltips, and navigation for the web interface
// === FILE META CLOSING ===
 */

// static/js/main.js

/**
 * Main JavaScript file for Timeseries Pipeline Frontend
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Handle tabbed navigation with URL parameters
    const tabFromUrl = getTabFromUrl();
    if (tabFromUrl) {
        try {
            const tab = new bootstrap.Tab(document.querySelector(`#${tabFromUrl}-tab`));
            tab.show();
        } catch (e) {
            console.error('Tab not found:', e);
        }
    }

    // Add click listeners to tabs to update URL
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(function(tab) {
        tab.addEventListener('shown.bs.tab', function(event) {
            const id = event.target.id.replace('-tab', '');
            updateUrlWithTab(id);
        });
    });

    // Format number inputs with step controls
    document.querySelectorAll('input[type="number"]').forEach(function(input) {
        input.addEventListener('wheel', function(e) {
            // Prevent scrolling from changing the input value
            e.preventDefault();
        });
    });

    // Toggle collapse elements
    document.querySelectorAll('[data-toggle="collapse"]').forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(element.getAttribute('data-target'));
            if (target) {
                if (target.classList.contains('show')) {
                    target.classList.remove('show');
                } else {
                    target.classList.add('show');
                }
            }
        });
    });

    // Pre-populate analysis form if iteration data is available
    if (window.location.pathname === '/analysis/' || window.location.pathname === '/timeseries/analysis/') {
        prepopulateAnalysisForm();
    }
});

/**
 * Pre-populates the analysis form with data from sessionStorage.
 */
function prepopulateAnalysisForm() {
    const analysisConfigString = sessionStorage.getItem('analysisConfig');
    if (analysisConfigString) {
        console.log("Found analysis config in sessionStorage. Pre-populating form.");
        const config = JSON.parse(analysisConfigString);

        // Pre-populate the form fields based on the config
        
        // Handle file display
        if (config.fileName) {
            const fileDisplay = document.getElementById('iterated-file-display');
            const fileNameElement = document.getElementById('iterated-filename');
            const fileUploadSection = document.getElementById('file-upload-section');
            if (fileDisplay && fileNameElement && fileUploadSection) {
                fileNameElement.textContent = config.fileName;
                fileDisplay.style.display = 'block';
                // Hide the file upload input to prevent confusion
                fileUploadSection.style.display = 'none';
            }
        }

        // Pre-populate other form fields...
        // Make sure to handle all the different input types: text, number, radio, select

        // Data Source and Symbol
        if (config.data_source) {
            const radio = document.querySelector(`input[name="data_source"][value="${config.data_source}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change')); // Trigger UI updates
            }
        }

        if (config.symbol_list) {
            const radio = document.querySelector(`input[name="symbol_list"][value="${config.symbol_list}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        }
        
        if (config.manual_symbol) {
            const manualSymbolInput = document.getElementById('manual_symbol');
            if (manualSymbolInput) {
                manualSymbolInput.value = config.manual_symbol;
            }
        }

        // Dates
        if (config.start_date) {
            document.getElementById('start_date').value = config.start_date;
        }
        if (config.end_date) {
            document.getElementById('end_date').value = config.end_date;
        }

        // Preprocessing
        if (config.preprocess && Array.isArray(config.preprocess)) {
            config.preprocess.forEach(step => {
                const checkbox = document.getElementById(`preprocess_${step}`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // Model Parameters
        if (config.arima_params) {
            document.getElementById('p_value').value = config.arima_params.p;
            document.getElementById('d_value').value = config.arima_params.d;
            document.getElementById('q_value').value = config.arima_params.q;
        }
        if (config.garch_params) {
            document.getElementById('garch_p').value = config.garch_params.p;
            document.getElementById('garch_q').value = config.garch_params.q;
        }
        if (config.var_lags) {
            document.getElementById('lags').value = config.var_lags;
        }
        if (config.forecast_steps) {
            document.getElementById('forecast_steps').value = config.forecast_steps;
        }
        if (config.spillover_lags) {
            document.getElementById('spillover_lags').value = config.spillover_lags;
        }

        // Clear the stored config so it's not used again on a normal page load
        sessionStorage.removeItem('analysisConfig');
        console.log("Cleared analysisConfig from sessionStorage.");
    } else {
        console.log("No analysis config found in sessionStorage.");
        // Ensure the iterated file display is hidden if no config is found
        const fileDisplay = document.getElementById('iterated-file-display');
        if (fileDisplay) {
            fileDisplay.style.display = 'none';
        }
        const fileUploadSection = document.getElementById('file-upload-section');
        if (fileUploadSection) {
            fileUploadSection.style.display = 'block';
        }
    }
}

/**
 * Get the current tab from URL parameters
 * @returns {string|null} The tab name from URL or null if not found
 */
function getTabFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab');
}

/**
 * Update the URL with the current tab without page reload
 * @param {string} tab The tab name to add to the URL
 */
function updateUrlWithTab(tab) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('tab', tab);
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.replaceState({}, '', newUrl);
}

/**
 * Format a number with specified precision
 * @param {number} number The number to format
 * @param {number} precision The decimal precision
 * @returns {string} The formatted number
 */
function formatNumber(number, precision = 4) {
    return Number(number).toFixed(precision);
}

/**
 * Create a Plotly time series chart
 * @param {string} elementId The ID of the HTML element to render the chart
 * @param {Array} x The x-axis data
 * @param {Array} y The y-axis data
 * @param {string} title The chart title
 * @param {string} xTitle The x-axis title
 * @param {string} yTitle The y-axis title
 */
function createTimeSeriesChart(elementId, x, y, title, xTitle, yTitle) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const data = [{
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines',
        line: {
            color: '#003366',
            width: 2
        }
    }];

    const layout = {
        title: title,
        xaxis: {
            title: xTitle,
            showgrid: true,
            zeroline: false
        },
        yaxis: {
            title: yTitle,
            showgrid: true,
            zeroline: true
        },
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 80,
            pad: 4
        },
        autosize: true,
        responsive: true
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
            'lasso2d',
            'select2d'
        ],
        toImageButtonOptions: {
            format: 'png',
            filename: 'timeseries_chart',
            scale: 1
        }
    };

    Plotly.newPlot(elementId, data, layout, config);

    // Make chart responsive
    window.addEventListener('resize', function() {
        Plotly.Plots.resize(elementId);
    });
}
