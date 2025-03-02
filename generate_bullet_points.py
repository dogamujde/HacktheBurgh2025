#!/usr/bin/env python3
"""
Generate bullet points for courses in a JSON file using OpenAI API.
Also filters out courses with "period" set to "Not delivered this year".

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
            model="gpt-4o-mini-2024-07-18",
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
    Process a JSON file containing course information:
    1. Filter out courses with period "Not delivered this year"
    2. Add bullet points to remaining courses
    
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
        
        total_courses_original = len(courses)
        
        # Filter out courses with period "Not delivered this year"
        filtered_courses = []
        removed_courses = 0
        
        for course in courses:
            period = course.get("period", "")
            if period == "Not delivered this year":
                removed_courses += 1
                course_name = course.get('name', course.get('title', 'Unknown'))
                print(f"Skipping non-delivered course: {course_name}")
            else:
                filtered_courses.append(course)
        
        # Report on filtered courses
        total_courses = len(filtered_courses)
        print(f"\nFiltered out {removed_courses} courses that are not delivered this year.")
        print(f"Processing {total_courses} remaining courses...")
        
        updated_courses = 0
        skipped_courses = 0
        
        # Process each remaining course
        for i, course in enumerate(filtered_courses, 1):
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
            
        # Write updated data back to the file (using filtered courses)
        try:
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(filtered_courses, file, indent=2, ensure_ascii=False)
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
                
            # Check if the filtered number of courses matches
            if len(verify_courses) == total_courses:
                print(f"Verification successful: Saved {total_courses} courses (removed {removed_courses})")
            else:
                print(f"WARNING: Verification found {len(verify_courses)} courses, expected {total_courses}")
        except Exception as e:
            print(f"Error during verification: {e}")
            
        print(f"\nSuccess!")
        print(f"- Original course count: {total_courses_original}")
        print(f"- Courses removed (not delivered): {removed_courses}")
        print(f"- Remaining courses: {total_courses}")
        print(f"- Courses updated with bullet points: {updated_courses}")
        print(f"- Courses skipped (already had bullet points): {skipped_courses}")
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