# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

TISA 3630 Exam Practice is an interactive flashcard game with a sophisticated tit-for-tat AI opponent. The project combines web frontend technologies (React, Vite, TailwindCSS) with Python backend utilities for PDF processing and question management.

## Architecture

### Frontend Architecture
- **Framework**: React with Vite build system
- **Styling**: TailwindCSS for responsive design
- **Animation**: anime.js for smooth card transitions
- **Game Engine**: Custom JavaScript implementation with tit-for-tat AI strategy

### Backend/Processing Architecture
- **PDF Processing**: Python scripts using pdfplumber/PyPDF2
- **Question Management**: JSON-based question database with verification system
- **Server**: Smart Python HTTP server with auto-shutdown capabilities

### AI Strategy Implementation
The core game logic implements a tit-for-tat strategy where:
- AI has base accuracy set by difficulty slider (0-100%)
- AI analyzes player's last 3 answers to adapt behavior
- AI increases accuracy when player performs well (±15% adjustment)
- AI decreases accuracy when player struggles

## Development Commands

### Environment Setup
```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install JavaScript dependencies
npm install
```

### Development Servers
```bash
# React development with Vite (RECOMMENDED for React JSX)
npm run beach-test        # Vite server on port 3000
npm run beach-test-mobile # Mobile testing server

# Static file development (for vanilla HTML/JS only)
npm run dev               # live-server on port 8080 

# Netlify development environment
npm run netlify-dev       # Full Netlify environment

# Smart Python server (auto-shutdown)
python smart_server.py [port]
# Default port 8080, auto-quits on browser disconnect
```

**Important**: For React JSX development, always use `npm run beach-test` (Vite) instead of `npm run dev` (live-server) to avoid JSX compilation issues.

### PDF Processing & Question Management
```bash
# Convert PDF test bank to text
python scripts/pdf_to_text.py your-test-bank.pdf --identify-questions

# Verify sample questions against test bank
python scripts/verify_sample_questions.py

# Create verified questions from samples
python scripts/create_verified_questions.py
```

### Build & Deploy
```bash
# Production build (Vite builds to dist/ directory)
npm run build

# Preview production build locally
npm run preview

# Local Netlify development server
npm run netlify-dev

# Deploy to Netlify (automated via Git integration)
# Push to main branch for automatic deployment
git add .
git commit -m "Deploy updates"
git push origin main
```

## Question Database Structure

### Verified Questions (`data/live-midterm-sample-questions.json`)
Questions follow this structure:
```json
{
  "id": 1,
  "category": "Database",
  "question": "Question text here?",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "answer_type": "single|multiple",
  "correct_answers": [2], // Zero-indexed array
  "difficulty": "easy|medium|hard",
  "explanation": "Detailed explanation"
}
```

### Topic Categories
- Business_Management_Systems (Questions 581-656)
- Computer_Hardware (Questions 183-279)
- Computer_Software (Questions 280-323)
- Computing_Networks (Questions 494-580)
- Competitive_Advantage (Questions 113-182)
- Database (Questions 324-448)
- Data_Analytics (Questions 449-493)
- MIS (Questions 1-112)

## Academic Integrity Workflow

### Using Verified Questions
1. **Use only** `data/live-midterm-sample-questions.json` (85 verified questions)
2. Cross-reference with testbank using `testbank_reference.original_question_number`
3. Create new questions inspired by (not copied from) verified content
4. Follow the complete workflow documented in `VERIFIED_QUESTIONS_WORKFLOW.md`

### Question Verification System
The project includes a sophisticated verification system:
- 85 questions verified against actual testbank material
- 15 hallucinated questions identified and removed
- Complete traceability with similarity scores
- Testbank reference numbers for academic integrity

## File Organization

### Critical Files
- `data/live-midterm-sample-questions.json` - Primary question database (USE THIS)
- `VERIFIED_QUESTIONS_WORKFLOW.md` - Academic integrity guidelines
- `vite.config.mjs` - Vite configuration with React and TailwindCSS
- `smart_server.py` - Development server with auto-shutdown

### Scripts Directory
- `pdf_to_text.py` - Convert PDFs with question identification
- `verify_sample_questions.py` - Verify questions against testbank
- `create_verified_questions.py` - Generate verified question subset

### Frontend Assets
- `src/` - React components and styling
- `assets/js/game.js` - Core game logic (if using vanilla JS variant)
- `public/` - Static assets and headers

## Netlify & Vite Deployment

### Netlify Configuration
The project is configured for deployment to Netlify with the following setup:
- **Build Command**: `npm run build` (uses Vite)
- **Publish Directory**: `dist/` (Vite's output directory)
- **Node Version**: 18
- **Development Command**: `npm run dev`
- **Development Port**: 8080

### Vite Build Process
Vite handles the build process with optimizations for production:
- **React compilation** with JSX support
- **TailwindCSS processing** for utility-first styling
- **Asset optimization** and bundling
- **Static file handling** from `assets/` directory
- **Output directory**: `dist/` for Netlify deployment

### Deployment Workflow
1. **Local Development**: Use `npm run dev` or `npm run netlify-dev`
2. **Build Testing**: Run `npm run build && npm run preview`
3. **Deployment**: Push to main branch for automatic Netlify deployment
4. **Verification**: Check deployed site functionality

### Netlify Headers & Caching
Configured in `netlify.toml` and `public/_headers`:
- **JavaScript files**: Cached for 24 hours with correct MIME types
- **CSS files**: Cached for 24 hours
- **JSON data files**: Cached for 5 minutes for frequent updates
- **Asset optimization**: Automatic compression and optimization

## Development Notes

### Multi-Framework Support
The project supports both React (via Vite) and vanilla JavaScript implementations:
- React components in `src/`
- Vanilla JS game logic in `assets/js/`
- Use appropriate npm scripts for each variant

### Question Processing Pipeline
1. Extract text from PDF using `pdf_to_text.py`
2. Identify individual questions by number patterns
3. Map questions to topics using predefined ranges
4. Verify against testbank using similarity scoring
5. Create verified subset for game use

### AI Behavior Tuning
The tit-for-tat AI can be adjusted by modifying:
- Base accuracy range (0-100%)
- Adaptation window (currently last 3 answers)
- Maximum adjustment range (currently ±15%)
- Response delay timing for realism

## Troubleshooting

### JSX MIME Type Issues
If you encounter "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of 'text/jsx'" errors:

1. **Use the correct development server**: Always use `npm run beach-test` for React development
2. **Verify MIME type configuration**: JSX MIME types are configured in both `netlify.toml` and `public/_headers`
3. **Check server configuration**: The project includes JSX → JavaScript MIME type mappings for proper compilation

### Development Server Selection
- **React JSX files**: Use `npm run beach-test` (Vite)
- **Static HTML/vanilla JS**: Use `npm run dev` (live-server)
- **Full deployment testing**: Use `npm run netlify-dev`
