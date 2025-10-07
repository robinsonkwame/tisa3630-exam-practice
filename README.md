# TISA 3630 Exam Practice - Flashcard Game

Interactive flashcard game with a tit-for-tat computer opponent for TISA 3630 exam preparation.

## Features

- **Competitive gameplay** against an AI opponent using tit-for-tat strategy
- **Adaptive difficulty** - computer mirrors your performance
- **Topic-based questions** across 8 categories:
  - MIS (Questions 1-112)
  - Competitive Advantage (Questions 113-182)
  - Computer Hardware (Questions 183-279)
  - Computer Software (Questions 280-323)
  - Database (Questions 324-448)
  - Data Analytics (Questions 449-493)
  - Computing Networks (Questions 494-580)
  - Business Management Systems (Questions 581-656)
- **PDF conversion tool** for processing test bank questions
- **Animated interface** using anime.js
- **Score tracking** with streaks

## Setup

### 1. Clone and Setup Environment
```bash
git clone <your-repo-url>
cd tisa3630-exam-practice

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install JavaScript dependencies
npm install
```

### 2. Convert Your PDF Test Bank
```bash
# Activate virtual environment (if not already active)
source venv/bin/activate

# Convert PDF to text with topic categorization
python scripts/pdf_to_text.py your-test-bank.pdf --identify-questions

# This will create:
# - your-test-bank.txt (full text)
# - your-test-bank_questions/ (individual questions by topic)
```

### 3. Prepare Questions
1. Review the extracted questions in the `_questions/` folder
2. Be inspried by your test bank. Then create 100 questions for your game
3. Update `data/sample-questions.json` with your questions

### 4. Run the Game
```bash
# Start local development server
npm run start

# Or use Python directly
python -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Game Mechanics

### Tit-for-Tat AI Strategy
The computer opponent uses a sophisticated strategy:
- **Base accuracy** set by difficulty slider (0-100%)
- **Adaptive behavior**: Analyzes your last 3 answers
- If you're doing well → computer increases accuracy (tries harder)
- If you're struggling → computer decreases accuracy (eases up)
- Maximum adjustment: ±15% from base difficulty

### Scoring
- Points awarded per correct answer (varies by question difficulty)
- Streak tracking for consecutive correct answers
- Final winner determined by total points

## Project Structure

```
tisa3630-exam-practice/
├── assets/
│   ├── css/styles.css          # Game styling
│   └── js/game.js              # Game logic with tit-for-tat AI
├── data/
│   └── sample-questions.json   # Question database
├── scripts/
│   └── pdf_to_text.py         # PDF conversion utility
├── venv/                       # Python virtual environment
├── index.html                  # Main game interface
├── package.json               # Node.js dependencies
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Development

### Adding Questions
Questions should follow this JSON structure:

```json
{
  "id": "q001",
  "question": "Your question text here?",
  "options": {
    "A": "Option A text",
    "B": "Option B text", 
    "C": "Option C text",
    "D": "Option D text"
  },
  "correct_answer": "B",
  "explanation": "Detailed explanation of the answer",
  "difficulty": "easy|medium|hard",
  "topic": "Database",
  "points": 1
}
```

### Topic Ranges
- Questions 1-112: MIS
- Questions 113-182: Competitive Advantage (70 questions)
- Questions 183-279: Computer Hardware (97 questions)  
- Questions 280-323: Computer Software (44 questions)
- Questions 324-448: Database (125 questions)
- Questions 449-493: Data Analytics (45 questions)
- Questions 494-580: Computing Networks (87 questions)
- Questions 581-656: Business Management Systems (76 questions)

## License

MIT License
Exam practice agent for TISA3630
