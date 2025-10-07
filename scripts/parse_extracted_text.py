#!/usr/bin/env python3
"""
Improved parser for TISA 3630 Test Bank Questions

This script parses the already extracted text file to properly separate
questions and apply topic categorization.

Usage:
    python scripts/parse_extracted_text.py "midterm test bank.txt"
"""

import sys
import re
from pathlib import Path
import json


def get_topic_from_question_number(question_num):
    """
    Map question number to topic based on the provided ranges:
    1-112: MIS
    113-182: Competitive Advantage (70 questions)
    183-279: Computer Hardware (97 questions)
    280-323: Computer Software (44 questions)
    324-448: Database (125 questions)
    449-493: Data Analytics (45 questions)
    494-580: Computing Networks (87 questions)
    581-656: Business Management Systems (76 questions)
    """
    if 1 <= question_num <= 112:
        return "MIS"
    elif 113 <= question_num <= 182:
        return "Competitive Advantage"
    elif 183 <= question_num <= 279:
        return "Computer Hardware"
    elif 280 <= question_num <= 323:
        return "Computer Software"
    elif 324 <= question_num <= 448:
        return "Database"
    elif 449 <= question_num <= 493:
        return "Data Analytics"
    elif 494 <= question_num <= 580:
        return "Computing Networks"
    elif 581 <= question_num <= 656:
        return "Business Management Systems"
    else:
        return "Unknown"


def parse_questions_from_text(text):
    """Parse questions from the continuous text stream."""
    questions = []
    
    # Split by question numbers (look for patterns like " 1. ", " 2. ", etc.)
    # This regex finds numbers followed by period and space, preceded by space or start of line
    question_pattern = r'(?:^|\s)(\d+)\.\s+'
    
    # Find all question starts
    question_starts = []
    for match in re.finditer(question_pattern, text):
        question_num = int(match.group(1))
        start_pos = match.start()
        question_starts.append((question_num, start_pos, match.end()))
    
    print(f"Found {len(question_starts)} potential question markers")
    
    # Extract text for each question
    for i, (question_num, start_pos, content_start) in enumerate(question_starts):
        # Determine where this question ends (start of next question or end of text)
        if i + 1 < len(question_starts):
            end_pos = question_starts[i + 1][1]
        else:
            end_pos = len(text)
        
        # Extract the question text
        question_text = text[content_start:end_pos].strip()
        
        # Clean up the question text
        question_text = clean_question_text(question_text)
        
        # Skip very short "questions" (probably not real questions)
        if len(question_text) < 50:
            continue
        
        # Get topic
        topic = get_topic_from_question_number(question_num)
        
        questions.append({
            'number': question_num,
            'topic': topic,
            'raw_text': question_text
        })
        
        if question_num <= 10:  # Debug first few
            print(f"Question {question_num}: {question_text[:100]}...")
    
    return questions


def clean_question_text(text):
    """Clean and format extracted question text."""
    # Remove page headers and footers
    text = re.sub(r'--- Page \d+ ---.*?Assignment Print View', '', text, flags=re.DOTALL)
    text = re.sub(r'https://ezto\.mheducation\.com/hm\.tpx.*?\d+/\d+', '', text)
    text = re.sub(r'\d+/\d+/\d+, \d+:\d+ AM', '', text)
    
    # Remove excessive whitespace
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text


def extract_question_components(raw_text):
    """
    Try to extract question, options, and explanation from raw text.
    This is a best-effort attempt - the format is quite complex.
    """
    components = {
        'question': '',
        'options': {},
        'correct_answer': '',
        'explanation': ''
    }
    
    # For now, just return the raw text
    # This can be improved later to parse the specific components
    components['question'] = raw_text
    
    return components


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/parse_extracted_text.py 'midterm test bank.txt'")
        return 1
    
    input_file = Path(sys.argv[1])
    if not input_file.exists():
        print(f"Error: File '{input_file}' does not exist")
        return 1
    
    print(f"Reading text from: {input_file}")
    text = input_file.read_text(encoding='utf-8')
    
    print(f"Loaded {len(text)} characters")
    
    # Parse questions
    questions = parse_questions_from_text(text)
    print(f"Successfully parsed {len(questions)} questions")
    
    # Group by topic
    topic_counts = {}
    for q in questions:
        topic = q['topic']
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
    
    print("\nQuestions by topic:")
    for topic, count in sorted(topic_counts.items()):
        print(f"  {topic}: {count} questions")
    
    # Create output directory
    output_dir = input_file.parent / f"{input_file.stem}_parsed_questions"
    output_dir.mkdir(exist_ok=True)
    
    # Write individual question files
    for question in questions:
        question_num = question['number']
        topic = question['topic'].replace(' ', '_')
        
        filename = f"question_{question_num:03d}_{topic}.txt"
        filepath = output_dir / filename
        
        content = f"Question #{question_num} - Topic: {question['topic']}\n"
        content += "=" * 60 + "\n\n"
        content += question['raw_text']
        
        filepath.write_text(content)
    
    # Create summary JSON
    summary = {
        'total_questions': len(questions),
        'topics': topic_counts,
        'questions': [
            {
                'number': q['number'],
                'topic': q['topic'],
                'preview': q['raw_text'][:200] + "..." if len(q['raw_text']) > 200 else q['raw_text']
            }
            for q in questions[:10]  # First 10 for preview
        ]
    }
    
    summary_file = output_dir / "summary.json"
    summary_file.write_text(json.dumps(summary, indent=2))
    
    print(f"\n✓ Questions saved to: {output_dir}")
    print(f"✓ Summary saved to: {summary_file}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())