#!/usr/bin/env python3
"""
Script to fix the field name in course JSON files, changing "bullet_points" to "bulletpoints".

This script:
1. Processes one or all JSON files in the courses directory
2. For each course with "bullet_points", moves the content to "bulletpoints"
3. Saves the updated JSON files

Usage:
    python3 fix_bullet_points_field_name.py [path/to/file.json]

If no file is specified, it will process all JSON files in the courses directory.
"""

import json
import os
import sys

def fix_field_name(file_path):
    """
    Fix the field name in a JSON file, changing "bullet_points" to "bulletpoints".
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        tuple: (success, fixed_count)
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
        
        fixed_count = 0
        
        # Process each course
        for course in courses:
            # Check if course has "bullet_points" but not "bulletpoints"
            if "bullet_points" in course and course["bullet_points"]:
                if "bulletpoints" not in course or not course["bulletpoints"]:
                    # Move content from "bullet_points" to "bulletpoints"
                    course["bulletpoints"] = course["bullet_points"]
                    # Remove the old field to avoid duplicates
                    del course["bullet_points"]
                    fixed_count += 1
        
        # Only save if we fixed any courses
        if fixed_count > 0:
            print(f"Fixed {fixed_count} courses in {file_path}")
            
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
                return False, fixed_count
                
            # Verify the save worked
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    verify_courses = json.load(file)
                    
                # Check if the field name was fixed
                verified = True
                for course in verify_courses:
                    if "bullet_points" in course and "bulletpoints" not in course:
                        verified = False
                        break
                
                if verified:
                    print("Verification successful: Field names were fixed correctly")
                else:
                    print("WARNING: Verification failed - Some courses still have the wrong field name")
            except Exception as e:
                print(f"Error during verification: {e}")
        else:
            print(f"No courses needed fixing in {file_path}")
            
        return True, fixed_count
        
    except Exception as e:
        print(f"Unexpected error processing file: {e}")
        return False, 0

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
    # Process a single file or all files
    if len(sys.argv) > 1:
        # Process a single file
        file_path = sys.argv[1]
        success, fixed_count = fix_field_name(file_path)
        if success:
            print(f"Successfully fixed {fixed_count} courses in {file_path}")
        else:
            print(f"Failed to fix {file_path}")
    else:
        # Process all files in the courses directory
        courses_dir = find_courses_directory()
        if not courses_dir:
            print("Error: Could not find courses directory.")
            sys.exit(1)
        
        # Get all JSON files in the directory
        json_files = [f for f in os.listdir(courses_dir) if f.endswith('.json')]
        if not json_files:
            print(f"Error: No JSON files found in {courses_dir}")
            sys.exit(1)
            
        print(f"Found {len(json_files)} JSON files to process")
        
        # Process all files
        total_files = len(json_files)
        successful_files = 0
        total_fixed = 0
        
        for i, file in enumerate(json_files, 1):
            file_path = os.path.join(courses_dir, file)
            print(f"\nProcessing file {i}/{total_files}: {file}")
            
            success, fixed_count = fix_field_name(file_path)
            
            if success:
                successful_files += 1
                total_fixed += fixed_count
            
            print(f"File {i}/{total_files} completed")
        
        # Print summary
        print("\n=== SUMMARY ===")
        print(f"Total files processed: {total_files}")
        print(f"Successfully processed files: {successful_files}")
        print(f"Total courses fixed: {total_fixed}")
        print("===============")

if __name__ == "__main__":
    main() 