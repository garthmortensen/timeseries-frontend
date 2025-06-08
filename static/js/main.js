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
});

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
