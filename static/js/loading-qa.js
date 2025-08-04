// Q&A Loading System for Analysis Pages
const LOADING_QA_MESSAGES = [
    'Analytics service processing request...\nQ: When was the ROC curve created?',
    'Analytics service processing request...\nA: During WWII, for radar signal detection',
    'Analytics service processing request...\nQ: What does ARIMA tell you?',
    'Analytics service processing request...\nA: How past values and trends shape the future',
    'Analytics service processing request...\nQ: Who invented the correlation coefficient?',
    'Analytics service processing request...\nA: Karl Pearson in 1896',
    'Analytics service processing request...\nQ: What is the Central Limit Theorem about?',
    'Analytics service processing request...\nA: Sample means approach normal distribution',
    'Analytics service processing request...\nQ: What does GARCH tell you?',
    'Analytics service processing request...\nA: When volatility spikes are likely to return',
    'Analytics service processing request...\nQ: Who developed the Black-Scholes model?',
    'Analytics service processing request...\nA: Fischer Black, Myron Scholes, and Robert Merton in 1973',
    'Analytics service processing request...\nQ: What is the difference between Type I and Type II errors?',
    'Analytics service processing request...\nA: Type I: False positive, Type II: False negative',
    'Analytics service processing request...\nQ: What does VAR stand for in econometrics?',
    'Analytics service processing request...\nA: Vector AutoRegression',
    'Analytics service processing request...\nQ: Who created the concept of statistical significance?',
    'Analytics service processing request...\nA: Ronald Fisher in the 1920s',
    'Analytics service processing request...\nQ: What is heteroskedasticity?',
    'Analytics service processing request...\nA: When error variance is not constant across observations',
    'Analytics service processing request...\nQ: What is the Diebold-Yilmaz spillover index?',
    'Analytics service processing request...\nA: A measure of how much variance comes from spillovers',
    'Analytics service processing request...\nQ: Who developed the ARCH model?',
    'Analytics service processing request...\nA: Robert Engle in 1982 (Nobel Prize 2003)',
    'Analytics service processing request...\nQ: What does FEVD stand for?',
    'Analytics service processing request...\nA: Forecast Error Variance Decomposition',
    'Analytics service processing request...\nQ: Who are Diebold and Yilmaz?',
    'Analytics service processing request...\nA: Francis Diebold and Kamil Yilmaz, creators of spillover methodology',
    'Analytics service processing request...\nQ: What does MAE measure?',
    'Analytics service processing request...\nA: Mean Absolute Error - average prediction accuracy',
    'Analytics service processing request...\nQ: What is Granger causality?',
    'Analytics service processing request...\nA: Tests if past values of X help predict Y',
    'Analytics service processing request...\nQ: What is the difference between CCC and DCC GARCH?',
    'Analytics service processing request...\nA: CCC assumes constant correlations, DCC allows time-varying correlations',
    'Analytics service processing request...\nQ: What does AIC stand for?',
    'Analytics service processing request...\nA: Akaike Information Criterion - model selection tool',
    'Analytics service processing request...\nQ: What is a stationarity test?',
    'Analytics service processing request...\nA: Checks if statistical properties remain constant over time',
    'Analytics service processing request...\nQ: What does differencing do in ARIMA?',
    'Analytics service processing request...\nA: Makes non-stationary data stationary by removing trends',
    'Analytics service processing request...\nQ: Who developed the VAR model?',
    'Analytics service processing request...\nA: Christopher Sims in 1980 (Nobel Prize 2011)',
    'Analytics service processing request...\nQ: What is volatility clustering?',
    'Analytics service processing request...\nA: High volatility periods followed by high volatility periods',
    'Analytics service processing request...\nQ: What does persistence mean in GARCH?',
    'Analytics service processing request...\nA: How long volatility shocks last (α + β)',
    'Analytics service processing request...\nQ: What is conditional mean filtering?',
    'Analytics service processing request...\nA: Removing predictable patterns from time series',
    'Analytics service processing request...\nQ: What does RMSE measure?',
    'Analytics service processing request...\nA: Root Mean Square Error - forecast accuracy metric',
    'Analytics service processing request...\nQ: What is the purpose of standardized residuals?',
    'Analytics service processing request...\nA: To check if model assumptions are satisfied',
    'Analytics service processing request...\nQ: What does BIC stand for?',
    'Analytics service processing request...\nA: Bayesian Information Criterion - penalizes model complexity',
    'Analytics service processing request...\nQ: What is the omega parameter in GARCH?',
    'Analytics service processing request...\nA: The baseline volatility floor (ω)',
    'Analytics service processing request...\nQ: What does alpha measure in GARCH?',
    'Analytics service processing request...\nA: Sensitivity to recent shocks (α)',
    'Analytics service processing request...\nQ: What does beta measure in GARCH?',
    'Analytics service processing request...\nA: Volatility memory factor (β)',
    'Analytics service processing request...\nQ: What is a net spillover effect?',
    'Analytics service processing request...\nA: Difference between spillovers transmitted and received',
    'Analytics service processing request...\nQ: What is the half-life of volatility?',
    'Analytics service processing request...\nA: Time for volatility shock to decay by 50%',
    'Analytics service processing request...\nQ: What does skewness measure?',
    'Analytics service processing request...\nA: Asymmetry in data distribution',
    'Analytics service processing request...\nQ: What does kurtosis measure?',
    'Analytics service processing request...\nA: Tail heaviness of data distribution',
    'Analytics service processing request...\nQ: What is annualized volatility?',
    'Analytics service processing request...\nA: Standard deviation scaled to yearly frequency'
];

class LoadingQAManager {
    constructor(textElementSelector = '#qaText') {
        this.messages = LOADING_QA_MESSAGES;
        this.textElementSelector = textElementSelector;
        this.interval = null;
        this.answerTimeout = null;
        this.shuffledIndices = [];
        this.currentIndex = 0;
        this.displayDuration = 5000; // 5 seconds per Q&A pair
        this.answerDelay = 2500; // Show answer after 2.5 seconds
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    prepareShuffledIndices() {
        this.shuffledIndices = [];
        for (let i = 0; i < this.messages.length; i += 2) {
            if (this.messages[i + 1]) {
                this.shuffledIndices.push(i);
            }
        }
        this.shuffleArray(this.shuffledIndices);
        this.currentIndex = 0;
    }

    start() {
        const textElement = document.querySelector(this.textElementSelector);
        if (!textElement) {
            console.error(`Could not find loading text element: ${this.textElementSelector}`);
            return;
        }

        this.prepareShuffledIndices();

        if (this.shuffledIndices.length === 0) {
            textElement.textContent = 'Analytics service processing request...';
            return;
        }

        this.displayNextQAPair(textElement);
        this.interval = setInterval(() => {
            this.displayNextQAPair(textElement);
        }, this.displayDuration);
    }

    displayNextQAPair(textElement) {
        if (this.currentIndex >= this.shuffledIndices.length) {
            this.prepareShuffledIndices();
            if (this.shuffledIndices.length === 0) {
                textElement.textContent = 'Analytics service processing request...';
                this.stop();
                return;
            }
        }

        const questionIndex = this.shuffledIndices[this.currentIndex];
        const question = this.messages[questionIndex];
        const answer = this.messages[questionIndex + 1];

        textElement.textContent = question;

        if (this.answerTimeout) {
            clearTimeout(this.answerTimeout);
        }

        this.answerTimeout = setTimeout(() => {
            if (textElement.textContent === question) {
                textElement.textContent = answer;
            }
        }, this.answerDelay);

        this.currentIndex++;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.answerTimeout) {
            clearTimeout(this.answerTimeout);
            this.answerTimeout = null;
        }
    }
}

// Global instance for easy access
window.loadingQA = new LoadingQAManager();