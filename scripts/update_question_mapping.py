#!/usr/bin/env python3
"""
Helper script to update question mappings when rewriting questions based on testbank content.

Usage:
    python scripts/update_question_mapping.py --question-id df001 --original-number 145 --source-file "question_145_MIS.txt" --status testbank_derived --note "Adapted from testbank question about DBMS fundamentals"
    
    python scripts/update_question_mapping.py --question-id sql005 --original-number 298 --source-file "question_298_SQL.txt" --status testbank_verbatim --note "Direct copy from testbank - needs rewriting"
"""

import json
import argparse
import os
from datetime import datetime

def load_mapping_file(filepath):
    """Load the question mapping JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Mapping file not found at {filepath}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in mapping file {filepath}")
        return None

def save_mapping_file(data, filepath):
    """Save the updated mapping JSON file."""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving mapping file: {e}")
        return False

def find_question_in_mapping(data, question_id):
    """Find which topic a question ID belongs to."""
    for topic, questions in data['mappings'].items():
        if question_id in questions:
            return topic
    return None

def update_question_mapping(mapping_file, question_id, original_number, source_file, status, note):
    """Update a question's mapping information."""
    
    # Load the current mapping
    data = load_mapping_file(mapping_file)
    if not data:
        return False
    
    # Find the question
    topic = find_question_in_mapping(data, question_id)
    if not topic:
        print(f"Error: Question ID '{question_id}' not found in mapping file")
        print("Available question IDs:")
        for topic_name, questions in data['mappings'].items():
            print(f"  {topic_name}: {', '.join(questions.keys())}")
        return False
    
    # Update the question mapping
    data['mappings'][topic][question_id] = {
        'original_question_number': original_number,
        'source_file': source_file,
        'status': status,
        'note': note,
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Update metadata
    if 'last_modified' not in data['metadata']:
        data['metadata']['last_modified'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    else:
        data['metadata']['last_modified'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Save the updated mapping
    if save_mapping_file(data, mapping_file):
        print(f"✅ Successfully updated mapping for {question_id}")
        print(f"   Topic: {topic}")
        print(f"   Original Question: #{original_number}")
        print(f"   Source File: {source_file}")
        print(f"   Status: {status}")
        print(f"   Note: {note}")
        return True
    else:
        return False

def validate_testbank_file(source_file, testbank_dir):
    """Check if the source file exists in the testbank directory."""
    if not testbank_dir:
        return True  # Skip validation if no directory provided
    
    filepath = os.path.join(testbank_dir, source_file)
    if os.path.exists(filepath):
        return True
    else:
        print(f"Warning: Source file '{source_file}' not found in {testbank_dir}")
        return False

def list_unmapped_questions(mapping_file):
    """List all questions that are still marked as 'sample_generated'."""
    data = load_mapping_file(mapping_file)
    if not data:
        return
    
    unmapped = []
    for topic, questions in data['mappings'].items():
        for q_id, q_data in questions.items():
            if q_data['status'] == 'sample_generated':
                unmapped.append((topic, q_id))
    
    if unmapped:
        print(f"📋 Found {len(unmapped)} unmapped questions:")
        for topic, q_id in unmapped:
            print(f"   {q_id} ({topic})")
    else:
        print("✅ All questions have been mapped to testbank sources!")

def main():
    parser = argparse.ArgumentParser(description='Update question mapping file')
    parser.add_argument('--question-id', required=True, help='Question ID to update (e.g., df001, sql005)')
    parser.add_argument('--original-number', type=int, help='Original question number from testbank')
    parser.add_argument('--source-file', help='Source file name from testbank (e.g., question_145_MIS.txt)')
    parser.add_argument('--status', choices=['sample_generated', 'testbank_derived', 'testbank_verbatim'], 
                       help='Status of the question mapping')
    parser.add_argument('--note', help='Note about the mapping or changes made')
    parser.add_argument('--mapping-file', default='data/question-mapping.json', 
                       help='Path to mapping file (default: data/question-mapping.json)')
    parser.add_argument('--testbank-dir', help='Directory containing testbank files for validation')
    parser.add_argument('--list-unmapped', action='store_true', 
                       help='List all questions still marked as sample_generated')
    
    args = parser.parse_args()
    
    # Make path relative to project root
    if not os.path.isabs(args.mapping_file):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        args.mapping_file = os.path.join(project_root, args.mapping_file)
    
    if args.list_unmapped:
        list_unmapped_questions(args.mapping_file)
        return
    
    # Validate required arguments for updating
    if not all([args.original_number, args.source_file, args.status, args.note]):
        print("Error: When updating a question mapping, all of these are required:")
        print("  --original-number, --source-file, --status, --note")
        return
    
    # Validate testbank file if directory provided
    if args.testbank_dir:
        validate_testbank_file(args.source_file, args.testbank_dir)
    
    # Update the mapping
    success = update_question_mapping(
        args.mapping_file, 
        args.question_id, 
        args.original_number, 
        args.source_file, 
        args.status, 
        args.note
    )
    
    if not success:
        exit(1)

if __name__ == '__main__':
    main()