#!/usr/bin/env python3
"""
Filter out courses that are not being delivered this year from course JSON files.

This script:
1. Finds all course JSON files in the scraped_data directory
2. Removes courses with "period" set to "Not delivered this year"
3. Saves the filtered courses back to the original files
4. Reports statistics on how many courses were removed

Usage: 
  python3 filter_unavailable_courses.py

To process a single file:
  python3 filter_unavailable_courses.py path/to/courses.json
"""

import os
import json
import sys
import time

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

def filter_unavailable_courses(file_path):
    """
    Filter out courses with period "Not delivered this year"
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        tuple: (success, courses_removed)
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File not found - {file_path}")
            return False, 0
            
        print(f"Reading file: {file_path}")
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                courses = json.load(file)
            except json.JSONDecodeError as e:
                print(f"Error: Invalid JSON format in {file_path} - {e}")
                return False, 0
        
        # Ensure courses is a list
        if not isinstance(courses, list):
            print(f"Error: Expected a list of courses in {file_path}, but got {type(courses)}")
            return False, 0
        
        total_courses_original = len(courses)
        
        # Filter out courses with period "Not delivered this year"
        filtered_courses = []
        removed_courses = 0
        
        for course in courses:
            period = course.get("period", "")
            if period == "Not delivered this year":
                removed_courses += 1
                # Print details for the first few removed courses as examples
                if removed_courses <= 3 or removed_courses % 20 == 0:
                    course_name = course.get('name', course.get('title', 'Unknown'))
                    print(f"Removing non-delivered course: {course_name}")
            else:
                filtered_courses.append(course)
        
        # Only save if courses were removed
        if removed_courses > 0:
            print(f"\nFiltered out {removed_courses} courses that are not delivered this year from {file_path}")
            print(f"Original course count: {total_courses_original}")
            print(f"Remaining courses: {total_courses_original - removed_courses}")
            
            # Create a backup of the original file
            backup_path = f"{file_path}.bak"
            try:
                with open(backup_path, 'w', encoding='utf-8') as backup_file:
                    with open(file_path, 'r', encoding='utf-8') as original_file:
                        backup_file.write(original_file.read())
                print(f"Created backup file: {backup_path}")
            except Exception as e:
                print(f"Warning: Could not create backup file: {e}")
                
            # Write updated data back to the file (filtered courses only)
            try:
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(filtered_courses, file, indent=2, ensure_ascii=False)
                    file.flush()
                    os.fsync(file.fileno())  # Force write to disk
                print(f"File saved successfully!")
            except Exception as e:
                print(f"ERROR SAVING FILE: {e}")
                return False, removed_courses
        else:
            print(f"No courses to remove from {file_path}")
        
        return True, removed_courses
        
    except Exception as e:
        print(f"Unexpected error processing file: {e}")
        return False, 0

def process_all_files():
    """
    Find and process all JSON files in the courses directory
    """
    # Find the courses directory
    courses_dir = find_courses_directory()
    if not courses_dir:
        sys.exit(1)
    
    # Get all JSON files in the directory
    json_files = [f for f in os.listdir(courses_dir) if f.endswith('.json')]
    print(f"Found {len(json_files)} JSON files to process")
    
    # Ask for confirmation before proceeding
    response = input("\nThis will filter out all courses not being delivered this year. Proceed? (y/n): ")
    if response.lower() != 'y':
        print("Operation cancelled by user.")
        sys.exit(0)
    
    # Process all files
    print("\n===============")
    print("PROCESSING FILES")
    print("===============")
    
    total_files = len(json_files)
    successful_files = 0
    total_courses_removed = 0
    
    for i, file in enumerate(json_files, 1):
        file_path = os.path.join(courses_dir, file)
        print(f"\nProcessing file {i}/{total_files}: {file}")
        
        success, courses_removed = filter_unavailable_courses(file_path)
        
        if success:
            successful_files += 1
            total_courses_removed += courses_removed
        
        print(f"File {i}/{total_files} completed: {courses_removed} courses removed")
        
        # Add a short delay between files for readability
        if i < total_files:
            time.sleep(0.2)
    
    # Print summary
    print("\n===============")
    print("BATCH PROCESSING COMPLETE")
    print("===============")
    print(f"Processed {total_files} files")
    print(f"Successful: {successful_files}")
    print(f"Failed: {total_files - successful_files}")
    print(f"Total courses removed: {total_courses_removed}")
    print("===============")

def main():
    # Check command line arguments
    if len(sys.argv) > 1:
        # Process a single file
        file_path = sys.argv[1]
        print(f"Processing single file: {file_path}")
        success, removed = filter_unavailable_courses(file_path)
        if success:
            print(f"Successfully processed file. Removed {removed} unavailable courses.")
        else:
            print("Failed to process file.")
            sys.exit(1)
    else:
        # Process all files
        process_all_files()

if __name__ == "__main__":
    main() 