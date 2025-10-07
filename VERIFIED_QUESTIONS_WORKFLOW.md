# Verified Sample Questions Workflow

## 📋 Overview

This document describes the workflow for using the verified sample questions file to create new exam practice questions while maintaining academic integrity.

## 🎯 What We Have

### ✅ **`data/sample-questions-verified.json`** - 85 Verified Questions
- **85 questions** verified against your actual testbank
- **15 hallucinated questions** removed for integrity
- Each question includes **testbank reference number** for verification
- Questions distributed across 5 topics:
  - Database Fundamentals: 19 questions
  - Database Design: 14 questions  
  - SQL Basics: 19 questions
  - Transaction Management: 18 questions
  - Database Security: 15 questions

### 📊 **Question Structure**
Each verified question includes:
```json
{
  "id": "df001",
  "question": "What is the primary purpose of a database management system (DBMS)?",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct_answer": "B",
  "explanation": "A DBMS is designed to store, retrieve, and manage data...",
  "topic": "Database Fundamentals",
  "testbank_reference": {
    "original_question_number": 396,
    "source_filename": "question_396_Database.txt",
    "similarity_score": 0.44,
    "verification_status": "found_similar"
  }
}
```

## 🔄 Recommended Workflow

### Step 1: Select a Verified Question
- Choose a question from `sample-questions-verified.json`
- Note the `testbank_reference.original_question_number` (e.g., 396)

### Step 2: Verify Against Original Testbank
- Open the corresponding testbank file: `midterm test bank_parsed_questions/question_396_Database.txt`
- Compare the sample question with the original to confirm relevance
- This ensures you're working with actual testbank material

### Step 3: Create Your New Question
- Use the verified question as **inspiration only**
- Create a completely new question on the same topic/concept
- Write original content - don't copy the testbank question
- Ensure your question tests the same learning objective

### Step 4: Test Your Question
- Verify your new question is educationally sound
- Ensure answer options are plausible and well-distributed
- Write a clear explanation for the correct answer

## ✅ Academic Integrity Guidelines

### ✅ **DO:**
- Use verified questions as inspiration for topics/concepts
- Create completely original question text and options
- Reference the testbank question number for your records
- Focus on the same learning objectives

### ❌ **DON'T:**
- Copy testbank questions verbatim
- Use the 15 removed hallucinated questions
- Claim sample questions are your original work
- Share or distribute testbank material

## 📁 File Structure

```
data/
├── sample-questions-verified.json    # 85 verified questions (USE THIS)
├── sample-questions.json            # Original 100 questions (contains hallucinated)
├── verification-report.json         # Detailed verification results
└── question-mapping.json           # Cross-reference mapping

scripts/
├── verify_sample_questions.py      # Verification tool
└── create_verified_questions.py    # Filter creation tool

midterm test bank_parsed_questions/   # Original testbank questions (651 files)
```

## 🎯 Next Steps

1. **Use only** `data/sample-questions-verified.json` for question development
2. **Cross-reference** each question with its testbank number before proceeding
3. **Create new questions** inspired by (not copied from) the verified content
4. **Deploy your JavaScript game** on Netlify with your original questions

## 🔍 Quality Assurance

The verification system ensures:
- ✅ 85% of sample questions have basis in actual testbank material
- ✅ Each question includes original testbank reference number  
- ✅ Hallucinated content has been identified and removed
- ✅ Complete traceability for academic integrity

You now have a solid, ethically sound foundation for creating your exam practice questions! 🎉