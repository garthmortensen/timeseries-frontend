// Q&A Loading System for Analysis Pages
const LOADING_QA_MESSAGES = [
    'Loading...\nQ: When was the ROC curve created?',
    'Loading...\nA: During WWII, for radar signal detection',
    'Loading...\nQ: What does ARIMA tell you?',
    'Loading...\nA: How past values and trends shape the future',
    'Loading...\nQ: Who invented the correlation coefficient?',
    'Loading...\nA: Karl Pearson in 1896',
    'Loading...\nQ: What is the Central Limit Theorem about?',
    'Loading...\nA: Sample means approach normal distribution',
    'Loading...\nQ: What does GARCH tell you?',
    'Loading...\nA: When volatility spikes are likely to return',
    'Loading...\nQ: Who developed the Black-Scholes model?',
    'Loading...\nA: Fischer Black, Myron Scholes, and Robert Merton in 1973',
    'Loading...\nQ: What is the difference between Type I and Type II errors?',
    'Loading...\nA: Type I: False positive, Type II: False negative',
    'Loading...\nQ: What does VAR stand for in econometrics?',
    'Loading...\nA: Vector AutoRegression',
    'Loading...\nQ: Who created the concept of statistical significance?',
    'Loading...\nA: Ronald Fisher in the 1920s',
    'Loading...\nQ: What is heteroskedasticity?',
    'Loading...\nA: When error variance is not constant across observations',
    'Loading...\nQ: What is the Diebold-Yilmaz spillover index?',
    'Loading...\nA: A measure of how much variance comes from spillovers',
    'Loading...\nQ: Who developed the ARCH model?',
    'Loading...\nA: Robert Engle in 1982 (Nobel Prize 2003)',
    'Loading...\nQ: What does FEVD stand for?',
    'Loading...\nA: Forecast Error Variance Decomposition',
    'Loading...\nQ: Who are Diebold and Yilmaz?',
    'Loading...\nA: Francis Diebold and Kamil Yilmaz, creators of spillover methodology',
    'Loading...\nQ: What does MAE measure?',
    'Loading...\nA: Mean Absolute Error - average prediction accuracy',
    'Loading...\nQ: What is Granger causality?',
    'Loading...\nA: Tests if past values of X help predict Y',
    'Loading...\nQ: What is the difference between CCC and DCC GARCH?',
    'Loading...\nA: CCC assumes constant correlations, DCC allows time-varying correlations',
    'Loading...\nQ: What does AIC stand for?',
    'Loading...\nA: Akaike Information Criterion - model selection tool',
    'Loading...\nQ: What is a stationarity test?',
    'Loading...\nA: Checks if statistical properties remain constant over time',
    'Loading...\nQ: What does differencing do in ARIMA?',
    'Loading...\nA: Makes non-stationary data stationary by removing trends',
    'Loading...\nQ: Who developed the VAR model?',
    'Loading...\nA: Christopher Sims in 1980 (Nobel Prize 2011)',
    'Loading...\nQ: What is volatility clustering?',
    'Loading...\nA: High volatility periods followed by high volatility periods',
    'Loading...\nQ: What does persistence mean in GARCH?',
    'Loading...\nA: How long volatility shocks last (α + β)',
    'Loading...\nQ: What is conditional mean filtering?',
    'Loading...\nA: Removing predictable patterns from time series',
    'Loading...\nQ: What does RMSE measure?',
    'Loading...\nA: Root Mean Square Error - forecast accuracy metric',
    'Loading...\nQ: What is the purpose of standardized residuals?',
    'Loading...\nA: To check if model assumptions are satisfied',
    'Loading...\nQ: What does BIC stand for?',
    'Loading...\nA: Bayesian Information Criterion - penalizes model complexity',
    'Loading...\nQ: What is the omega parameter in GARCH?',
    'Loading...\nA: The baseline volatility floor (ω)',
    'Loading...\nQ: What does alpha measure in GARCH?',
    'Loading...\nA: Sensitivity to recent shocks (α)',
    'Loading...\nQ: What does beta measure in GARCH?',
    'Loading...\nA: Volatility memory factor (β)',
    'Loading...\nQ: What is a net spillover effect?',
    'Loading...\nA: Difference between spillovers transmitted and received',
    'Loading...\nQ: What is the half-life of volatility?',
    'Loading...\nA: Time for volatility shock to decay by 50%',
    'Loading...\nQ: What does skewness measure?',
    'Loading...\nA: Asymmetry in data distribution',
    'Loading...\nQ: What does kurtosis measure?',
    'Loading...\nA: Tail heaviness of data distribution',
    'Loading...\nQ: What is annualized volatility?',
    'Loading...\nA: Standard deviation scaled to yearly frequency'
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
            textElement.textContent = 'Loading...';
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
                textElement.textContent = 'Loading...';
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