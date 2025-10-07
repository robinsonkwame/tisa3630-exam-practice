// TISA 3630 Sliding Card Game - Demo Version
// This is a basic demo to show the current UI state

// Game state
let gameState = {
    currentQuestionIndex: 0,
    questions: [],
    playerScore: 0,
    computerScore: 0,
    categoryStats: {},
    isGameActive: false
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Card Game Demo Loaded');
    
    // Initialize game
    initializeGame();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start heartbeat to keep server alive
    startHeartbeat();
    
    // Handle page unload (tab close/refresh)
    window.addEventListener('beforeunload', handlePageUnload);
});

async function initializeGame() {
    // Load questions from mock data
    try {
        const response = await fetch('./data/test_mock_exam.json');
        const data = await response.json();
        gameState.questions = data.questions;
        
        // Initialize category stats
        data.metadata.categories.forEach(category => {
            gameState.categoryStats[category] = { correct: 0, total: 0 };
        });
        
        console.log(`Loaded ${gameState.questions.length} questions`);
    } catch (error) {
        console.error('Failed to load questions:', error);
        // Fallback to demo data
        gameState.questions = getDemoQuestions();
    }
    
    // Show demo category bars
    createDemoCategoryBars();
    
    // Show first question
    showCurrentQuestion();
    
    // Update difficulty slider display
    updateDifficultyDisplay();
}

function initializeDemo() {
    // Legacy function - now calls initializeGame
    initializeGame();
}

function createDemoCategoryBars() {
    const statsContainer = document.getElementById('stats-container');
    
    // All 8 categories from the test data with color-coded performance (red to green)
    const categories = [
        { name: 'MIS', percentage: 75, correct: 3, total: 4 },
        { name: 'Computer\nHardware', percentage: 85, correct: 6, total: 7 },
        { name: 'Computing\nNetworks', percentage: 100, correct: 1, total: 1 },
        { name: 'Competitive\nAdvantage', percentage: 50, correct: 1, total: 2 },
        { name: 'Data\nAnalytics', percentage: 67, correct: 2, total: 3 },
        { name: 'Database', percentage: 100, correct: 1, total: 1 },
        { name: 'Computer\nSoftware', percentage: 0, correct: 0, total: 1 },
        { name: 'Business\nMgmt Systems', percentage: 60, correct: 3, total: 5 }
    ];
    
    categories.forEach(category => {
        const bar = document.createElement('div');
        bar.className = 'category-bar';
        bar.style.height = `${Math.max(category.percentage, 10)}%`; // Min height for visibility
        
        // Color based on performance (red to yellow to green)
        let color;
        if (category.percentage >= 80) color = '#4CAF50'; // Green
        else if (category.percentage >= 60) color = '#8BC34A'; // Light green
        else if (category.percentage >= 40) color = '#FFC107'; // Yellow
        else if (category.percentage >= 20) color = '#FF9800'; // Orange
        else color = '#F44336'; // Red
        
        bar.style.background = color;
        bar.innerHTML = `
            <div style="position: absolute; bottom: -35px; font-size: 9px; color: #2F4F4F; font-weight: 500; width: 100%; text-align: center; line-height: 1.1;">
                ${category.name}<br><span style="font-size: 8px; color: #A0A0A0;">${category.correct}/${category.total}</span>
            </div>
            ${category.percentage}%
        `;
        statsContainer.appendChild(bar);
    });
}

function showDemoQuestion() {
    const questionContent = document.getElementById('question-content');
    const categoryTag = document.getElementById('category-tag');
    const choicesGrid = document.getElementById('choices-grid');
    
    // Demo question
    questionContent.textContent = "What is Jira and Gantt Pro examples of?";
    categoryTag.textContent = "Business Management Systems";
    
    // Demo choices
    const choices = [
        "project management software",
        "project visualization resources", 
        "tools that are used within project management software",
        "customer relationship management software"
    ];
    
    choicesGrid.innerHTML = '';
    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice;
        button.addEventListener('click', () => selectChoice(index, button));
        choicesGrid.appendChild(button);
    });
    
    // Add some demo cards to the left side
    addDemoCardsToLeft();
    
    // Add some demo cards to right side to show wiggle effects
    addDemoCardsToRight();
}

function addDemoCardsToLeft() {
    const leftCards = document.getElementById('left-cards');
    
    // Add stacked cards with carousel perspective effects
    const cardTitles = [
        'Hardware Q2', 'Networks Q3', 'Database Q4', 'Software Q5', 'Analytics Q6'
    ];
    
    for (let i = 0; i < 5; i++) {
        const card = document.createElement('div');
        card.className = 'small-card';
        
        // Create tighter stacking for narrow panels
        const offsetZ = i * -5;
        const offsetY = i * 8;
        const offsetX = i * 1;
        const rotation = i * -0.8;
        const scale = 1 - (i * 0.03);
        const opacity = 1 - (i * 0.08);
        
        card.style.transform = `
            translateX(${offsetX}px) 
            translateY(${offsetY}px) 
            translateZ(${offsetZ}px) 
            rotateY(${rotation}deg) 
            scale(${scale})
        `;
        card.style.zIndex = 10 - i;
        card.style.opacity = opacity;
        card.textContent = cardTitles[i];
        
        // Add subtle text shadow for depth
        card.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
        
        leftCards.appendChild(card);
    }
}

function addDemoCardsToRight() {
    const rightCards = document.getElementById('right-cards');
    
    // Add some demo answered cards with different states
    const answeredCards = [
        { title: 'MIS Q1', correct: true },
        { title: 'Hardware Q1', correct: false },
        { title: 'Networks Q1', correct: true }
    ];
    
    answeredCards.forEach((cardData, i) => {
        const card = document.createElement('div');
        card.className = `small-card ${cardData.correct ? 'correct' : 'wrong'}`;
        
        // Stack with tighter offset for narrow panel
        const offsetY = i * 10;
        const offsetX = i * -1;
        const rotation = cardData.correct ? 1.5 : -1.5;
        
        card.style.transform = `
            translateX(${offsetX}px) 
            translateY(${offsetY}px) 
            rotateZ(${rotation}deg)
        `;
        card.style.zIndex = 10 - i;
        card.textContent = cardData.title;
        
        // Add periodic wiggle animation
        if (cardData.correct) {
            card.classList.add('card-wiggle-happy');
            // Re-trigger animation periodically
            setInterval(() => {
                card.classList.remove('card-wiggle-happy');
                setTimeout(() => card.classList.add('card-wiggle-happy'), 50);
            }, 3000);
        } else {
            card.classList.add('card-wiggle-sad');
            setInterval(() => {
                card.classList.remove('card-wiggle-sad');
                setTimeout(() => card.classList.add('card-wiggle-sad'), 50);
            }, 4000);
        }
        
        rightCards.appendChild(card);
    });
}

function selectChoice(index, button) {
    // Clear previous selections
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong');
    });
    
    // Mark selected choice
    button.classList.add('selected');
    
    const currentQuestion = getCurrentQuestionData();
    const isCorrect = (index === currentQuestion.correct_answer);
    
    // Show feedback with animation
    setTimeout(() => {
        showFeedback(isCorrect);
        // Trigger card sliding animation
        animateCardAfterAnswer(isCorrect);
    }, 500);
}

function animateCardAfterAnswer(isCorrect) {
    // Create a temporary card element that represents the current question
    const tempCard = createTempQuestionCard();
    
    // Add it to the game area temporarily
    const centerArea = document.querySelector('.center-area');
    centerArea.appendChild(tempCard);
    
    // Slide it to the right with animation
    setTimeout(() => {
        slideCardRight(tempCard, isCorrect);
    }, 1000); // Give time for feedback to show
}

function createTempQuestionCard() {
    const tempCard = document.createElement('div');
    tempCard.className = 'small-card temp-question-card';
    tempCard.textContent = 'Current Question';
    
    // Position it over the main question card initially
    tempCard.style.position = 'absolute';
    tempCard.style.top = '50%';
    tempCard.style.left = '50%';
    tempCard.style.transform = 'translate(-50%, -50%)';
    tempCard.style.zIndex = '1000';
    
    return tempCard;
}

function showFeedback(isCorrect) {
    const feedbackSection = document.getElementById('feedback-section');
    const correctAnswerText = document.getElementById('correct-answer-text');
    const explanationText = document.getElementById('explanation-text');
    const computerChoice = document.getElementById('computer-choice');
    
    // Get current question data
    const currentQuestion = getCurrentQuestionData();
    
    // Show correct answer
    document.querySelectorAll('.choice-btn').forEach((btn, index) => {
        if (index === currentQuestion.correct_answer) {
            btn.classList.add('correct');
        } else if (btn.classList.contains('selected') && !isCorrect) {
            btn.classList.add('wrong');
        }
    });
    
    correctAnswerText.textContent = currentQuestion.choices[currentQuestion.correct_answer];
    explanationText.textContent = currentQuestion.explanation;
    
    // AI Competitor makes choice based on difficulty
    const computerResult = getAIChoice(currentQuestion);
    const choices = document.querySelectorAll('.choice-btn');
    computerChoice.textContent = choices[computerResult.choiceIndex].textContent;
    
    // Show feedback section
    feedbackSection.style.display = 'block';
    
    // Update scores
    updateScores(isCorrect, computerResult.isCorrect, currentQuestion.category);
}

function updateScores(playerCorrect, computerCorrect, category) {
    // Update game state
    if (playerCorrect) gameState.playerScore++;
    if (computerCorrect) gameState.computerScore++;
    
    // Update category stats
    if (category && gameState.categoryStats[category]) {
        gameState.categoryStats[category].total++;
        if (playerCorrect) {
            gameState.categoryStats[category].correct++;
        }
    }
    
    // Update UI displays
    const playerPercentage = document.getElementById('player-percentage');
    const computerPercentage = document.getElementById('computer-percentage');
    
    const totalQuestions = gameState.currentQuestionIndex + 1;
    const playerPercent = Math.round((gameState.playerScore / totalQuestions) * 100);
    const computerPercent = Math.round((gameState.computerScore / totalQuestions) * 100);
    
    playerPercentage.textContent = playerPercent + '%';
    computerPercentage.textContent = computerPercent + '%';
    
    // Update category bars
    updateCategoryBars();
}

// AI Competitor System
function getAIChoice(question) {
    const difficulty = parseInt(document.getElementById('difficulty-slider').value);
    const accuracy = difficulty / 100; // Convert to 0-1 range
    
    // AI decides whether to get it right based on difficulty setting
    const willGetCorrect = Math.random() < accuracy;
    
    let choiceIndex;
    if (willGetCorrect) {
        // Choose the correct answer
        choiceIndex = question.correct_answer;
    } else {
        // Choose a random wrong answer
        const wrongChoices = [];
        for (let i = 0; i < question.choices.length; i++) {
            if (i !== question.correct_answer) {
                wrongChoices.push(i);
            }
        }
        choiceIndex = wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
    }
    
    return {
        choiceIndex: choiceIndex,
        isCorrect: willGetCorrect
    };
}

// Get current question data
function getCurrentQuestionData() {
    if (gameState.questions && gameState.questions.length > 0) {
        return gameState.questions[gameState.currentQuestionIndex] || gameState.questions[0];
    }
    
    // Fallback demo question
    return {
        question: "What is Jira and Gantt Pro examples of?",
        choices: [
            "project management software",
            "project visualization resources", 
            "tools that are used within project management software",
            "customer relationship management software"
        ],
        correct_answer: 0,
        explanation: "Jira and Gantt Pro are two examples of project management software.",
        category: "Business Management Systems"
    };
}

// Show current question
function showCurrentQuestion() {
    const currentQuestion = getCurrentQuestionData();
    
    const questionContent = document.getElementById('question-content');
    const categoryTag = document.getElementById('category-tag');
    const choicesGrid = document.getElementById('choices-grid');
    
    questionContent.textContent = currentQuestion.question;
    categoryTag.textContent = currentQuestion.category;
    
    // Update choices
    choicesGrid.innerHTML = '';
    currentQuestion.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice;
        button.addEventListener('click', () => selectChoice(index, button));
        choicesGrid.appendChild(button);
    });
}

function setupEventListeners() {
    // Difficulty slider
    const difficultySlider = document.getElementById('difficulty-slider');
    difficultySlider.addEventListener('input', updateDifficultyDisplay);
    
    // Confirm difficulty button
    const confirmDifficultyBtn = document.getElementById('confirm-difficulty-btn');
    if (confirmDifficultyBtn) {
        confirmDifficultyBtn.addEventListener('click', () => {
            confirmDifficultyAndStart();
        });
    }
    
    // Start button (hidden initially)
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        startGame();
    });
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        resetGame();
    });
    
    // Demo animation button
    const demoAnimationBtn = document.getElementById('demo-animation-btn');
    if (demoAnimationBtn) {
        demoAnimationBtn.addEventListener('click', () => {
            demoCardAnimations();
        });
    }
    
    // Quit button
    const quitBtn = document.getElementById('quit-btn');
    quitBtn.addEventListener('click', async () => {
        const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        try {
            // Call server quit endpoint
            const response = await fetch('/quit');
            const data = await response.json();
            
            if (isDevelopment && data.status === 'Server shutting down...') {
                // Development: Server is actually shutting down
                alert('✅ Development server is shutting down!\n\nYou can now run "npm start" again to get updates.');
                setTimeout(() => window.close(), 1000);
            } else {
                // Production: Just a static site
                alert('🌐 This is running on Netlify!\n\nNo server to quit - this is a static site.');
            }
            
        } catch (error) {
            if (isDevelopment) {
                console.log('Dev server already shut down or unreachable');
                alert('Development server appears to be shut down already.\nClosing browser tab...');
                window.close();
            } else {
                alert('Network error - please refresh the page.');
            }
        }
    });
    
    // Next button
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToNextQuestion();
        });
    }
}

function updateDifficultyDisplay() {
    const slider = document.getElementById('difficulty-slider');
    const display = document.getElementById('difficulty-value');
    display.textContent = slider.value + '%';
}

// Animation system using Anime.js
function slideCardRight(element, isCorrect = true) {
    console.log('Sliding card right with anime.js');
    
    // Create the sliding animation
    const animation = anime({
        targets: element,
        translateX: [0, 800], // Slide to the right
        translateY: [0, Math.random() * 50 - 25], // Slight random vertical movement
        rotateZ: [0, Math.random() * 15 - 7.5], // Slight random rotation
        scale: [1, 0.8], // Shrink as it moves
        opacity: [1, 0.9],
        duration: 800,
        easing: 'easeInOutCubic',
        complete: function() {
            // After sliding, move to right stack and show in new position
            moveCardToRightStack(element, isCorrect);
        }
    });
    
    return animation;
}

function moveCardToRightStack(element, isCorrect) {
    const rightCards = document.getElementById('right-cards');
    const existingCards = rightCards.querySelectorAll('.small-card');
    
    // Reset the card styles
    element.style.transform = '';
    element.style.opacity = '1';
    
    // Apply correct/wrong styling
    element.classList.remove('selected');
    element.classList.add(isCorrect ? 'correct' : 'wrong');
    
    // Position in right stack with offset
    const offsetY = existingCards.length * 12;
    const offsetX = existingCards.length * -2;
    const rotation = isCorrect ? 2 : -2;
    
    element.style.transform = `
        translateX(${offsetX}px) 
        translateY(${offsetY}px) 
        rotateZ(${rotation}deg)
    `;
    element.style.zIndex = 10 - existingCards.length;
    
    // Add to right stack
    rightCards.appendChild(element);
    
    // Add wiggle animation
    setTimeout(() => {
        wiggleCard(element, isCorrect ? 'happy' : 'sad');
    }, 200);
}

function wiggleCard(element, type) {
    console.log(`Wiggling card: ${type}`);
    
    const wiggleClass = type === 'happy' ? 'card-wiggle-happy' : 'card-wiggle-sad';
    
    // Remove any existing wiggle classes
    element.classList.remove('card-wiggle-happy', 'card-wiggle-sad');
    
    // Add the wiggle animation
    element.classList.add(wiggleClass);
    
    // Remove the class after animation completes
    setTimeout(() => {
        element.classList.remove(wiggleClass);
    }, 1000);
}

// Function to slide next card from left stack to center
function slideNextCardFromLeft() {
    const leftCards = document.getElementById('left-cards');
    const topCard = leftCards.querySelector('.small-card:first-child');
    
    if (!topCard) {
        console.log('No more cards in left stack');
        return null;
    }
    
    // Get the center area position
    const centerArea = document.querySelector('.center-area');
    const centerRect = centerArea.getBoundingClientRect();
    const topCardRect = topCard.getBoundingClientRect();
    
    // Calculate movement needed
    const deltaX = centerRect.left - topCardRect.left + 200; // Approximate center
    const deltaY = centerRect.top - topCardRect.top + 100;
    
    // Animate the card to center
    anime({
        targets: topCard,
        translateX: [0, deltaX],
        translateY: [0, deltaY],
        scale: [0.8, 1.2], // Grow as it moves to center
        rotateZ: [topCard.style.transform.includes('rotate') ? parseFloat(topCard.style.transform.match(/rotateZ\(([^)]+)\)/)?.[1] || 0) : 0, 0],
        opacity: [0.8, 1],
        duration: 600,
        easing: 'easeOutBack',
        complete: function() {
            // Transform into center question card
            transformToQuestionCard(topCard);
        }
    });
    
    return topCard;
}

// Transform a small card into the main question card display
function transformToQuestionCard(cardElement) {
    // This would update the main question display
    // For now, just remove the card from left stack
    cardElement.remove();
    
    // Update the remaining cards in left stack
    updateLeftStackPositions();
}

// Update positions of remaining cards in left stack
function updateLeftStackPositions() {
    const leftCards = document.getElementById('left-cards');
    const cards = leftCards.querySelectorAll('.small-card');
    
    cards.forEach((card, index) => {
        anime({
            targets: card,
            translateX: index * 1,
            translateY: index * 8,
            rotateY: index * -0.8,
            scale: 1 - (index * 0.03),
            opacity: 1 - (index * 0.08),
            duration: 400,
            easing: 'easeOutQuad',
            delay: index * 50
        });
    });
}

// Load next question with smooth animations
function loadNextQuestion() {
    console.log('Loading next question with animations');
    
    // Hide feedback section
    const feedbackSection = document.getElementById('feedback-section');
    if (feedbackSection) {
        anime({
            targets: feedbackSection,
            opacity: [1, 0],
            translateY: [0, 20],
            duration: 300,
            easing: 'easeInQuad',
            complete: function() {
                feedbackSection.style.display = 'none';
            }
        });
    }
    
    // Animate the next card from left to center (demo)
    setTimeout(() => {
        // For demo: just slide the next card and update question
        slideNextCardFromLeft();
        
        // Update the question display
        setTimeout(() => {
            updateQuestionDisplay();
        }, 600);
    }, 400);
}

// Update the main question display (demo)
function updateQuestionDisplay() {
    const questionContent = document.getElementById('question-content');
    const categoryTag = document.getElementById('category-tag');
    const choicesGrid = document.getElementById('choices-grid');
    
    // Demo questions array
    const demoQuestions = [
        {
            question: "What is the primary purpose of data visualization?",
            category: "Data Analytics",
            choices: [
                "To make data easier to understand and interpret",
                "To store large amounts of data", 
                "To encrypt sensitive information",
                "To backup data automatically"
            ],
            correct: 0
        },
        {
            question: "Which database command is used to retrieve data?",
            category: "Database",
            choices: [
                "INSERT",
                "SELECT",
                "UPDATE",
                "DELETE"
            ],
            correct: 1
        }
    ];
    
    // Pick a random demo question
    const randomQuestion = demoQuestions[Math.floor(Math.random() * demoQuestions.length)];
    
    // Animate question change
    anime({
        targets: [questionContent, categoryTag, choicesGrid],
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        easing: 'easeOutQuad',
        delay: anime.stagger(100)
    });
    
    // Update content
    questionContent.textContent = randomQuestion.question;
    categoryTag.textContent = randomQuestion.category;
    
    // Update choices
    choicesGrid.innerHTML = '';
    randomQuestion.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice;
        button.addEventListener('click', () => selectChoice(index, button));
        choicesGrid.appendChild(button);
    });
    
    // Reset feedback section for next use
    setTimeout(() => {
        const feedbackSection = document.getElementById('feedback-section');
        if (feedbackSection) {
            feedbackSection.style.opacity = '1';
            feedbackSection.style.transform = 'translateY(0)';
        }
    }, 100);
}

// Demo function to showcase card animations
function demoCardAnimations() {
    console.log('Starting animation demo');
    
    // Demo 1: Slide a card from left to right
    const leftCards = document.getElementById('left-cards');
    const firstCard = leftCards.querySelector('.small-card');
    
    if (firstCard) {
        // Clone the card for demo
        const demoCard = firstCard.cloneNode(true);
        demoCard.textContent = 'Demo Card';
        demoCard.style.border = '3px solid #FF6B6B';
        
        // Add to center temporarily
        const centerArea = document.querySelector('.center-area');
        centerArea.appendChild(demoCard);
        
        // Position it at the center
        demoCard.style.position = 'absolute';
        demoCard.style.top = '50%';
        demoCard.style.left = '50%';
        demoCard.style.transform = 'translate(-50%, -50%)';
        demoCard.style.zIndex = '1000';
        
        // Animate sliding to right
        setTimeout(() => {
            slideCardRight(demoCard, Math.random() > 0.5);
        }, 500);
    }
    
    // Demo 2: Wiggle existing cards
    setTimeout(() => {
        const rightCards = document.getElementById('right-cards');
        const rightCardList = rightCards.querySelectorAll('.small-card');
        
        rightCardList.forEach((card, index) => {
            setTimeout(() => {
                wiggleCard(card, Math.random() > 0.5 ? 'happy' : 'sad');
            }, index * 200);
        });
    }, 2000);
    
    // Demo 3: Update left stack positions
    setTimeout(() => {
        updateLeftStackPositions();
    }, 3500);
}

// Go to next question (real game logic)
function goToNextQuestion() {
    if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
        gameState.currentQuestionIndex++;
        loadNextQuestion();
    } else {
        // Game over
        showGameOver();
    }
}

// Update category performance bars with real data
function updateCategoryBars() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;
    
    // Clear existing bars
    statsContainer.innerHTML = '';
    
    // Create bars for each category with real stats
    Object.entries(gameState.categoryStats).forEach(([category, stats]) => {
        const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        
        const bar = document.createElement('div');
        bar.className = 'category-bar';
        bar.style.height = `${Math.max(percentage, 10)}%`; // Min height for visibility
        
        // Color based on performance (red to yellow to green)
        let color;
        if (percentage >= 80) color = '#4CAF50'; // Green
        else if (percentage >= 60) color = '#8BC34A'; // Light green
        else if (percentage >= 40) color = '#FFC107'; // Yellow
        else if (percentage >= 20) color = '#FF9800'; // Orange
        else color = '#F44336'; // Red
        
        bar.style.background = color;
        bar.innerHTML = `
            <div style="position: absolute; bottom: -35px; font-size: 9px; color: #2F4F4F; font-weight: 500; width: 100%; text-align: center; line-height: 1.1;">
                ${category.replace(' ', '\n')}<br><span style="font-size: 8px; color: #A0A0A0;">${stats.correct}/${stats.total}</span>
            </div>
            ${percentage}%
        `;
        statsContainer.appendChild(bar);
    });
}

// Show game over screen
function showGameOver() {
    const finalPlayerPercent = Math.round((gameState.playerScore / gameState.questions.length) * 100);
    const finalComputerPercent = Math.round((gameState.computerScore / gameState.questions.length) * 100);
    
    const winner = finalPlayerPercent > finalComputerPercent ? 'You' : 
                   finalPlayerPercent < finalComputerPercent ? 'Computer' : 'Tie';
    
    alert(`Game Over!\n\nFinal Scores:\nYou: ${gameState.playerScore}/${gameState.questions.length} (${finalPlayerPercent}%)\nComputer: ${gameState.computerScore}/${gameState.questions.length} (${finalComputerPercent}%)\n\nWinner: ${winner}!`);
}

// Fallback demo questions if JSON fails to load
function getDemoQuestions() {
    return [
        {
            id: 1,
            question: "What is Jira and Gantt Pro examples of?",
            choices: ["project management software", "project visualization resources", "tools within project management", "CRM software"],
            correct_answer: 0,
            explanation: "Jira and Gantt Pro are project management software tools.",
            category: "Business Management Systems"
        },
        {
            id: 2,
            question: "What is the most powerful computer type?",
            choices: ["mainframe", "server", "supercomputer", "workstation"],
            correct_answer: 2,
            explanation: "Supercomputers are the most powerful computers for complex calculations.",
            category: "Computer Hardware"
        }
    ];
}

// Confirm difficulty setting and start game
function confirmDifficultyAndStart() {
    const difficulty = document.getElementById('difficulty-slider').value;
    
    // Simple confirmation
    alert(`Computer difficulty set to ${difficulty}%. Let's play!`);
    
    // Hide difficulty control with animation
    const difficultyControl = document.getElementById('difficulty-control');
    anime({
        targets: difficultyControl,
        opacity: [1, 0],
        translateY: [0, -20],
        duration: 500,
        easing: 'easeInQuad',
        complete: function() {
            difficultyControl.style.display = 'none';
            showGameInterface();
        }
    });
}

// Show the full game interface
function showGameInterface() {
    // Show all game elements
    const elementsToShow = [
        'category-stats',
        'scores', 
        'game-area',
        'game-controls'
    ];
    
    elementsToShow.forEach(id => {
        const element = document.getElementById(id);
        element.style.display = 'block';
        element.style.opacity = '0';
    });
    
    // Animate them in with staggered timing
    anime({
        targets: elementsToShow.map(id => document.getElementById(id)),
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        easing: 'easeOutQuad',
        delay: anime.stagger(100),
        complete: function() {
            // Start the game
            startGame();
        }
    });
}

// Start the game
function startGame() {
    gameState.isGameActive = true;
    gameState.currentQuestionIndex = 0;
    gameState.playerScore = 0;
    gameState.computerScore = 0;
    
    // Reset category stats
    Object.keys(gameState.categoryStats).forEach(category => {
        gameState.categoryStats[category] = { correct: 0, total: 0 };
    });
    
    // Show first question
    showCurrentQuestion();
    
    // Update UI
    updateScoreDisplays();
    updateCategoryBars();
    
    console.log(`Game started with difficulty: ${document.getElementById('difficulty-slider').value}%`);
}

// Update score displays
function updateScoreDisplays() {
    const playerPercentage = document.getElementById('player-percentage');
    const computerPercentage = document.getElementById('computer-percentage');
    
    const totalQuestions = Math.max(gameState.currentQuestionIndex, 1);
    const playerPercent = Math.round((gameState.playerScore / totalQuestions) * 100);
    const computerPercent = Math.round((gameState.computerScore / totalQuestions) * 100);
    
    playerPercentage.textContent = playerPercent + '%';
    computerPercentage.textContent = computerPercent + '%';
}

// Reset game to initial state
function resetGame() {
    // Reset game state
    gameState.isGameActive = false;
    gameState.currentQuestionIndex = 0;
    gameState.playerScore = 0;
    gameState.computerScore = 0;
    
    // Reset category stats
    Object.keys(gameState.categoryStats).forEach(category => {
        gameState.categoryStats[category] = { correct: 0, total: 0 };
    });
    
    // Show difficulty control again
    const difficultyControl = document.getElementById('difficulty-control');
    difficultyControl.style.display = 'block';
    difficultyControl.style.opacity = '1';
    difficultyControl.style.transform = 'translateY(0)';
    
    // Reset UI displays
    document.getElementById('player-percentage').textContent = '0%';
    document.getElementById('computer-percentage').textContent = '0%';
    document.getElementById('question-content').textContent = 'Set your difficulty and click "Confirm Difficulty & Start"!';
    document.getElementById('category-tag').textContent = '';
    document.getElementById('choices-grid').innerHTML = '';
    
    // Hide feedback section
    const feedbackSection = document.getElementById('feedback-section');
    feedbackSection.style.display = 'none';
    
    // Reset category bars
    createDemoCategoryBars();
    
    console.log('Game reset to initial state');
}

// Heartbeat system to detect browser activity
function startHeartbeat() {
    // Send ping every 10 seconds to keep server alive
    setInterval(async () => {
        try {
            await fetch('/ping');
        } catch (error) {
            console.log('Server unreachable - may have shut down');
        }
    }, 10000);
}

// Handle page unload (tab close, refresh, navigation)
function handlePageUnload(event) {
    // Browser is closing/navigating away
    // Note: Server will auto-shutdown after 30s of no activity
    console.log('Browser tab closing - server will auto-shutdown in 30s');
}
