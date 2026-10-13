// TISA 3630 Exam Practice - card-style quiz with per-category accuracy

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DECK_VISIBLE = 4;
const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);

const state = {
    questions: [],
    categories: [],
    index: 0,
    answered: 0,
    score: 0,
    categoryStats: {},
    selected: new Set(),
    awaitingNext: false
};

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadQuestions();
    if (isLocalhost) {
        $('quit-btn').hidden = false;
        startHeartbeat();
    }
    startGame({ focus: false });
});

async function loadQuestions() {
    try {
        const response = await fetch('./data/questions.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        state.questions = data.questions.map(normalizeQuestion);
        state.categories = data.metadata?.categories
            || [...new Set(state.questions.map(q => q.category))];
    } catch (error) {
        console.error('Failed to load questions, using demo set:', error);
        state.questions = getDemoQuestions().map(normalizeQuestion);
        state.categories = [...new Set(state.questions.map(q => q.category))];
    }
}

// Accept both the site format (correct_answers: [..]) and the older one (correct_answer: n)
function normalizeQuestion(q) {
    const correct = Array.isArray(q.correct_answers) ? q.correct_answers : [q.correct_answer];
    return {
        ...q,
        category: (q.category || 'General').replace(/_/g, ' '),
        correct,
        multiple: q.answer_type === 'multiple' || correct.length > 1
    };
}

function setupEventListeners() {
    $('check-btn').addEventListener('click', submitAnswer);
    $('next-btn').addEventListener('click', goToNextQuestion);
    $('reset-btn').addEventListener('click', () => startGame());
    $('play-again-btn').addEventListener('click', () => startGame());
    $('quit-btn').addEventListener('click', quitServer);
    document.addEventListener('keydown', handleShortcut);
}

// ---------- Game flow ----------

function startGame({ focus = true } = {}) {
    shuffle(state.questions);
    state.index = 0;
    state.answered = 0;
    state.score = 0;
    state.awaitingNext = false;
    state.categoryStats = {};
    state.categories.forEach(c => { state.categoryStats[c] = { correct: 0, total: 0 }; });

    $('answered-list').innerHTML = '';
    $('answered-empty').hidden = false;
    $('results').hidden = true;
    document.querySelector('.game-area').hidden = false;

    // On phones keep category accuracy collapsed so the question stays near the top
    $('category-details').open = !window.matchMedia('(max-width: 560px)').matches;

    updateScoreboard();
    showCurrentQuestion();
    if (focus) $('question-card').focus();
}

function showCurrentQuestion() {
    const q = state.questions[state.index];
    state.selected = new Set();

    $('question-number').textContent = `Question ${state.index + 1} of ${state.questions.length}`;
    $('category-tag').textContent = q.category;
    $('question-text').textContent = q.question;
    $('multi-hint').hidden = !q.multiple;
    $('check-btn').hidden = !q.multiple;
    $('check-btn').disabled = true;
    $('kbd-hint').textContent = q.multiple
        ? 'Tip: press 1–4 or A–D to toggle a choice, then Check answer.'
        : 'Tip: press 1–4 or A–D to answer.';
    $('feedback').hidden = true;

    const choices = $('choices');
    choices.innerHTML = '';
    q.choices.forEach((text, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice-btn' + (q.multiple ? ' multi' : '');
        button.innerHTML = `<span class="choice-letter" aria-hidden="true"></span><span class="choice-text"></span><span class="choice-status"></span>`;
        button.querySelector('.choice-letter').textContent = LETTERS[i];
        button.querySelector('.choice-text').textContent = text;
        button.setAttribute('aria-label', `${LETTERS[i]}: ${text}`);
        if (q.multiple) button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => chooseOption(i));
        choices.appendChild(button);
    });

    renderDeck();
    restartAnimation($('question-card'), 'entering');
}

function chooseOption(i) {
    if (state.awaitingNext) return;
    const q = state.questions[state.index];
    if (!q.multiple) {
        state.selected = new Set([i]);
        submitAnswer();
        return;
    }
    if (state.selected.has(i)) state.selected.delete(i);
    else state.selected.add(i);
    const button = $('choices').children[i];
    button.setAttribute('aria-pressed', String(state.selected.has(i)));
    button.classList.toggle('picked', state.selected.has(i));
    $('check-btn').disabled = state.selected.size === 0;
}

function submitAnswer() {
    if (state.awaitingNext || state.selected.size === 0) return;
    state.awaitingNext = true;

    const q = state.questions[state.index];
    const isCorrect = q.correct.length === state.selected.size
        && q.correct.every(i => state.selected.has(i));

    state.answered++;
    if (isCorrect) state.score++;
    state.categoryStats[q.category] ??= { correct: 0, total: 0 };
    state.categoryStats[q.category].total++;
    if (isCorrect) state.categoryStats[q.category].correct++;

    markChoices(q);
    showFeedback(isCorrect, q);
    addAnsweredCard(q, isCorrect);
    updateScoreboard();
}

function markChoices(q) {
    $('check-btn').hidden = true;
    document.querySelectorAll('.choice-btn').forEach((btn, i) => {
        btn.disabled = true;
        btn.removeAttribute('aria-pressed');
        btn.classList.remove('picked');
        const status = btn.querySelector('.choice-status');
        const label = btn.getAttribute('aria-label');
        const picked = state.selected.has(i);
        if (q.correct.includes(i)) {
            btn.classList.add('correct');
            status.textContent = picked ? '✓ Your answer' : (q.multiple ? '✓ Missed' : '✓ Correct');
            btn.setAttribute('aria-label', `${label} (correct answer, ${picked ? 'you chose it' : 'you did not choose it'})`);
        } else if (picked) {
            btn.classList.add('wrong');
            status.textContent = '✗ Your answer';
            btn.setAttribute('aria-label', `${label} (you chose it, incorrect)`);
        } else {
            btn.classList.add('dimmed');
        }
    });
}

function showFeedback(isCorrect, q) {
    const result = $('feedback-result');
    result.textContent = isCorrect ? '✓ Correct!' : '✗ Not quite.';
    result.className = 'feedback-result ' + (isCorrect ? 'is-correct' : 'is-wrong');

    $('correct-answer-label').textContent = q.correct.length > 1 ? 'Correct answers:' : 'Correct answer:';
    const list = $('correct-answer-list');
    list.innerHTML = '';
    q.correct.forEach(i => {
        const li = document.createElement('li');
        li.textContent = `${LETTERS[i]}. ${q.choices[i]}`;
        list.appendChild(li);
    });
    $('explanation-text').textContent = q.explanation || '';
    $('explanation-text').hidden = !q.explanation;

    const isLast = state.index >= state.questions.length - 1;
    $('next-btn').textContent = isLast ? 'See results' : 'Next question';
    $('feedback').hidden = false;

    announce(`${isCorrect ? 'Correct.' : 'Incorrect.'} ` +
        `The answer${q.correct.length > 1 ? 's are' : ' is'} ${q.correct.map(i => q.choices[i]).join('; ')}.`);
    $('next-btn').focus({ preventScroll: true });
    $('feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function goToNextQuestion() {
    if (!state.awaitingNext) return;
    state.awaitingNext = false;

    if (state.index < state.questions.length - 1) {
        state.index++;
        showCurrentQuestion();
        $('question-card').focus({ preventScroll: true });
        $('question-card').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
        showResults();
    }
}

function showResults() {
    const total = state.questions.length;
    $('results-summary').textContent =
        `You got ${state.score} of ${total} correct (${percent(state.score, total)}%).`;

    const asked = Object.entries(state.categoryStats).filter(([, s]) => s.total > 0);
    const lowest = Math.min(...asked.map(([, s]) => s.correct / s.total));
    const weakest = asked.filter(([, s]) => s.correct / s.total === lowest).map(([name]) => name);
    $('results-weakest').textContent = lowest === 1
        ? 'Perfect in every category. Nice work!'
        : `Focus your review on: ${weakest.join(', ')}.`;

    document.querySelector('.game-area').hidden = true;
    $('category-details').open = true;
    $('results').hidden = false;
    $('results').focus();
}

// ---------- Rendering ----------

function updateScoreboard() {
    $('player-percentage').textContent = percent(state.score, state.answered) + '%';
    $('player-detail').textContent = `${state.score} of ${state.answered} correct`;
    $('progress-value').textContent = `${state.answered} / ${state.questions.length}`;
    renderCategories();
}

function renderCategories() {
    const list = $('category-list');
    list.innerHTML = '';
    Object.entries(state.categoryStats).forEach(([name, { correct, total }]) => {
        const pct = percent(correct, total);
        const level = total === 0 ? '' : pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
        const scoreText = total === 0 ? 'Not yet asked' : `${correct}/${total} · ${pct}%`;

        const li = document.createElement('li');
        li.className = 'category-row';
        li.innerHTML = `
            <div class="category-row-label">
                <span class="category-name"></span>
                <span class="category-score"></span>
            </div>
            <div class="category-bar" aria-hidden="true"><div class="category-bar-fill ${level}"></div></div>`;
        li.querySelector('.category-name').textContent = name;
        li.querySelector('.category-score').textContent = scoreText;
        li.querySelector('.category-bar-fill').style.width = `${total === 0 ? 0 : Math.max(pct, 3)}%`;
        list.appendChild(li);
    });
}

function renderDeck() {
    const remaining = Math.max(state.questions.length - state.index - 1, 0);
    const deck = $('deck-visual');
    deck.innerHTML = '';
    const shown = Math.min(remaining, DECK_VISIBLE);
    // Draw back cards first so the top card ends up on top of the pile
    for (let i = shown - 1; i >= 0; i--) {
        const card = document.createElement('div');
        card.className = 'deck-card' + (i === 0 ? ' top' : '');
        card.style.setProperty('--i', i);
        card.style.opacity = 1 - i * 0.15;
        if (i === 0) card.textContent = state.index + 2;
        deck.appendChild(card);
    }
    $('deck-count').textContent = remaining === 1 ? '1 card left' : `${remaining} cards left`;
}

function addAnsweredCard(q, isCorrect) {
    $('answered-empty').hidden = true;
    const li = document.createElement('li');
    li.className = `answered-card ${isCorrect ? 'correct' : 'wrong'} arriving`;
    li.innerHTML = `<span class="result"></span><span class="title"></span><span class="meta"></span>`;
    li.querySelector('.result').textContent = isCorrect ? '✓ Correct' : '✗ Incorrect';
    li.querySelector('.title').textContent = `Q${state.index + 1}`;
    li.querySelector('.meta').textContent = q.category;
    li.title = q.question;
    $('answered-list').prepend(li);
    li.addEventListener('animationend', e => {
        if (e.animationName !== 'slideIn') li.classList.remove('arriving');
    });
}

// ---------- Helpers ----------

function percent(part, whole) {
    return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
}

function restartAnimation(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
}

function announce(message) {
    const el = $('announcer');
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 50);
}

function handleShortcut(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || state.awaitingNext) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;

    const key = event.key.toUpperCase();
    let index = LETTERS.indexOf(key);
    if (index === -1 && /^[1-6]$/.test(key)) index = Number(key) - 1;
    const q = state.questions[state.index];
    if (index >= 0 && q && index < q.choices.length) {
        event.preventDefault();
        chooseOption(index);
    }
}

// ---------- Local dev server helpers ----------

async function quitServer() {
    try {
        await fetch('/quit');
        alert('Development server is shutting down. You can close this tab.');
    } catch {
        alert('Development server appears to be shut down already.');
    }
}

function startHeartbeat() {
    setInterval(() => { fetch('/ping').catch(() => {}); }, 10000);
}

// Fallback questions if data/questions.json can't be loaded
function getDemoQuestions() {
    return [
        {
            id: 1,
            category: 'Business Management Systems',
            question: 'Jira and Gantt Pro are examples of what kind of software?',
            choices: ['Project management software', 'Project visualization resources', 'Tools used within project management software', 'Customer relationship management software'],
            correct_answers: [0],
            explanation: 'Jira and Gantt Pro are project management software tools.'
        },
        {
            id: 2,
            category: 'Computer Hardware',
            question: 'Which type of computer is the most powerful?',
            choices: ['Mainframe', 'Server', 'Supercomputer', 'Workstation'],
            correct_answers: [2],
            explanation: 'Supercomputers are built for the most demanding calculations.'
        },
        {
            id: 3,
            category: 'Database',
            question: 'Which SQL commands change the data stored in a table? Select all that apply.',
            answer_type: 'multiple',
            choices: ['SELECT', 'INSERT', 'UPDATE', 'DESCRIBE'],
            correct_answers: [1, 2],
            explanation: 'INSERT adds rows and UPDATE modifies them; SELECT and DESCRIBE only read.'
        }
    ];
}
