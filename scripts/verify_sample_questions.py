#!/usr/bin/env python3
"""
Verify sample questions against testbank content to check for hallucination.

This script:
1. Loads the sample questions from data/sample-questions.json
2. Searches through the testbank parsed questions to find matches
3. Reports which questions are real (from testbank) vs hallucinated
4. Updates the mapping file with verification results

Usage:
    python scripts/verify_sample_questions.py --testbank-dir "midterm test bank_parsed_questions" --similarity-threshold 0.7
"""

import json
import os
import argparse
import re
from datetime import datetime
from difflib import SequenceMatcher

def load_sample_questions(filepath):
    """Load the sample questions JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading sample questions: {e}")
        return None

def load_testbank_question(filepath):
    """Load a single testbank question file."""
    try:
        with open(filepath, 'r') as f:
            content = f.read().strip()
        
        # Extract question number from filename
        filename = os.path.basename(filepath)
        match = re.match(r'question_(\d+)_', filename)
        question_num = int(match.group(1)) if match else None
        
        # Parse the content to extract question text
        lines = content.split('\n')
        question_text = ""
        for line in lines:
            if line.strip() and not line.startswith('Question #') and not line.startswith('='):
                question_text += line.strip() + " "
        
        return {
            'number': question_num,
            'filename': filename,
            'content': content,
            'question_text': question_text.strip()
        }
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def similarity(text1, text2):
    """Calculate similarity between two text strings."""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

def find_similar_questions(sample_question_text, testbank_questions, threshold=0.3):
    """Find testbank questions similar to the sample question."""
    matches = []
    
    for tb_question in testbank_questions:
        sim_score = similarity(sample_question_text, tb_question['question_text'])
        if sim_score > threshold:
            matches.append({
                'testbank_question': tb_question,
                'similarity_score': sim_score
            })
    
    # Sort by similarity score (descending)
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    return matches

def verify_sample_questions(sample_questions_file, testbank_dir, similarity_threshold):
    """Verify sample questions against testbank content."""
    
    # Load sample questions
    sample_data = load_sample_questions(sample_questions_file)
    if not sample_data:
        return False
    
    # Load all testbank questions
    print(f"Loading testbank questions from {testbank_dir}...")
    testbank_questions = []
    
    if not os.path.exists(testbank_dir):
        print(f"Error: Testbank directory '{testbank_dir}' not found")
        return False
    
    question_files = [f for f in os.listdir(testbank_dir) if f.startswith('question_') and f.endswith('.txt')]
    question_files.sort()
    
    for filename in question_files:
        filepath = os.path.join(testbank_dir, filename)
        tb_question = load_testbank_question(filepath)
        if tb_question:
            testbank_questions.append(tb_question)
    
    print(f"Loaded {len(testbank_questions)} testbank questions")
    
    # Verify each sample question
    verification_results = {}
    
    for question in sample_data['questions']:
        question_id = question['id']
        question_text = question['question']
        
        print(f"\n🔍 Verifying {question_id}: {question_text[:60]}...")
        
        # Find similar questions in testbank
        matches = find_similar_questions(question_text, testbank_questions, similarity_threshold)
        
        if matches:
            best_match = matches[0]
            print(f"   ✅ Found similar question (score: {best_match['similarity_score']:.3f})")
            print(f"   📄 Testbank Q#{best_match['testbank_question']['number']}: {best_match['testbank_question']['filename']}")
            print(f"   📝 Testbank text: {best_match['testbank_question']['question_text'][:100]}...")
            
            verification_results[question_id] = {
                'verified': True,
                'testbank_question_number': best_match['testbank_question']['number'],
                'testbank_filename': best_match['testbank_question']['filename'],
                'similarity_score': best_match['similarity_score'],
                'status': 'found_similar' if best_match['similarity_score'] < 0.8 else 'likely_match',
                'all_matches': [
                    {
                        'question_number': m['testbank_question']['number'],
                        'filename': m['testbank_question']['filename'],
                        'similarity_score': m['similarity_score']
                    } for m in matches[:3]  # Top 3 matches
                ]
            }
        else:
            print(f"   ❌ No similar questions found (threshold: {similarity_threshold})")
            verification_results[question_id] = {
                'verified': False,
                'status': 'no_match_found',
                'note': 'Likely hallucinated - no similar questions in testbank'
            }
    
    return verification_results

def generate_verification_report(verification_results, output_file):
    """Generate a detailed verification report."""
    
    verified_count = sum(1 for result in verification_results.values() if result['verified'])
    total_count = len(verification_results)
    hallucinated_count = total_count - verified_count
    
    report = {
        'metadata': {
            'verification_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'total_questions_checked': total_count,
            'verified_questions': verified_count,
            'likely_hallucinated': hallucinated_count,
            'verification_rate': round(verified_count / total_count * 100, 2) if total_count > 0 else 0
        },
        'summary': {
            'verified_questions': [qid for qid, result in verification_results.items() if result['verified']],
            'hallucinated_questions': [qid for qid, result in verification_results.items() if not result['verified']]
        },
        'detailed_results': verification_results
    }
    
    try:
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\n📊 Verification report saved to: {output_file}")
        return True
    except Exception as e:
        print(f"Error saving verification report: {e}")
        return False

def print_summary(verification_results):
    """Print a summary of verification results."""
    
    verified_count = sum(1 for result in verification_results.values() if result['verified'])
    total_count = len(verification_results)
    hallucinated_count = total_count - verified_count
    
    print(f"\n{'='*60}")
    print(f"📊 VERIFICATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total questions checked: {total_count}")
    print(f"✅ Verified (found in testbank): {verified_count}")
    print(f"❌ Likely hallucinated: {hallucinated_count}")
    print(f"📈 Verification rate: {round(verified_count / total_count * 100, 2)}%")
    
    if hallucinated_count > 0:
        print(f"\n⚠️  HALLUCINATED QUESTIONS:")
        for qid, result in verification_results.items():
            if not result['verified']:
                print(f"   {qid}")
        
        print(f"\n🚨 RECOMMENDATION: Only proceed with questions that were verified in the testbank.")
        print(f"   Replace hallucinated questions with actual testbank content before rewriting.")
    else:
        print(f"\n🎉 All sample questions appear to be based on testbank content!")

def main():
    parser = argparse.ArgumentParser(description='Verify sample questions against testbank content')
    parser.add_argument('--sample-questions', default='data/sample-questions.json',
                       help='Path to sample questions file')
    parser.add_argument('--testbank-dir', required=True,
                       help='Directory containing parsed testbank questions')
    parser.add_argument('--similarity-threshold', type=float, default=0.3,
                       help='Minimum similarity score to consider a match (0.0-1.0)')
    parser.add_argument('--output-report', default='data/verification-report.json',
                       help='Output file for detailed verification report')
    
    args = parser.parse_args()
    
    # Make paths relative to project root if needed
    if not os.path.isabs(args.sample_questions):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        args.sample_questions = os.path.join(project_root, args.sample_questions)
    
    if not os.path.isabs(args.output_report):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        args.output_report = os.path.join(project_root, args.output_report)
    
    print("🔍 Starting sample question verification...")
    print(f"Sample questions: {args.sample_questions}")
    print(f"Testbank directory: {args.testbank_dir}")
    print(f"Similarity threshold: {args.similarity_threshold}")
    
    # Perform verification
    verification_results = verify_sample_questions(
        args.sample_questions,
        args.testbank_dir,
        args.similarity_threshold
    )
    
    if not verification_results:
        print("❌ Verification failed")
        exit(1)
    
    # Print summary
    print_summary(verification_results)
    
    # Generate detailed report
    generate_verification_report(verification_results, args.output_report)
    
    # Check if we should proceed
    verified_count = sum(1 for result in verification_results.values() if result['verified'])
    total_count = len(verification_results)
    
    if verified_count < total_count:
        print(f"\n⚠️  WARNING: {total_count - verified_count} questions appear to be hallucinated!")
        print(f"   You should only proceed with the {verified_count} verified questions.")
        exit(2)  # Exit code 2 indicates hallucinated content found
    else:
        print(f"\n✅ All questions verified! Safe to proceed with rewriting.")

if __name__ == '__main__':
    main()