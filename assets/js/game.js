/**
 * TISA 3630 Flashcard Game with Tit-for-Tat Computer Opponent
 * 
 * Game mechanics:
 * - Player and computer answer multiple choice questions
 * - Computer uses tit-for-tat strategy: mirrors player's recent performance
 * - Difficulty slider controls computer's base accuracy
 * - Scoring system with streaks
 */

class FlashcardGame {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.playerScore = 0;
        this.computerScore = 0;
        this.playerStreak = 0;
        this.computerStreak = 0;
        this.playerHistory = []; // Track player's recent answers (correct/incorrect)
        this.computerHistory = [];
        this.round = 0;
        this.totalRounds = 10;
        this.isGameActive = false;
        this.currentQuestion = null;
        this.playerAnswer = null;
        this.computerAnswer = null;
        this.difficultyLevel = 70; // Base computer accuracy percentage
        
        // Game state
        this.gameState = 'waiting'; // 'waiting', 'playing', 'revealed', 'finished'
        
        this.initializeElements();
        this.bindEvents();
        this.loadQuestions();
    }
    
    initializeElements() {
        // Game controls
        this.difficultySlider = document.getElementById('difficulty-slider');
        this.difficultyValue = document.getElementById('difficulty-value');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.nextQuestionBtn = document.getElementById('next-question-btn');
        this.resetGameBtn = document.getElementById('reset-game-btn');
        
        // Score display
        this.playerScoreEl = document.getElementById('player-score');
        this.computerScoreEl = document.getElementById('computer-score');
        this.playerStreakEl = document.getElementById('player-streak');
        this.computerStreakEl = document.getElementById('computer-streak');
        
        // Game status
        this.gameMessage = document.getElementById('game-message');
        this.currentRoundEl = document.getElementById('current-round');
        this.totalRoundsEl = document.getElementById('total-rounds');
        
        // Flashcard elements
        this.flashcard = document.getElementById('flashcard');
        this.questionText = document.getElementById('question-text');
        this.answerText = document.getElementById('answer-text');
        this.explanationText = document.getElementById('explanation-text');
        this.answerButtons = document.querySelectorAll('.answer-btn');
        this.revealBtn = document.getElementById('reveal-answer-btn');
        this.flipCardBtn = document.getElementById('flip-card-btn');
        
        // Computer choice display
        this.computerChoice = document.getElementById('computer-choice');
        this.computerAnswerEl = document.getElementById('computer-answer');
        this.computerResultEl = document.getElementById('computer-result');
        
        // Results
        this.resultsContainer = document.getElementById('results-container');
        this.playerFinalAnswer = document.getElementById('player-final-answer');
        this.computerFinalAnswer = document.getElementById('computer-final-answer');
        this.playerResultIcon = document.getElementById('player-result-icon');
        this.computerResultIcon = document.getElementById('computer-result-icon');
        
        // Loading
        this.loadingOverlay = document.getElementById('loading-overlay');
    }
    
    bindEvents() {
        // Difficulty slider
        this.difficultySlider.addEventListener('input', (e) => {
            this.difficultyLevel = parseInt(e.target.value);
            this.difficultyValue.textContent = `${this.difficultyLevel}%`;
        });
        
        // Game control buttons
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
        
        // Answer buttons
        this.answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectAnswer(e.target.dataset.answer));
        });
        
        // Reveal and flip buttons
        this.revealBtn.addEventListener('click', () => this.revealAnswers());
        this.flipCardBtn.addEventListener('click', () => this.flipCard());
    }
    
    async loadQuestions() {
        try {
            this.showLoading(true);
            const response = await fetch('data/sample-questions.json');
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }
            const data = await response.json();
            this.questions = data.questions;
            this.totalRounds = Math.min(this.questions.length, this.totalRounds);
            this.totalRoundsEl.textContent = this.totalRounds;
            this.showLoading(false);
            console.log(`Loaded ${this.questions.length} questions`);
        } catch (error) {
            console.error('Error loading questions:', error);
            this.gameMessage.textContent = 'Error loading questions. Please check the console.';
            this.showLoading(false);
        }
    }
    
    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    startGame() {
        if (this.questions.length === 0) {
            this.gameMessage.textContent = 'No questions loaded. Please refresh and try again.';
            return;
        }
        
        this.isGameActive = true;
        this.gameState = 'playing';
        this.round = 1;
        this.currentQuestionIndex = 0;
        this.playerScore = 0;
        this.computerScore = 0;
        this.playerStreak = 0;
        this.computerStreak = 0;
        this.playerHistory = [];
        this.computerHistory = [];
        
        this.updateDisplay();
        this.loadCurrentQuestion();
        
        this.startGameBtn.disabled = true;
        this.gameMessage.textContent = 'Select your answer!';
    }
    
    loadCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endGame();
            return;
        }
        
        this.currentQuestion = this.questions[this.currentQuestionIndex];
        this.playerAnswer = null;
        this.computerAnswer = null;
        
        // Update question display
        this.questionText.textContent = this.currentQuestion.question;
        this.answerText.textContent = this.currentQuestion.options[this.currentQuestion.correct_answer];
        this.explanationText.textContent = this.currentQuestion.explanation;
        
        // Update answer buttons
        this.answerButtons.forEach(btn => {
            const optionKey = btn.dataset.answer;
            btn.textContent = `${optionKey}. ${this.currentQuestion.options[optionKey]}`;
            btn.disabled = false;
            btn.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // Reset card state
        this.flashcard.classList.remove('flipped');
        this.gameState = 'playing';
        this.revealBtn.disabled = true;
        this.flipCardBtn.disabled = true;
        this.nextQuestionBtn.disabled = true;
        
        // Hide computer choice and results
        this.computerChoice.style.display = 'none';
        this.resultsContainer.style.display = 'none';
        
        // Update round counter
        this.currentRoundEl.textContent = this.round;
        
        // Generate computer answer using tit-for-tat strategy
        this.generateComputerAnswer();
    }
    
    generateComputerAnswer() {
        // Base accuracy from difficulty slider
        let accuracy = this.difficultyLevel / 100;
        
        // Tit-for-tat adjustment: mirror player's recent performance
        if (this.playerHistory.length > 0) {
            const recentPlayerPerformance = this.playerHistory.slice(-3); // Look at last 3 answers
            const playerSuccessRate = recentPlayerPerformance.filter(correct => correct).length / recentPlayerPerformance.length;
            
            // Adjust computer accuracy based on player's recent success
            // If player is doing well, computer tries harder (increases accuracy)
            // If player is struggling, computer eases up (decreases accuracy)
            const adjustment = (playerSuccessRate - 0.5) * 0.3; // Max adjustment of ±15%
            accuracy = Math.max(0.1, Math.min(0.95, accuracy + adjustment));
        }
        
        // Generate computer's answer
        const options = ['A', 'B', 'C', 'D'];
        const correctAnswer = this.currentQuestion.correct_answer;
        
        if (Math.random() < accuracy) {
            // Computer gets it right
            this.computerAnswer = correctAnswer;
        } else {
            // Computer gets it wrong - pick a random incorrect answer
            const wrongOptions = options.filter(opt => opt !== correctAnswer);
            this.computerAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }
        
        console.log(`Computer accuracy: ${(accuracy * 100).toFixed(1)}%, chose: ${this.computerAnswer}, correct: ${correctAnswer}`);
    }
    
    selectAnswer(answer) {
        if (this.gameState !== 'playing' || this.playerAnswer !== null) return;
        
        this.playerAnswer = answer;
        
        // Update button states
        this.answerButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.answer === answer) {
                btn.classList.add('selected');
            }
        });
        
        this.revealBtn.disabled = false;
        this.gameMessage.textContent = 'Answer selected! Click "Reveal Answer" to see results.';
    }
    
    revealAnswers() {
        if (this.gameState !== 'playing' || this.playerAnswer === null) return;
        
        this.gameState = 'revealed';
        const correctAnswer = this.currentQuestion.correct_answer;
        
        // Check answers
        const playerCorrect = this.playerAnswer === correctAnswer;
        const computerCorrect = this.computerAnswer === correctAnswer;
        
        // Update history
        this.playerHistory.push(playerCorrect);
        this.computerHistory.push(computerCorrect);
        
        // Update scores and streaks
        if (playerCorrect) {
            this.playerScore += this.currentQuestion.points || 1;
            this.playerStreak++;
        } else {
            this.playerStreak = 0;
        }
        
        if (computerCorrect) {
            this.computerScore += this.currentQuestion.points || 1;
            this.computerStreak++;
        } else {
            this.computerStreak = 0;
        }
        
        // Update button appearance
        this.answerButtons.forEach(btn => {
            btn.disabled = true;
            const option = btn.dataset.answer;
            
            if (option === correctAnswer) {
                btn.classList.add('correct');
            } else if (option === this.playerAnswer && !playerCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // Show computer choice
        this.computerChoice.style.display = 'block';
        this.computerAnswerEl.textContent = this.computerAnswer;
        this.computerResultEl.textContent = computerCorrect ? '✓' : '✗';
        this.computerResultEl.className = computerCorrect ? 'result correct' : 'result incorrect';
        
        // Show results
        this.resultsContainer.style.display = 'block';
        this.playerFinalAnswer.textContent = this.playerAnswer;
        this.computerFinalAnswer.textContent = this.computerAnswer;
        this.playerResultIcon.textContent = playerCorrect ? '✓' : '✗';
        this.computerResultIcon.textContent = computerCorrect ? '✓' : '✗';
        this.playerResultIcon.className = playerCorrect ? 'correct' : 'incorrect';
        this.computerResultIcon.className = computerCorrect ? 'correct' : 'incorrect';
        
        // Update display
        this.updateDisplay();
        
        // Enable controls
        this.revealBtn.disabled = true;
        this.flipCardBtn.disabled = false;
        this.nextQuestionBtn.disabled = false;
        
        // Update message
        if (playerCorrect && computerCorrect) {
            this.gameMessage.textContent = 'Both got it right! 🤝';
        } else if (playerCorrect) {
            this.gameMessage.textContent = 'You got it right! 🎉';
        } else if (computerCorrect) {
            this.gameMessage.textContent = 'Computer got it right! 🤖';
        } else {
            this.gameMessage.textContent = 'Both got it wrong! 😅';
        }
        
        // Animate score changes
        this.animateScoreUpdate();
    }
    
    flipCard() {
        this.flashcard.classList.toggle('flipped');
    }
    
    nextQuestion() {
        if (this.gameState !== 'revealed') return;
        
        this.round++;
        this.currentQuestionIndex++;
        
        if (this.round > this.totalRounds) {
            this.endGame();
        } else {
            this.loadCurrentQuestion();
        }
    }
    
    endGame() {
        this.isGameActive = false;
        this.gameState = 'finished';
        
        // Determine winner
        let message;
        if (this.playerScore > this.computerScore) {
            message = `🎉 You won! Final Score: You ${this.playerScore} - Computer ${this.computerScore}`;
        } else if (this.computerScore > this.playerScore) {
            message = `🤖 Computer won! Final Score: You ${this.playerScore} - Computer ${this.computerScore}`;
        } else {
            message = `🤝 It's a tie! Final Score: ${this.playerScore} - ${this.computerScore}`;
        }
        
        this.gameMessage.textContent = message;
        this.startGameBtn.disabled = false;
        this.startGameBtn.textContent = 'Play Again';
        this.nextQuestionBtn.disabled = true;
        
        console.log('Game ended:', {
            playerScore: this.playerScore,
            computerScore: this.computerScore,
            playerHistory: this.playerHistory,
            computerHistory: this.computerHistory
        });
    }
    
    resetGame() {
        this.isGameActive = false;
        this.gameState = 'waiting';
        this.round = 0;
        this.currentQuestionIndex = 0;
        this.playerScore = 0;
        this.computerScore = 0;
        this.playerStreak = 0;
        this.computerStreak = 0;
        this.playerHistory = [];
        this.computerHistory = [];
        this.playerAnswer = null;
        this.computerAnswer = null;
        
        // Reset UI
        this.updateDisplay();
        this.startGameBtn.disabled = false;
        this.startGameBtn.textContent = 'Start Game';
        this.nextQuestionBtn.disabled = true;
        this.revealBtn.disabled = true;
        this.flipCardBtn.disabled = true;
        this.currentRoundEl.textContent = '0';
        this.gameMessage.textContent = 'Click "Start Game" to begin!';
        
        // Reset flashcard
        this.flashcard.classList.remove('flipped');
        this.questionText.textContent = 'Click "Start Game" to see your first question!';
        
        // Reset answer buttons
        this.answerButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // Hide elements
        this.computerChoice.style.display = 'none';
        this.resultsContainer.style.display = 'none';
    }
    
    updateDisplay() {
        this.playerScoreEl.textContent = this.playerScore;
        this.computerScoreEl.textContent = this.computerScore;
        this.playerStreakEl.textContent = this.playerStreak;
        this.computerStreakEl.textContent = this.computerStreak;
    }
    
    animateScoreUpdate() {
        // Simple animation using anime.js
        if (typeof anime !== 'undefined') {
            anime({
                targets: [this.playerScoreEl, this.computerScoreEl],
                scale: [1, 1.2, 1],
                duration: 500,
                easing: 'easeOutElastic(1, .8)'
            });
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new FlashcardGame();
});

// Export for testing if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashcardGame;
}