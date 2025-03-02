#!/usr/bin/env python3
"""
Generate bullet points for courses in a JSON file using OpenAI API.

Usage:
    python generate_bullet_points.py path/to/courses.json

Requirements:
    pip install openai
"""

import json
import os
import sys
from openai import OpenAI

def generate_bullet_points(text):
    """
    Generate 3 bullet points about a course using OpenAI API.
    
    Args:
        text (str): The course description or summary
        
    Returns:
        str: Three bullet points as a single string
    """
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful academic assistant that creates concise bullet points about university courses."},
                {"role": "user", "content": f"Generate EXACTLY 3 bullet points that summarize the key aspects of this course. Return ONLY the 3 bullet points without any additional text or numbering. Each bullet point should be prefixed with '• ' and be on a new line.\n\nCourse information: {text}"}
            ],
            temperature=0.7,
            max_tokens=300,
        )
        
        # Extract the bullet points from the response
        bullet_points = response.choices[0].message.content.strip()
        
        # Ensure we have exactly 3 bullet points
        points = bullet_points.split('\n')
        filtered_points = [p.strip() for p in points if p.strip()]
        
        # Add bullet prefix if not present
        formatted_points = []
        for point in filtered_points:
            if not point.startswith('•'):
                point = f"• {point}"
            formatted_points.append(point)
        
        # Pad or truncate to exactly 3 bullet points
        while len(formatted_points) < 3:
            formatted_points.append("• Additional information not available")
        
        formatted_points = formatted_points[:3]  # Limit to 3 points
        
        return '\n'.join(formatted_points)
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return "• Error generating course information\n• Please try again later\n• Contact support if the problem persists"

def process_json_file(file_path):
    """
    Process a JSON file containing course information and add bullet points.
    
    Args:
        file_path (str): Path to the JSON file
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File not found - {file_path}")
            sys.exit(1)
            
        print(f"Reading file: {file_path}")
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                courses = json.load(file)
            except json.JSONDecodeError as e:
                print(f"Error: Invalid JSON format in {file_path} - {e}")
                sys.exit(1)
        
        # Ensure courses is a list
        if not isinstance(courses, list):
            print(f"Error: Expected a list of courses in {file_path}, but got {type(courses)}")
            sys.exit(1)
        
        total_courses = len(courses)
        updated_courses = 0
        skipped_courses = 0
        
        print(f"Processing {total_courses} courses...")
        
        # Process each course
        for i, course in enumerate(courses, 1):
            # Status update
            course_name = course.get('name', course.get('title', 'Unknown'))
            print(f"Processing course {i}/{total_courses}: {course_name}")
            
            # Check if course already has bullet points
            if "bullet_points" in course and course["bullet_points"]:
                print(f"  - Skipping: Course already has bullet points")
                skipped_courses += 1
                continue
                
            # Get text to analyze
            course_description = course.get("course_description", "")
            summary = course.get("summary", "")
            
            # Skip course description if it's "Not entered" or empty
            if not course_description or course_description.strip() == "" or course_description == "Not entered":
                text_to_analyze = summary
            else:
                text_to_analyze = course_description
            
            # If no text available, set default message
            if not text_to_analyze or text_to_analyze.strip() == "":
                course["bullet_points"] = "• No information available\n• Please check the course catalog\n• Contact the course administrator"
                print(f"  - No description or summary available")
                updated_courses += 1
                continue
                
            # Generate bullet points
            print(f"  - Generating bullet points...")
            bullet_points = generate_bullet_points(text_to_analyze)
            
            # Add bullet points to course
            course["bullet_points"] = bullet_points
            updated_courses += 1
            print(f"  - Added bullet points: {bullet_points}")
        
        print(f"\nSaving changes to file: {file_path}")
        # Create a backup of the original file
        backup_path = f"{file_path}.bak"
        try:
            with open(backup_path, 'w', encoding='utf-8') as backup_file:
                with open(file_path, 'r', encoding='utf-8') as original_file:
                    backup_file.write(original_file.read())
            print(f"Created backup file: {backup_path}")
        except Exception as e:
            print(f"Warning: Could not create backup file: {e}")
            
        # Write updated data back to the file
        try:
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(courses, file, indent=2, ensure_ascii=False)
                file.flush()
                os.fsync(file.fileno())  # Force write to disk
            print(f"File saved successfully!")
        except Exception as e:
            print(f"ERROR SAVING FILE: {e}")
            sys.exit(1)
            
        # Verify the save worked
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                verify_courses = json.load(file)
                
            # Check if the first course has bullet points
            if verify_courses and len(verify_courses) > 0 and "bullet_points" in verify_courses[0]:
                print("Verification successful: Bullet points were saved correctly")
            else:
                print("WARNING: Verification failed - Could not find bullet points in the saved file")
        except Exception as e:
            print(f"Error during verification: {e}")
            
        print(f"\nSuccess! Updated {updated_courses} courses, skipped {skipped_courses} courses.")
        print(f"File saved: {file_path}")
        
    except Exception as e:
        print(f"Unexpected error processing file: {e}")
        sys.exit(1)

def main():
    # Check if OpenAI API key is set
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Please set it by running: export OPENAI_API_KEY=your_api_key")
        sys.exit(1)
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("Usage: python generate_bullet_points.py path/to/courses.json")
        sys.exit(1)
    
    file_path = sys.argv[1]
    process_json_file(file_path)

if __name__ == "__main__":
    main() 