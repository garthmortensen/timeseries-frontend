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
    'Loading...\nA: Forecast Error Variance Decomposition'
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