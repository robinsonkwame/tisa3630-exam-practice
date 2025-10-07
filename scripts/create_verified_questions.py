#!/usr/bin/env python3
"""
Create a filtered sample questions file containing only verified questions
with testbank question number references included.

This ensures academic integrity by only including questions that have
a basis in the actual testbank material.
"""

import json
import os

def load_json_file(filepath):
    """Load a JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def save_json_file(data, filepath):
    """Save data to a JSON file."""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        return False

def create_verified_questions_file():
    """Create filtered sample questions file with only verified questions."""
    
    # Load the original sample questions
    sample_questions_path = "data/sample-questions.json"
    verification_report_path = "data/verification-report.json"
    output_path = "data/sample-questions-verified.json"
    
    # Make paths absolute
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    sample_questions_path = os.path.join(project_root, sample_questions_path)
    verification_report_path = os.path.join(project_root, verification_report_path)
    output_path = os.path.join(project_root, output_path)
    
    # Load data
    print("Loading sample questions...")
    sample_data = load_json_file(sample_questions_path)
    if not sample_data:
        return False
    
    print("Loading verification report...")
    verification_data = load_json_file(verification_report_path)
    if not verification_data:
        return False
    
    # Get verified question IDs and their testbank references
    verified_questions = verification_data['summary']['verified_questions']
    verification_details = verification_data['detailed_results']
    
    print(f"Found {len(verified_questions)} verified questions out of {len(sample_data['questions'])} total")
    
    # Filter questions and add testbank references
    filtered_questions = []
    
    for question in sample_data['questions']:
        question_id = question['id']
        
        if question_id in verified_questions:
            # Add testbank reference information
            verification_info = verification_details[question_id]
            
            # Create enhanced question with testbank reference
            enhanced_question = {
                "id": question_id,
                "question": question['question'],
                "options": question['options'],
                "correct_answer": question['correct_answer'],
                "explanation": question['explanation'],
                "topic": question['topic'],
                # Add testbank reference
                "testbank_reference": {
                    "original_question_number": verification_info['testbank_question_number'],
                    "source_filename": verification_info['testbank_filename'],
                    "similarity_score": round(verification_info['similarity_score'], 3),
                    "verification_status": verification_info['status']
                }
            }
            
            filtered_questions.append(enhanced_question)
    
    # Count questions by topic
    topic_counts = {}
    for question in filtered_questions:
        topic = question['topic']
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
    
    # Create the filtered dataset
    filtered_data = {
        "metadata": {
            "title": "TISA 3630 Verified Sample Questions",
            "description": "Sample questions verified against testbank - hallucinated questions removed",
            "total_questions": len(filtered_questions),
            "version": "2.1.0-verified",
            "created_date": "2025-10-07",
            "subject": "TISA 3630",
            "verification_info": {
                "original_total": len(sample_data['questions']),
                "verified_count": len(filtered_questions),
                "removed_count": len(sample_data['questions']) - len(filtered_questions),
                "verification_rate": round(len(filtered_questions) / len(sample_data['questions']) * 100, 1),
                "verification_date": verification_data['metadata']['verification_date']
            },
            "topic_distribution": topic_counts,
            "topics": list(set(q['topic'] for q in filtered_questions))
        },
        "questions": filtered_questions
    }
    
    # Save the filtered file
    if save_json_file(filtered_data, output_path):
        print(f"\n✅ Created verified questions file: {output_path}")
        print(f"📊 Summary:")
        print(f"   Original questions: {len(sample_data['questions'])}")
        print(f"   Verified questions: {len(filtered_questions)}")
        print(f"   Removed (hallucinated): {len(sample_data['questions']) - len(filtered_questions)}")
        print(f"   Verification rate: {filtered_data['metadata']['verification_info']['verification_rate']}%")
        
        print(f"\n📋 Questions by topic:")
        for topic, count in topic_counts.items():
            print(f"   {topic}: {count} questions")
        
        print(f"\n🔍 Each question now includes:")
        print(f"   - Original question content")
        print(f"   - Testbank question number reference")
        print(f"   - Source filename from testbank")
        print(f"   - Similarity score")
        print(f"   - Verification status")
        
        return True
    else:
        return False

if __name__ == '__main__':
    print("🔍 Creating verified sample questions file...")
    success = create_verified_questions_file()
    
    if success:
        print("\n✅ SUCCESS: Verified questions file created!")
        print("💡 You can now safely use these 85 questions as inspiration for creating new questions,")
        print("   knowing each one has a verified basis in your testbank material.")
    else:
        print("\n❌ FAILED: Could not create verified questions file")
        exit(1)