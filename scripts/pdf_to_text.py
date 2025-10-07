#!/usr/bin/env python3
"""
PDF to Text Converter for Test Bank Questions

This script extracts text from PDF files containing test bank questions
and saves the output to a text file for further processing.

Requirements:
    pip install PyPDF2 pdfplumber

Usage:
    python pdf_to_text.py input.pdf output.txt
"""

import sys
import argparse
import re
from pathlib import Path

try:
    import pdfplumber
    PDF_LIBRARY = "pdfplumber"
except ImportError:
    try:
        import PyPDF2
        PDF_LIBRARY = "PyPDF2"
    except ImportError:
        print("Error: Please install either pdfplumber or PyPDF2:")
        print("pip install pdfplumber")
        print("or")
        print("pip install PyPDF2")
        sys.exit(1)


def extract_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber (recommended)"""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {page_num} ---\n"
                text += page_text + "\n"
            else:
                print(f"Warning: No text found on page {page_num}")
    return text


def extract_text_pypdf2(pdf_path):
    """Extract text using PyPDF2 (fallback option)"""
    text = ""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page_num, page in enumerate(pdf_reader.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {page_num} ---\n"
                text += page_text + "\n"
            else:
                print(f"Warning: No text found on page {page_num}")
    return text


def clean_text(text):
    """Clean and format the extracted text"""
    # Remove excessive whitespace
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    
    # Fix common PDF extraction issues
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add spaces between words
    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
    text = re.sub(r'^\s+|\s+$', '', text, flags=re.MULTILINE)  # Trim lines
    
    return text


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


def identify_questions(text):
    """
    Try to identify question patterns in the text.
    Updated to handle the specific test bank format: "376." followed by question text.
    """
    # Patterns for this specific test bank format
    question_patterns = [
        r'^\d+\.\s*$',  # Number with period on its own line (like "376.")
        r'^\d+\.\s+\S',  # Number with period followed by text (like "1. The purpose...")
        r'^\d+\.\s',  # Number with period and space
    ]
    
    lines = text.split('\n')
    questions = []
    current_question = []
    current_question_num = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if this line starts a new question and extract number
        question_match = None
        for pattern in question_patterns:
            match = re.match(pattern, line)
            if match:
                # Try to extract question number from patterns like "376."
                number_match = re.search(r'^(\d+)\.', line)
                if number_match:
                    question_match = int(number_match.group(1))
                    break
        
        if question_match and current_question:
            # Save previous question with topic info
            question_data = {
                'number': current_question_num,
                'topic': get_topic_from_question_number(current_question_num) if current_question_num else 'Unknown',
                'content': '\n'.join(current_question)
            }
            questions.append(question_data)
            current_question = [line]
            current_question_num = question_match
        else:
            current_question.append(line)
            if question_match and not current_question_num:
                current_question_num = question_match
    
    # Add the last question
    if current_question:
        question_data = {
            'number': current_question_num,
            'topic': get_topic_from_question_number(current_question_num) if current_question_num else 'Unknown',
            'content': '\n'.join(current_question)
        }
        questions.append(question_data)
    
    return questions


def main():
    parser = argparse.ArgumentParser(description='Convert PDF test bank to text format')
    parser.add_argument('input_pdf', help='Path to input PDF file')
    parser.add_argument('output_txt', nargs='?', help='Path to output text file (optional)')
    parser.add_argument('--identify-questions', action='store_true', 
                       help='Attempt to identify and separate individual questions')
    parser.add_argument('--clean', action='store_true', default=True,
                       help='Clean and format the extracted text (default: True)')
    
    args = parser.parse_args()
    
    # Validate input file
    input_path = Path(args.input_pdf)
    if not input_path.exists():
        print(f"Error: Input file '{input_path}' does not exist")
        return 1
    
    if not input_path.suffix.lower() == '.pdf':
        print(f"Error: Input file must be a PDF (got: {input_path.suffix})")
        return 1
    
    # Set output file path
    if args.output_txt:
        output_path = Path(args.output_txt)
    else:
        output_path = input_path.with_suffix('.txt')
    
    print(f"Converting PDF to text...")
    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")
    print(f"Library: {PDF_LIBRARY}")
    
    try:
        # Extract text based on available library
        if PDF_LIBRARY == "pdfplumber":
            raw_text = extract_text_pdfplumber(input_path)
        else:
            raw_text = extract_text_pypdf2(input_path)
        
        if not raw_text.strip():
            print("Warning: No text was extracted from the PDF")
            return 1
        
        # Clean text if requested
        if args.clean:
            text = clean_text(raw_text)
        else:
            text = raw_text
        
        # Identify questions if requested
        if args.identify_questions:
            questions = identify_questions(text)
            print(f"Identified {len(questions)} potential questions")
            
            # Write questions to separate files
            questions_dir = output_path.parent / f"{output_path.stem}_questions"
            questions_dir.mkdir(exist_ok=True)
            
            # Group questions by topic
            topic_counts = {}
            for i, question_data in enumerate(questions, 1):
                if isinstance(question_data, dict):
                    question_num = question_data.get('number', i)
                    topic = question_data.get('topic', 'Unknown')
                    content = question_data.get('content', str(question_data))
                    
                    # Count questions per topic
                    topic_counts[topic] = topic_counts.get(topic, 0) + 1
                    
                    # Create filename with topic info - handle None values
                    safe_question_num = question_num if question_num is not None else i
                    question_file = questions_dir / f"question_{safe_question_num:03d}_{topic.replace(' ', '_')}.txt"
                    
                    # Write content with header
                    header = f"Question #{safe_question_num} - Topic: {topic}\n{'='*50}\n"
                    question_file.write_text(header + content)
                else:
                    # Fallback for old format
                    question_file = questions_dir / f"question_{i:03d}.txt"
                    question_file.write_text(str(question_data))
            
            print(f"Questions saved to: {questions_dir}")
            print("Questions by topic:")
            for topic, count in sorted(topic_counts.items()):
                print(f"  {topic}: {count} questions")
        
        # Write the full text output
        output_path.write_text(text, encoding='utf-8')
        
        print(f"✓ Conversion complete!")
        print(f"✓ Extracted {len(text)} characters")
        print(f"✓ Output saved to: {output_path}")
        
        return 0
        
    except Exception as e:
        print(f"Error during conversion: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())