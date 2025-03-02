#!/usr/bin/env python3
"""
Script to verify if bullet points are actually saved in the JSON files.
This will check a specific file and print the first few courses to see if they have bullet_points.

Usage:
    python verify_bullet_points.py [path/to/file.json]
"""

import json
import os
import sys

def check_bullet_points(file_path, num_courses=5):
    """
    Check if courses in the file have bullet points.
    
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
        
        # Check for bullet points in the first few courses
        print(f"Checking the first {min(num_courses, len(courses))} courses in {file_path}:")
        count_with_bullets = 0
        
        for i, course in enumerate(courses[:num_courses]):
            course_name = course.get('name', course.get('title', 'Unknown'))
            if "bullet_points" in course and course["bullet_points"]:
                count_with_bullets += 1
                print(f"✅ Course {i+1}: {course_name}")
                print(f"   Bullet points: {course['bullet_points']}")
            else:
                print(f"❌ Course {i+1}: {course_name} - No bullet points found")
                
        # Print summary
        print(f"\nSummary: {count_with_bullets}/{min(num_courses, len(courses))} courses have bullet points")
        print(f"Total courses in file: {len(courses)}")
        
        # Check file permissions
        stats = os.stat(file_path)
        print(f"\nFile permissions: {oct(stats.st_mode)[-3:]}")
        print(f"File owner: {stats.st_uid}")
        
        # Attempt to modify the file to test permissions
        try:
            with open(file_path, 'a') as test_file:
                test_file.write("")
            print("✅ File is writable")
        except Exception as e:
            print(f"❌ File is not writable: {e}")
            
    except Exception as e:
        print(f"Error checking file: {e}")

def main():
    # Get file path from command line arguments or use default
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        # Try to find a course file
        possible_paths = [
            "scraped_data/courses/courses_Edinburgh_College_of_Art.json",
            "../scraped_data/courses/courses_Edinburgh_College_of_Art.json",
            "/Users/dogamujde/Desktop/hacktheburghEdTech/scraped_data/courses/courses_Edinburgh_College_of_Art.json"
        ]
        
        file_path = None
        for path in possible_paths:
            if os.path.exists(path):
                file_path = path
                break
        
        if not file_path:
            print("Error: Could not find a course file to check.")
            print("Please specify the path to a course file as a command line argument.")
            sys.exit(1)
    
    print(f"Checking file: {file_path}")
    check_bullet_points(file_path)

if __name__ == "__main__":
    main() 