#!/usr/bin/env python3
"""
Script to verify if bulletpoints (in the format expected by the frontend) are properly 
saved in the JSON files.

Usage:
    python3 verify_frontend_bulletpoints.py [path/to/file.json]
"""

import json
import os
import sys

def check_bulletpoints(file_path, num_courses=5):
    """
    Check if courses in the file have bulletpoints in the format expected by the frontend.
    
    Args:
        file_path (str): Path to the JSON file to check
        num_courses (int): Number of courses to check
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File not found - {file_path}")
            return
            
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                courses = json.load(file)
            except json.JSONDecodeError as e:
                print(f"Error: Invalid JSON format in {file_path} - {e}")
                return
        
        # Ensure courses is a list
        if not isinstance(courses, list):
            print(f"Error: Expected a list of courses in {file_path}, but got {type(courses)}")
            return
        
        # Check for bulletpoints in the first few courses
        print(f"Checking the first {min(num_courses, len(courses))} courses in {file_path}:")
        count_with_bulletpoints = 0
        wrong_field_name = 0
        
        for i, course in enumerate(courses[:num_courses]):
            course_name = course.get('name', course.get('title', 'Unknown'))
            course_code = course.get('code', 'Unknown')
            
            # Check for "bulletpoints" field (frontend expects this)
            if "bulletpoints" in course and course["bulletpoints"]:
                count_with_bulletpoints += 1
                print(f"✅ Course {i+1}: {course_code} - {course_name}")
                print(f"   Bullet points: {course['bulletpoints']}")
            # Check if it's using the wrong field name "bullet_points"
            elif "bullet_points" in course and course["bullet_points"]:
                wrong_field_name += 1
                print(f"⚠️ Course {i+1}: {course_code} - {course_name}")
                print(f"   Has bullet_points but NOT bulletpoints (wrong field name):")
                print(f"   {course['bullet_points']}")
            else:
                print(f"❌ Course {i+1}: {course_code} - {course_name} - No bullet points found")
                
        # Print summary
        total_checked = min(num_courses, len(courses))
        print(f"\nSummary:")
        print(f"- {count_with_bulletpoints}/{total_checked} courses have correct 'bulletpoints' field")
        print(f"- {wrong_field_name}/{total_checked} courses have wrong 'bullet_points' field name")
        print(f"- {total_checked - count_with_bulletpoints - wrong_field_name}/{total_checked} courses have no bullet points")
        print(f"Total courses in file: {len(courses)}")
        
        # Suggest fix if wrong field name is found
        if wrong_field_name > 0:
            print("\nFIX NEEDED: Some courses have the wrong field name 'bullet_points' instead of 'bulletpoints'")
            print("To fix this, you can run the following script:")
            print("python3 fix_bullet_points_field_name.py " + file_path)
            
    except Exception as e:
        print(f"Error checking file: {e}")

def find_courses_directory():
    """
    Find the courses directory from common locations.
    
    Returns:
        str: Path to the courses directory, or None if not found
    """
    # Print current working directory for debugging
    cwd = os.getcwd()
    print(f"Current working directory: {cwd}")
    
    # Try several possible locations
    possible_paths = [
        os.path.join(cwd, "scraped_data", "courses"),
        os.path.join(cwd, "..", "scraped_data", "courses"),
        os.path.join(os.path.dirname(cwd), "scraped_data", "courses"),
        "/Users/dogamujde/Desktop/hacktheburghEdTech/scraped_data/courses"
    ]
    
    for path in possible_paths:
        if os.path.exists(path) and os.path.isdir(path):
            print(f"Found courses directory: {path}")
            return path
    
    print("Could not find courses directory!")
    return None

def main():
    # Get file path from command line arguments or use default
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        # Try to find a course file
        courses_dir = find_courses_directory()
        if not courses_dir:
            print("Error: Could not find courses directory.")
            print("Please specify the path to a course file as a command line argument.")
            sys.exit(1)
            
        # Get the first JSON file in the directory
        json_files = [f for f in os.listdir(courses_dir) if f.endswith('.json')]
        if not json_files:
            print(f"Error: No JSON files found in {courses_dir}")
            sys.exit(1)
            
        file_path = os.path.join(courses_dir, json_files[0])
    
    print(f"Checking file: {file_path}")
    check_bulletpoints(file_path)

if __name__ == "__main__":
    main() 